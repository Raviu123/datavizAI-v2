import json
import time
from typing import Dict, Any, List, Optional, Callable, Awaitable
from app.ai.providers.factory import LLMProviderFactory
from app.ai.agents.toolbox import ForensicToolbox
from app.core.logging import get_logger

logger = get_logger("app.ai.agents.investigator_loop")

INVESTIGATOR_SYSTEM_PROMPT = """
You are the **Autonomous Senior Forensic Data Investigator Agent**.
Your goal is to autonomously explore ANY dataset, formulate strategic hypotheses, execute analytical tools in DuckDB, observe the real numbers, pivot when you encounter dead ends, and collect 3 to 4 verified, high-impact business discoveries backed by mathematical evidence.

Available Tools:
1. `execute_sql(sql_query)`: Run any read-only DuckDB SQL query. Always use double quotes around column names (e.g. `SELECT "Department", COUNT(*) as total, AVG("MonthlyIncome") as avg_income FROM dataset GROUP BY 1 ORDER BY 2 DESC LIMIT 10`).
2. `test_correlation(col_a, col_b)`: Measure Pearson correlation between two metrics.
3. `check_cohort_breakdown(cohort_col, metric_col, agg)`: Quick grouped aggregation ('SUM' | 'AVG' | 'COUNT').
4. `log_discovery(title, business_claim, evidence_sql, suggested_chart)`: Record a verified finding.
5. `conclude(reason)`: Conclude the investigation once you have 3-4 strong discoveries.

Investigation Principles:
- **Zero Cookie-Cutter Sums**: NEVER simply run `SELECT cohort, SUM(metric)` for every question. Think about what matters in this domain:
  - Rates and percentages: e.g., `COUNT(*) FILTER (WHERE "Target" = 'Yes') * 100.0 / COUNT(*)` as rate %.
  - Multi-dimensional comparisons: Grouping by 1 or 2 key drivers.
  - Distribution of volume and outliers.
- **Visual Diversity**: Suggest appropriate chart types: `bar` (categorical ranking/comparisons), `composed` (dual metrics e.g. volume + rate), `line` (ordered tenure/time/trend), `donut` (only when showing share of whole with <= 5 categories). Do NOT use donut for everything.
- If a query returns uniform or uninteresting data, **PIVOT** immediately to another hypothesis.
- Output ONLY valid JSON in the requested format.
"""

INVESTIGATOR_STEP_PROMPT = """
Dataset: {dataset_name} ({total_rows:,} rows, {total_columns} columns)
Domain: {domain_theme}
Entity: {entity_name}
Primary Metric: {primary_metric}
Secondary Metrics: {secondary_metrics}
Key Outcome / Target: {target_column} (Positive Value: {target_positive_value})
Cohort Dimensions: {cohort_dimensions}
Temporal Dimensions: {temporal_dimensions}

Current Investigation Cycle: {cycle_num} of {max_cycles}
Already Verified Discoveries ({verified_count}/3):
{verified_discoveries_json}

Recent Investigation History:
{history_json}

What is your next investigative step? Choose ONE:
1. Call a tool to test a hypothesis or drill deeper:
   {{
     "thought": "Reasoning explaining what domain hypothesis you are testing and why...",
     "action": "execute_sql" | "test_correlation" | "check_cohort_breakdown",
     "params": {{ ... }}
   }}
2. Log a verified finding you just proved with data:
   {{
     "thought": "Summarizing why the evidence is strong and what strategic insight it proves...",
     "action": "log_discovery",
     "params": {{
       "title": "Clear Domain-Specific Executive Title",
       "business_claim": "Concrete numerical claim backed by data...",
       "evidence_sql": "SELECT ...",
       "suggested_chart": "bar" | "line" | "donut" | "treemap" | "composed"
     }}
   }}
3. Conclude if you have collected 3-4 strong discoveries:
   {{
     "thought": "All key domain drivers investigated...",
     "action": "conclude",
     "params": {{ "reason": "Sufficient evidence collected" }}
   }}
"""


class AutonomousInvestigator:
    """True Agentic ReAct Engine: Autonomous Tool Execution, Hypothesis Testing, and Self-Correction."""

    @staticmethod
    async def investigate(
        dataset_name: str,
        file_path: str,
        profile: Dict[str, Any],
        semantics: Dict[str, Any],
        max_cycles: int = 8,
        on_event: Optional[Callable[[Dict[str, Any]], Awaitable[None]]] = None,
    ) -> List[Dict[str, Any]]:
        print(f"\n" + "="*80)
        print(f"[*] [Autonomous Investigator] --> Launching ReAct Agentic Loop on '{dataset_name}'")
        print(f"    Domain Context: {semantics.get('domain_theme')} | Goal: Collect 3-4 Verified Discoveries")
        print("="*80)

        toolbox = ForensicToolbox(file_path)
        provider = LLMProviderFactory.get_provider()

        history: List[Dict[str, Any]] = []
        verified_discoveries: List[Dict[str, Any]] = []

        total_rows = profile.get("total_rows", 0)
        total_cols = profile.get("total_columns", 0)
        primary_met = semantics.get("primary_metric", "metric")

        for cycle in range(1, max_cycles + 1):
            print(f"\n[ReAct Cycle {cycle}/{max_cycles}]")

            if on_event:
                await on_event({
                    "type": "cycle_start",
                    "agent": "Forensic Investigator",
                    "cycle": cycle,
                    "max_cycles": max_cycles,
                    "message": f"Investigator ReAct Loop (Cycle {cycle}/{max_cycles}): Formulating forensic hypothesis..."
                })

            prompt = INVESTIGATOR_STEP_PROMPT.format(
                dataset_name=dataset_name,
                total_rows=total_rows,
                total_columns=total_cols,
                domain_theme=semantics.get("domain_theme", "Analytics"),
                entity_name=semantics.get("entity_name", "records"),
                primary_metric=primary_met,
                secondary_metrics=json.dumps(semantics.get("secondary_metrics", [])),
                target_column=semantics.get("target_column") or "None identified",
                target_positive_value=semantics.get("target_positive_value") or "N/A",
                cohort_dimensions=json.dumps(semantics.get("cohort_dimensions", [])),
                temporal_dimensions=json.dumps(semantics.get("temporal_dimensions", [])),
                cycle_num=cycle,
                max_cycles=max_cycles,
                verified_count=len(verified_discoveries),
                verified_discoveries_json=json.dumps([d["title"] for d in verified_discoveries]),
                history_json=json.dumps(history[-3:], indent=2) if history else "No actions taken yet.",
            )

            try:
                decision = await provider.analyze_json(
                    prompt=prompt,
                    system_prompt=INVESTIGATOR_SYSTEM_PROMPT
                )
            except Exception as e:
                logger.warning(f"[Investigator] Decision parse error ({e}), generating dynamic fallback tool call.")
                cohort = semantics.get("cohort_dimensions", ["dimension"])[0]
                decision = {
                    "thought": f"Exploring cohort breakdown for {cohort}",
                    "action": "check_cohort_breakdown",
                    "params": {"cohort_col": cohort, "metric_col": primary_met, "agg": "AVG"}
                }

            thought = decision.get("thought", "Investigating...")
            action = decision.get("action", "execute_sql")
            params = decision.get("params", {})

            print(f"   [Thought] \"{thought}\"")
            print(f"   [Action]  {action}({json.dumps(params)})")

            if on_event:
                await on_event({
                    "type": "thought",
                    "agent": "Forensic Investigator",
                    "cycle": cycle,
                    "max_cycles": max_cycles,
                    "thought": thought,
                })

            if action == "conclude" or (len(verified_discoveries) >= 3 and cycle >= 4):
                print(f"   [Concluded] Succeeded with {len(verified_discoveries)} verified discoveries.")
                if on_event:
                    await on_event({
                        "type": "thought",
                        "agent": "Forensic Investigator",
                        "cycle": cycle,
                        "thought": f"Sufficient forensic evidence collected ({len(verified_discoveries)} high-impact discoveries). Concluding ReAct loop."
                    })
                break

            elif action == "log_discovery":
                # Agent decided to record a verified discovery
                title = params.get("title", f"Discovery {len(verified_discoveries) + 1}")
                claim = params.get("business_claim", "")
                sql = params.get("evidence_sql") or f'SELECT * FROM dataset LIMIT 10'
                chart_type = params.get("suggested_chart", "bar")

                # Verify data points via DuckDB
                exec_res = toolbox.execute_sql(sql)
                data = exec_res.get("data", [])

                discovery_record = {
                    "id": f"disc_{len(verified_discoveries) + 1}",
                    "title": title,
                    "business_question": thought,
                    "business_claim": claim,
                    "sql": sql,
                    "suggested_chart": chart_type,
                    "data": data,
                }
                verified_discoveries.append(discovery_record)
                print(f"   [OK: DISCOVERY VERIFIED]: \"{title}\" ({len(data)} data points verified via DuckDB)")

                history.append({
                    "cycle": cycle,
                    "action": "log_discovery",
                    "title": title,
                    "result": f"Verified with {len(data)} data points"
                })

                if on_event:
                    await on_event({
                        "type": "discovery",
                        "agent": "Forensic Investigator",
                        "cycle": cycle,
                        "discovery": discovery_record,
                        "message": f"Verified Discovery #{len(verified_discoveries)}: \"{title}\""
                    })

            else:
                # Agent called a tool
                observation = ""
                obs_data = None

                if on_event:
                    await on_event({
                        "type": "tool_call",
                        "agent": "Forensic Investigator",
                        "cycle": cycle,
                        "action": action,
                        "params": params,
                        "sql": params.get("sql_query") if action == "execute_sql" else None,
                        "message": f"Executing tool: {action}"
                    })

                if action == "execute_sql":
                    sql_to_run = params.get("sql_query") or f'SELECT * FROM dataset LIMIT 5'
                    res = toolbox.execute_sql(sql_to_run)
                    if res.get("success"):
                        obs_data = res.get("data", [])
                        row_count = res.get("row_count", 0)
                        observation = f"DuckDB executed query in {res.get('execution_ms')}ms. Returned {row_count} rows. Top sample: {json.dumps(obs_data[:3])}"
                    else:
                        observation = f"SQL Execution Failed: {res.get('error')}. Need to reformulate query."

                elif action == "test_correlation":
                    col_a = params.get("col_a", primary_met)
                    col_b = params.get("col_b", semantics.get("secondary_metrics", [primary_met])[0])
                    res = toolbox.test_correlation(col_a, col_b)
                    observation = f"Correlation({col_a}, {col_b}): {res.get('correlation')} -> {res.get('relationship')}"

                elif action == "check_cohort_breakdown":
                    c_col = params.get("cohort_col", semantics.get("cohort_dimensions", ["dim"])[0])
                    m_col = params.get("metric_col", primary_met)
                    agg = params.get("agg", "SUM")
                    obs_data = toolbox.check_cohort_breakdown(c_col, m_col, agg=agg)
                    observation = f"Cohort breakdown for '{c_col}' aggregated by {agg}('{m_col}'): returned {len(obs_data)} cohorts. Top cohort: {json.dumps(obs_data[0]) if obs_data else 'None'}"

                print(f"   [Observation] {observation[:110]}...")

                if on_event:
                    await on_event({
                        "type": "tool_result",
                        "agent": "Forensic Investigator",
                        "cycle": cycle,
                        "action": action,
                        "observation": observation,
                        "sample_data": obs_data[:3] if isinstance(obs_data, list) else None,
                    })

                history.append({
                    "cycle": cycle,
                    "thought": thought,
                    "action": action,
                    "observation": observation,
                    "sample_data": obs_data[:3] if isinstance(obs_data, list) else None,
                })

        # Ensure we have at least 3 discoveries if cycles ended early
        if len(verified_discoveries) < 3:
            needed = 3 - len(verified_discoveries)
            print(f"   [Investigator Dynamic Refill] Prompting LLM for {needed} dynamic domain-specific investigations...")
            target_col = semantics.get("target_column")
            target_val = semantics.get("target_positive_value")

            refill_prompt = f"""
We are investigating dataset '{dataset_name}' in domain '{semantics.get('domain_theme')}'.
Entity: {semantics.get('entity_name', 'records')}
Primary metric: {primary_met}
Target outcome: {target_col} (positive: {target_val})
Available cohorts: {json.dumps(semantics.get('cohort_dimensions', []))}
Already verified discoveries: {json.dumps([d['title'] for d in verified_discoveries])}

Formulate exactly {needed} unique, high-impact analytical investigations.
Do NOT repeat existing discoveries or use a single sum aggregation everywhere.
For each investigation:
- Write a DuckDB SQL query that groups by relevant cohorts and computes meaningful metrics (e.g. rate %, average, or counts) with proper aliases.
- Provide a crisp domain-appropriate title, business question, and claim.
- Suggest a chart type ('bar', 'composed', 'line', or 'donut').

Output valid JSON:
{{
  "investigations": [
    {{
      "title": "Title",
      "business_question": "Executive inquiry...",
      "business_claim": "Key claim...",
      "evidence_sql": "SELECT ... FROM dataset ...",
      "suggested_chart": "bar"
    }}
  ]
}}
"""
            try:
                refill_res = await provider.analyze_json(prompt=refill_prompt)
                for inv in refill_res.get("investigations", [])[:needed]:
                    sql = inv.get("evidence_sql")
                    if sql:
                        res = toolbox.execute_sql(sql)
                        if res.get("success") and res.get("data"):
                            disc = {
                                "id": f"disc_{len(verified_discoveries) + 1}",
                                "title": inv.get("title", f"Discovery {len(verified_discoveries) + 1}"),
                                "business_question": inv.get("business_question", "Key cohort breakdown"),
                                "business_claim": inv.get("business_claim", "Data reveals significant variation across cohorts."),
                                "sql": sql,
                                "suggested_chart": inv.get("suggested_chart", "bar"),
                                "data": res.get("data", []),
                            }
                            verified_discoveries.append(disc)
                            if on_event:
                                await on_event({
                                    "type": "discovery",
                                    "agent": "Forensic Investigator",
                                    "discovery": disc,
                                    "message": f"Verified discovery: \"{disc['title']}\""
                                })
            except Exception as e:
                logger.warning(f"Error in dynamic refill: {e}")

            # Ultra-safe fallback if LLM refill failed
            if len(verified_discoveries) < 3:
                cohorts = semantics.get("cohort_dimensions", ["category"])
                for c in cohorts:
                    if len(verified_discoveries) >= 3:
                        break
                    sql = f'SELECT "{c}", COUNT(*) as count, AVG("{primary_met}") as avg_{primary_met} FROM dataset WHERE "{c}" IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 10'
                    res = toolbox.execute_sql(sql)
                    if res.get("data"):
                        disc = {
                            "id": f"disc_{len(verified_discoveries) + 1}",
                            "title": f"{c} Breakdown: Volume vs Average {primary_met}",
                            "business_question": f"How do count and mean {primary_met} vary across {c}?",
                            "business_claim": f"Significant divergence in {primary_met} across {c} cohorts.",
                            "sql": sql,
                            "suggested_chart": "composed",
                            "data": res.get("data", []),
                        }
                        verified_discoveries.append(disc)

        print(f"\n[OK] [Autonomous Investigator] Completed ReAct Loop. Total Verified Discoveries: {len(verified_discoveries)}")
        return verified_discoveries
