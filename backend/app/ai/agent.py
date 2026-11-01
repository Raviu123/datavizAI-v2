import json
import time
import re
from typing import Dict, Any, Optional, List, AsyncGenerator
from app.analytics_engine.duckdb_engine import DuckDBEngine
from app.ai.providers.factory import LLMProviderFactory
from app.core.logging import get_logger

logger = get_logger("app.ai.agent")

AGENT_REACT_SYSTEM_PROMPT = """
You are an expert Autonomous Data Analyst Agent.
You are directly connected to an active dataset loaded in a DuckDB SQL sandbox under table name `dataset`.
You have real-time analytical tools to inspect schema, sample column values, execute queries, and answer ANY data questions.

Available Tools:
1. `execute_sql(sql_query)`:
   Run read-only DuckDB SQL against `dataset`. Always use double quotes around column names (e.g. `SELECT "Department", COUNT(*) as "Headcount" FROM dataset GROUP BY 1 ORDER BY 2 DESC`).
2. `get_column_values(column_name, limit)`:
   Inspect distinct values in a column to verify exact spellings, case sensitivity, or category values (e.g. checking whether Attrition is 'Yes'/'No' or True/False).
3. `finish(answer, wants_chart, chart_type, title)`:
   Conclude your analysis and provide the final natural language answer to the user, formatted with clean markdown, citing exact numbers from your query results.

Guidelines:
- **No Canned Refusals**: NEVER say a question is out of scope if it relates to the data, columns, summary, or business context. For broad questions like "what is this data about?", examine the columns and sample data, explain what the dataset represents, its core themes, and suggest 3 relevant analytical questions tailored to this dataset.
- **Dynamic Reasoning**: Think through which columns and aggregations (ratios, counts, averages, distributions) are mathematically appropriate.
- **Self-Correction**: If a tool call or SQL fails, observe the error and reformulate your query in the next cycle.
- **Output Format**: In each turn, return ONLY a valid JSON object matching this schema:
  {
    "thought": "Your internal chain-of-thought explaining what you understand, what you are checking or calculating, and why...",
    "action": "execute_sql" | "get_column_values" | "finish",
    "params": { ... }
  }
"""

STEP_PROMPT_TEMPLATE = """
Dataset Name: {dataset_name} ({total_rows:,} rows, {total_columns} columns)

Schema & Profiling:
{columns_meta}

Sample Preview Records:
{sample_rows}

Conversation History:
{history_context}
{attached_chart_context}
User Question: "{user_message}"

Previous Agent Steps & Observations in this turn:
{turn_history}

Current ReAct Cycle: {cycle_num} of {max_cycles}

What is your next step? Return ONLY valid JSON:
- If you need to query DuckDB: {{"thought": "...", "action": "execute_sql", "params": {{"sql_query": "SELECT ..."}}}}
- If you need to check column distinct values: {{"thought": "...", "action": "get_column_values", "params": {{"column_name": "...", "limit": 20}}}}
- If you have gathered sufficient information to answer the user directly: {{"thought": "...", "action": "finish", "params": {{"answer": "Your comprehensive markdown answer...", "wants_chart": true/false, "chart_type": "bar"|"line"|"donut"|"composed"|"scatter"|"area", "title": "Chart Title"}}}}
"""


class DataAnalystAgent:
    """
    Truly Autonomous ReAct Data Analyst Agent.
    Operates via multi-step iterative reasoning, DuckDB tool calling, error self-correction,
    and real-time event streaming for interactive thinking disclosure.
    """

    def __init__(self, provider_name: Optional[str] = None):
        self.provider = LLMProviderFactory.get_provider(provider_name)

    async def process_query_stream(
        self,
        dataset_record: Dict[str, Any],
        user_message: str,
        history: Optional[List[Dict[str, Any]]] = None,
        max_cycles: int = 4,
        attached_chart: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        d_name = dataset_record.get("name", "dataset")
        profile = dataset_record.get("profile", {})
        file_path = dataset_record.get("file_path")
        sample_rows = (dataset_record.get("preview_rows") or [])[:5]
        cols = profile.get("columns", [])

        # Build clean column profiling for context
        clean_cols = []
        for c in cols[:30]:
            clean_cols.append({
                "name": c["name"],
                "type": c.get("inferred_type"),
                "unique_count": c.get("unique_count"),
                "null_pct": c.get("null_percentage", 0),
                "samples": c.get("sample_values", [])[:3]
            })

        # History formatting
        history_text = "No previous conversation context."
        if history:
            turns = []
            for h in history[-4:]:
                role = h.get("role", "user").capitalize()
                msg = h.get("message", "")
                turns.append(f"{role}: {msg}")
            history_text = "\n".join(turns)

        # Build attached chart context if provided
        attached_chart_context = ""
        chart_tag = ""
        if attached_chart:
            c_title = attached_chart.get("title", "Attached Visualization")
            c_type = attached_chart.get("chart_type", "chart")
            c_desc = attached_chart.get("description", "")
            cfg = attached_chart.get("config") or {}
            c_x = attached_chart.get("xAxisKey") or cfg.get("xAxisKey") or "Dimension"
            c_y = attached_chart.get("yAxisKeys") or cfg.get("yAxisKeys") or ["Metric"]
            c_data = attached_chart.get("data", [])
            data_sample = c_data[:30] if isinstance(c_data, list) else []
            chart_tag = f" with attached chart '{c_title}' ({c_type})"

            attached_chart_context = f"""
======================================================================
USER ATTACHED CHART CONTEXT:
The user has attached a specific visualization from their dashboard and asked a question about it:
- Chart Title: "{c_title}"
- Chart Type: {str(c_type).upper()}
- Dimension (X-Axis): {c_x}
- Metric(s) (Y-Axis): {c_y}
{f'- Description: {c_desc}' if c_desc else ''}
- Underlying Aggregated Data Points ({len(c_data)} rows):
{json.dumps(data_sample, indent=2)}

Special Guidelines for Attached Visualization:
1. Ground your answer directly in the exact categories, rankings, and numbers shown in this chart.
2. If the user asks 'why' or asks for root-causes (e.g. why one cohort is highest/lowest, what drives this trend), use the execute_sql tool to investigate other columns, correlations, or demographics in the dataset.
3. Reference the exact numbers and categories from the chart in your final explanation.
======================================================================
"""

        turn_history = []
        executed_sqls = []
        last_query_data = None
        final_answer = None
        visualization = None

        logger.info(f"[Agentic Analyst ReAct] Starting loop on '{d_name}' for question: \"{user_message}\"{chart_tag}")

        yield {
            "type": "thought",
            "thought": f"Analyzing question \"{user_message}\"{chart_tag} in context of dataset '{d_name}' ({len(cols)} columns, {profile.get('total_rows', 0):,} rows)..."
        }

        for cycle in range(1, max_cycles + 1):
            prompt = STEP_PROMPT_TEMPLATE.format(
                dataset_name=d_name,
                total_rows=profile.get("total_rows", 0),
                total_columns=profile.get("total_columns", len(cols)),
                columns_meta=json.dumps(clean_cols, indent=2),
                sample_rows=json.dumps(sample_rows[:3], indent=2),
                history_context=history_text,
                attached_chart_context=attached_chart_context,
                user_message=user_message,
                turn_history=json.dumps(turn_history, indent=2) if turn_history else "No prior actions yet.",
                cycle_num=cycle,
                max_cycles=max_cycles
            )

            try:
                decision = await self.provider.analyze_json(
                    prompt=prompt,
                    system_prompt=AGENT_REACT_SYSTEM_PROMPT
                )
            except Exception as e:
                logger.warning(f"[Agentic Analyst] Decision parsing error: {e}")
                decision = {
                    "thought": f"Encountered parsing nuance, checking column distributions directly.",
                    "action": "finish",
                    "params": {"answer": f"I reviewed the dataset **{d_name}** ({profile.get('total_rows', 0):,} rows across {len(cols)} columns). How can I assist you with specific calculations?"}
                }

            thought = decision.get("thought", "Evaluating next step...")
            action = decision.get("action", "finish")
            params = decision.get("params", {})

            yield {
                "type": "thought",
                "cycle": cycle,
                "thought": thought
            }

            if action == "execute_sql":
                sql = params.get("sql_query", "")
                if not sql and "sql" in params:
                    sql = params["sql"]

                yield {
                    "type": "tool_call",
                    "cycle": cycle,
                    "action": "execute_sql",
                    "sql": sql,
                    "params": params
                }

                t0 = time.time()
                obs_text = ""
                data_rows = []
                try:
                    resolved_path = DuckDBEngine._resolve_file_path(file_path) if file_path else file_path
                    data_rows = DuckDBEngine.query_file(resolved_path, sql)
                    elapsed_ms = round((time.time() - t0) * 1000, 2)
                    last_query_data = data_rows
                    executed_sqls.append(sql)
                    row_count = len(data_rows)
                    top_sample = data_rows[:3] if data_rows else []
                    obs_text = f"DuckDB executed query in {elapsed_ms}ms. Returned {row_count} rows. Top records: {json.dumps(top_sample)}"
                except Exception as sql_err:
                    elapsed_ms = round((time.time() - t0) * 1000, 2)
                    obs_text = f"DuckDB Error in {elapsed_ms}ms: {str(sql_err)}. Reformulate query to use correct column names."

                yield {
                    "type": "tool_result",
                    "cycle": cycle,
                    "action": "execute_sql",
                    "observation": obs_text,
                    "rows_count": len(data_rows),
                    "sample": data_rows[:3] if data_rows else None
                }

                turn_history.append({
                    "cycle": cycle,
                    "action": "execute_sql",
                    "sql": sql,
                    "observation": obs_text
                })

            elif action == "get_column_values":
                col = params.get("column_name", "")
                limit = params.get("limit", 20)

                yield {
                    "type": "tool_call",
                    "cycle": cycle,
                    "action": "get_column_values",
                    "params": {"column": col, "limit": limit}
                }

                sample_vals = []
                try:
                    resolved_path = DuckDBEngine._resolve_file_path(file_path) if file_path else file_path
                    sql = f'SELECT DISTINCT "{col}" FROM dataset WHERE "{col}" IS NOT NULL ORDER BY 1 LIMIT {limit}'
                    res = DuckDBEngine.query_file(resolved_path, sql)
                    sample_vals = [r.get(col) for r in res]
                    obs_text = f"Distinct values for column '{col}': {json.dumps(sample_vals[:15])}"
                except Exception as err:
                    obs_text = f"Failed to sample column values: {err}"

                yield {
                    "type": "tool_result",
                    "cycle": cycle,
                    "action": "get_column_values",
                    "observation": obs_text,
                    "sample_values": sample_vals
                }

                turn_history.append({
                    "cycle": cycle,
                    "action": "get_column_values",
                    "column": col,
                    "observation": obs_text
                })

            elif action == "finish":
                final_answer = params.get("answer") or params.get("response") or params.get("message") or params.get("final_answer", "")
                wants_chart = params.get("wants_chart", False)
                chart_type = params.get("chart_type", "bar")
                chart_title = params.get("title", f"Analysis: {user_message[:45]}")

                # Build chart visualization if data is available and suitable
                if last_query_data and len(last_query_data) >= 2:
                    first_row = last_query_data[0]
                    keys = list(first_row.keys())
                    if len(keys) >= 2:
                        x_key = keys[0]
                        y_keys = [k for k in keys if k != x_key]
                        if not y_keys:
                            y_keys = [keys[1]] if len(keys) > 1 else [keys[0]]

                        # Validate chart type
                        valid_types = ["bar", "line", "area", "donut", "pie", "scatter", "composed"]
                        chosen_type = chart_type.lower() if chart_type.lower() in valid_types else "bar"

                        # Time-series auto check
                        x_val_sample = str(first_row.get(x_key, "")).lower()
                        if any(k in x_key.lower() for k in ["date", "time", "month", "year", "quarter"]) or re.match(r'^\d{4}-\d{2}', x_val_sample):
                            chosen_type = "line"

                        visualization = {
                            "chart_type": chosen_type,
                            "title": chart_title,
                            "config": {
                                "xAxisKey": x_key,
                                "yAxisKeys": y_keys,
                                "colorPalette": ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"]
                            },
                            "data": last_query_data[:30]
                        }

                break

        # Fallback synthesis if finish was not explicitly reached
        if not final_answer:
            if last_query_data:
                final_answer = f"Based on the analytical query results:\n\n"
                for r in last_query_data[:10]:
                    final_answer += f"- " + ", ".join(f"**{k}**: {v}" for k, v in r.items()) + "\n"
            else:
                final_answer = (
                    f"Dataset **{d_name}** is loaded and ready for analysis ({profile.get('total_rows', 0):,} records across {len(cols)} columns). "
                    f"You can ask me to calculate rates, discover patterns, compare cohorts, or find anomalies across any dimensions."
                )

        final_sql = executed_sqls[-1] if executed_sqls else None

        yield {
            "type": "final_answer",
            "message": final_answer,
            "sql": final_sql,
            "chart_data": last_query_data,
            "visualization": visualization
        }

    async def process_query(
        self,
        dataset_record: Dict[str, Any],
        user_message: str,
        history: Optional[List[Dict[str, Any]]] = None,
        attached_chart: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Backwards-compatible non-streaming runner."""
        last_event = None
        thoughts = []
        tool_calls = []

        async for event in self.process_query_stream(dataset_record, user_message, history, attached_chart=attached_chart):
            if event.get("type") == "thought" and event.get("thought"):
                thoughts.append(event["thought"])
            elif event.get("type") == "tool_call":
                tool_calls.append(event)
            elif event.get("type") == "final_answer":
                last_event = event

        if not last_event:
            return {
                "message": "Query execution completed.",
                "sql": None,
                "chart_data": None,
                "visualization": None,
                "thoughts": thoughts,
                "tool_calls": tool_calls
            }

        return {
            "message": last_event.get("message", ""),
            "sql": last_event.get("sql"),
            "chart_data": last_event.get("chart_data"),
            "visualization": last_event.get("visualization"),
            "thoughts": thoughts,
            "tool_calls": tool_calls
        }
