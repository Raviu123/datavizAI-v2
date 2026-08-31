import json
from typing import Dict, Any, List, Optional

SYSTEM_PROMPT = """
You are an expert Data Scientist and Visual Analytics Specialist.
Your task is to analyze dataset metadata, statistical distributions, column semantics, and sample rows, then suggest a wide variety of doable visual candidates (8 to 12 candidates) and visual strategies.

Each chart strategy/candidate must include:
1. `id`: string unique key (e.g., "cand_1", "cand_2")
2. `title`: clear chart title
3. `description`: 1-2 sentence explanation of insights this chart unveils
4. `chart_type`: one of ["bar", "line", "area", "pie", "donut", "scatter", "radar", "composed", "treemap", "funnel", "gauge", "bubble", "kpi"]
5. `category`: one of ["trend", "distribution", "composition", "comparison", "correlation", "hierarchy", "funnel", "target", "kpi"]
6. `suitability_score`: number between 0.80 and 1.00 indicating how well suited this chart is for the dataset
7. `recommended`: boolean, true for top recommended charts
8. `config`: JSON object with keys:
   - `xAxisKey`: column name for X axis / primary grouping category
   - `yAxisKeys`: array of numeric column names for Y axis / values
   - `zAxisKey`: optional column name for 3rd metric (e.g. bubble radius)
   - `groupKey`: optional column name for secondary grouping/legend
   - `aggregation`: optional one of ["SUM", "AVG", "COUNT", "MIN", "MAX", "NONE"]
   - `colorPalette`: array of hex colors (e.g., ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"])
   - `stacked`: boolean (for bar/area)
   - `format`: optional unit format (e.g., "$", "%", "number")

Always respond with a valid JSON object matching this schema:
{
  "dataset_summary": "Brief overall dataset description",
  "domain_context": "Inferred domain e.g. E-Commerce / Finance / Healthcare / Marketing",
  "candidates": [ ... array of candidate strategy objects (8-12 candidates) ... ],
  "strategies": [ ... array of selected strategy objects ... ]
}
"""

def build_analysis_prompt(
    dataset_name: str, 
    profile: Dict[str, Any], 
    sample_rows: List[Dict[str, Any]],
    capabilities: Optional[List[Dict[str, Any]]] = None
) -> str:
    capabilities_str = ""
    if capabilities:
        capabilities_str = f"\nFrontend Registered Chart Capabilities:\n{json.dumps(capabilities, indent=2)}\nIMPORTANT: Select ONLY chart types and axis configurations supported by these frontend capabilities."

    prompt = f"""
Dataset Name: {dataset_name}
Total Rows: {profile.get('total_rows', 0)}
Total Columns: {profile.get('total_columns', 0)}

Column Profiles:
{json.dumps(profile.get('columns', []), indent=2)}

Sample Data Rows (First {len(sample_rows)} rows):
{json.dumps(sample_rows, indent=2)}
{capabilities_str}

Analyze this dataset and generate 4 to 6 diverse visual strategies with exact chart configurations for the frontend chart engine.
"""
    return prompt
