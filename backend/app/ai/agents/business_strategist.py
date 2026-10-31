import json
from typing import Dict, Any, List
from app.ai.providers.factory import LLMProviderFactory
from app.core.logging import get_logger

logger = get_logger("app.ai.agents.business_strategist")

BUSINESS_STRATEGIST_PROMPT = """
You are the **Chief Strategy Officer & Business Hypothesis Agent**.
Your goal is to formulate 4 sharp, strategic executive hypotheses and analytical questions that a CEO, CFO, or VP would demand to understand this business.

Dataset: {dataset_name}
Total Rows: {total_rows}
Total Columns: {total_columns}

Identified Statistical Anomalies & Red Flags:
{anomalies_json}

Available Columns:
{column_names_json}

Instructions:
Formulate 4 distinct strategic investigations:
1. **Core Revenue / Performance Breakdown**: How top categories, segments, or reps drive performance.
2. **Temporal Trend / Trajectory**: How volume or growth progresses over time/months.
3. **Risk / Margin / Outlier Investigation**: Directly investigate one of the anomalies detected by the Anomaly Scout.
4. **Pareto 80/20 or Concentration Analysis**: Identify the highest value concentration segment.

For each investigation, specify:
- `id`: unique ID (e.g. "hypo_1")
- `title`: Executive Section Title (e.g. "Regional Revenue & Margin Distribution")
- `business_question`: The exact analytical question to answer
- `target_dimension`: The categorical or date column to group by
- `target_metric`: The numerical metric column to aggregate
- `aggregation`: "SUM", "AVG", or "COUNT"

Return ONLY a valid JSON object matching this schema:
{{
  "report_title": "Executive Strategic Intelligence Report: Short Catchy Name",
  "hypotheses": [
    {{
      "id": "hypo_1",
      "title": "Section Title",
      "business_question": "What is the breakdown of metric by dimension?",
      "target_dimension": "Column_Name",
      "target_metric": "Column_Name",
      "aggregation": "SUM"
    }}
  ]
}}
"""


class BusinessStrategistAgent:
    """Agent 2: Formulates executive-level analytical investigations and hypotheses."""

    @staticmethod
    async def formulate_hypotheses(
        dataset_name: str,
        profile: Dict[str, Any],
        anomalies: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        print(f"\n[Agent 2: Business Strategist] --> Formulating C-Suite analytical questions from {len(anomalies)} anomalies...")
        logger.info(f"[Agent 2: Business Strategist] Formulating hypotheses for '{dataset_name}'")

        cols = profile.get("columns", [])
        col_names = [c["name"] for c in cols]
        num_cols = [c["name"] for c in cols if c.get("inferred_type") in ["integer", "float", "numeric"]]
        cat_cols = [c["name"] for c in cols if c.get("inferred_type") == "categorical"]
        date_cols = [c["name"] for c in cols if c.get("inferred_type") in ["datetime", "date"]]

        provider = LLMProviderFactory.get_provider()
        prompt = BUSINESS_STRATEGIST_PROMPT.format(
            dataset_name=dataset_name,
            total_rows=profile.get("total_rows", 0),
            total_columns=profile.get("total_columns", 0),
            anomalies_json=json.dumps(anomalies, indent=2),
            column_names_json=json.dumps([{"name": c["name"], "type": c.get("inferred_type")} for c in cols], indent=2),
        )

        try:
            res = await provider.analyze_json(prompt=prompt)
            hypotheses = res.get("hypotheses", [])
            report_title = res.get("report_title", f"Executive Intelligence Briefing: {dataset_name}")
            if hypotheses:
                print(f"   [Agent 2: Business Strategist] Established Report Theme: \"{report_title}\"")
                print(f"   [Agent 2: Business Strategist] Formulated {len(hypotheses)} executive hypotheses:")
                for h in hypotheses:
                    print(f"     - [{h.get('title')}] -- \"{h.get('business_question')}\"")
                return {
                    "report_title": report_title,
                    "hypotheses": hypotheses
                }
        except Exception as e:
            logger.warning(f"[Agent 2: Business Strategist] LLM error ({e}), generating heuristic hypotheses.")

        # Fallback heuristic hypotheses
        hypotheses = []
        dim = cat_cols[0] if cat_cols else (col_names[0] if col_names else "Category")
        met = num_cols[0] if num_cols else (col_names[1] if len(col_names) > 1 else "Value")

        hypotheses.append({
            "id": "hypo_1",
            "title": f"Primary Performance Breakdown by {dim}",
            "business_question": f"How is total {met} distributed across key {dim} segments?",
            "target_dimension": dim,
            "target_metric": met,
            "aggregation": "SUM"
        })

        if date_cols and num_cols:
            d_col = date_cols[0]
            hypotheses.append({
                "id": "hypo_2",
                "title": f"Temporal Trajectory of {met}",
                "business_question": f"What is the progression and growth trend of {met} over time?",
                "target_dimension": d_col,
                "target_metric": met,
                "aggregation": "SUM"
            })

        if len(cat_cols) > 1 and num_cols:
            dim2 = cat_cols[1]
            hypotheses.append({
                "id": "hypo_3",
                "title": f"Secondary Segment Contribution ({dim2})",
                "business_question": f"Which {dim2} categories deliver highest average volume?",
                "target_dimension": dim2,
                "target_metric": met,
                "aggregation": "AVG"
            })

        hypotheses.append({
            "id": "hypo_4",
            "title": "Top-Tier Concentration (Pareto Analysis)",
            "business_question": f"What are the top 10 highest-volume records driving cumulative {met}?",
            "target_dimension": dim,
            "target_metric": met,
            "aggregation": "SUM"
        })

        report_title = f"Executive Performance Audit: {dataset_name}"
        print(f"   [Agent 2: Business Strategist] Heuristic established {len(hypotheses)} investigations.")
        return {
            "report_title": report_title,
            "hypotheses": hypotheses
        }
