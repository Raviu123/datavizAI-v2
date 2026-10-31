import json
from typing import Dict, Any, List
from app.ai.providers.factory import LLMProviderFactory
from app.core.logging import get_logger

logger = get_logger("app.ai.agents.anomaly_scout")

ANOMALY_SCOUT_PROMPT = """
You are the **Anomaly Scout & Data Quality Inspector Agent**.
Your role is to analyze a dataset's column profile and statistical distributions to discover critical data quality issues, distribution skewness, outliers, and business anomalies.

Dataset: {dataset_name}
Total Rows: {total_rows}
Total Columns: {total_columns}

Column Profile & Statistical Summaries:
{columns_json}

Sample Rows (First 5):
{sample_rows_json}

Instructions:
1. Examine null percentages, cardinality, min/max spreads, and standard deviations.
2. Identify 3 to 4 distinct anomalies or significant distribution patterns (e.g., negative values where unexpected, high concentration in one category, high null values, extreme outliers).
3. For each anomaly, state its severity ('critical', 'warning', or 'info'), title, and a clear business explanation.

Return ONLY a valid JSON object matching this schema:
{{
  "anomalies": [
    {{
      "id": "anomaly_1",
      "severity": "critical" | "warning" | "info",
      "column": "Column_Name",
      "title": "Short Descriptive Title",
      "description": "Concrete business explanation of what this anomaly indicates and why management should care."
    }}
  ]
}}
"""


class AnomalyScoutAgent:
    """Agent 1: Discovers outliers, skewness, null spikes, and statistical anomalies."""

    @staticmethod
    async def inspect(
        dataset_name: str,
        profile: Dict[str, Any],
        sample_rows: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        print(f"\n[Agent 1: Anomaly Scout] --> Analyzing dataset profile: '{dataset_name}' ({profile.get('total_rows', 0):,} rows)...")
        logger.info(f"[Agent 1: Anomaly Scout] Inspecting dataset '{dataset_name}'")

        provider = LLMProviderFactory.get_provider()
        prompt = ANOMALY_SCOUT_PROMPT.format(
            dataset_name=dataset_name,
            total_rows=profile.get("total_rows", 0),
            total_columns=profile.get("total_columns", 0),
            columns_json=json.dumps(profile.get("columns", [])[:15], indent=2),
            sample_rows_json=json.dumps(sample_rows[:5], indent=2),
        )

        try:
            res = await provider.analyze_json(prompt=prompt)
            anomalies = res.get("anomalies", [])
            if anomalies:
                print(f"   [Agent 1: Anomaly Scout] Discovered {len(anomalies)} statistical anomalies/flags:")
                for a in anomalies:
                    severity_label = a.get("severity", "info").upper()
                    print(f"     * [{severity_label}] {a.get('title')}: {a.get('description')[:75]}...")
                return anomalies
        except Exception as e:
            logger.warning(f"[Agent 1: Anomaly Scout] LLM error ({e}), generating statistical heuristic anomalies.")

        # Fallback heuristic inspection
        anomalies = []
        cols = profile.get("columns", [])
        for c in cols:
            if c.get("null_percentage", 0) > 10:
                anomalies.append({
                    "id": f"anomaly_null_{c['name']}",
                    "severity": "warning",
                    "column": c["name"],
                    "title": f"Elevated Missing Rate in {c['name']}",
                    "description": f"Column '{c['name']}' has {c.get('null_percentage')}% missing values, which may distort downstream analytical aggregates."
                })
            stats = c.get("stats", {})
            if stats.get("min") is not None and stats.get("max") is not None:
                if stats["min"] < 0:
                    anomalies.append({
                        "id": f"anomaly_neg_{c['name']}",
                        "severity": "critical",
                        "column": c["name"],
                        "title": f"Negative Values Detected in {c['name']}",
                        "description": f"Column '{c['name']}' records negative values (Min: {stats['min']}), indicating potential losses, refunds, or data entry errors."
                    })

        if not anomalies:
            anomalies.append({
                "id": "anomaly_general",
                "severity": "info",
                "column": "General",
                "title": "Healthy Distribution Profile",
                "description": "Dataset schema exhibits standard variance with acceptable null margins across active operational columns."
            })

        print(f"   [Agent 1: Anomaly Scout] Completed inspection with {len(anomalies)} baseline flags.")
        return anomalies
