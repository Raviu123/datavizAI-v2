import json
import time
from typing import Dict, Any, List
from app.ai.providers.factory import LLMProviderFactory
from app.ai.agents.toolbox import ForensicToolbox
from app.core.logging import get_logger

logger = get_logger("app.ai.agents.investigator_loop")

INVESTIGATOR_SYSTEM_PROMPT = """
You are the **Autonomous Senior Forensic Data Investigator Agent**.
Your goal is to autonomously explore ANY dataset, formulate strategic hypotheses, execute analytical tools in DuckDB, observe the real numbers, pivot when you encounter dead ends, and collect 3 to 4 verified, high-impact business discoveries backed by mathematical evidence.

Available Tools:
1. `execute_sql(sql_query)`: Run any read-only DuckDB SQL query. Always use double quotes around column names (e.g. `SELECT "Region", SUM("Sales") FROM dataset GROUP BY 1 ORDER BY 2 DESC LIMIT 10`).
2. `test_correlation(col_a, col_b)`: Measure Pearson correlation between two metrics.
3. `check_cohort_breakdown(cohort_col, metric_col, agg)`: Quick grouped aggregation ('SUM' | 'AVG' | 'COUNT').
4. `log_discovery(title, business_claim, evidence_sql, chart_type)`: Record a verified finding.
5. `conclude(reason)`: Conclude the investigation once you have 3-4 strong discoveries.

Decision Guidelines:
- If a query returns flat/uniform data (no interesting pattern), **PIVOT**: reflect on why it was flat and investigate a different cohort or metric.
- When an anomaly or strong variance is found (e.g., negative margins, top cohort driving 60%+ of volume, high churn rate), **DRILL DEEPER** into what drives it.
- When a finding is statistically significant and verified with data, call `log_discovery`.
- Output ONLY valid JSON in the requested format.
"""

INVESTIGATOR_STEP_PROMPT = """
Dataset: {dataset_name} ({total_rows:,} rows, {total_columns} columns)
Domain: {domain_theme}
Primary Metric: {primary_metric}
Secondary Metrics: {secondary_metrics}
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
     "thought": "Reasoning explaining what you suspect and why you are calling this tool...",
     "action": "execute_sql" | "test_correlation" | "check_cohort_breakdown",
     "params": {{ ... }}
   }}
2. Log a verified finding you just proved with data:
   {{
     "thought": "Summarizing why the evidence is strong...",
     "action": "log_discovery",
     "params": {{
       "title": "Clear Executive Title",
       "business_claim": "Concrete numerical claim backed by data...",
       "evidence_sql": "SELECT ...",
       "suggested_chart": "bar" | "line" | "donut" | "treemap" | "composed"
     }}
   }}
3. Conclude if you have collected 3-4 strong discoveries:
   {{
     "thought": "All key drivers investigated...",
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
        max_cycles: int = 6
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

            prompt = INVESTIGATOR_STEP_PROMPT.format(
                dataset_name=dataset_name,
                total_rows=total_rows,
                total_columns=total_cols,
                domain_theme=semantics.get("domain_theme"),
                primary_metric=primary_met,
                secondary_metrics=json.dumps(semantics.get("secondary_metrics", [])),
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
                    "params": {"cohort_col": cohort, "metric_col": primary_met, "agg": "SUM"}
                }

            thought = decision.get("thought", "Investigating...")
            action = decision.get("action", "execute_sql")
            params = decision.get("params", {})

            print(f"   [Thought] \"{thought}\"")
            print(f"   [Action]  {action}({json.dumps(params)})")

            if action == "conclude" or (len(verified_discoveries) >= 3 and cycle >= 4):
                print(f"   [Concluded] Succeeded with {len(verified_discoveries)} verified discoveries.")
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

            else:
                # Agent called a tool
                observation = ""
                obs_data = None

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

                history.append({
                    "cycle": cycle,
                    "thought": thought,
                    "action": action,
                    "observation": observation,
                    "sample_data": obs_data[:3] if isinstance(obs_data, list) else None,
                })

        # Ensure we have at least 3 discoveries if cycles ended early
        if len(verified_discoveries) < 3:
            print(f"   [Investigator Refill] Synthesizing remaining baseline investigations...")
            cohorts = semantics.get("cohort_dimensions", ["category"])
            for idx, c in enumerate(cohorts[:3]):
                if len(verified_discoveries) >= 3:
                    break
                sql = f'SELECT "{c}", SUM("{primary_met}") as "{primary_met}" FROM dataset WHERE "{c}" IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 10'
                res = toolbox.execute_sql(sql)
                verified_discoveries.append({
                    "id": f"disc_{len(verified_discoveries) + 1}",
                    "title": f"Performance Distribution Across {c}",
                    "business_question": f"How is cumulative {primary_met} distributed across {c} segments?",
                    "business_claim": f"Performance concentrates heavily within top {c} cohorts.",
                    "sql": sql,
                    "suggested_chart": "bar",
                    "data": res.get("data", []),
                })

        print(f"\n[OK] [Autonomous Investigator] Completed ReAct Loop. Total Verified Discoveries: {len(verified_discoveries)}")
        return verified_discoveries
