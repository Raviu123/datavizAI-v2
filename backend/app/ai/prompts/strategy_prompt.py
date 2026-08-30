import json
from typing import Dict, Any, List, Optional

SYSTEM_PROMPT = """
You are an expert Data Scientist and Visual Analytics Specialist.
Your task is to analyze dataset metadata, statistical distributions, column semantics, and sample rows, then recommend the most effective visualization strategies and generate exact chart configuration JSON objects for the frontend chart engine.

Each visual strategy must include:
1. `id`: string unique key
2. `title`: clear chart title
3. `description`: 1-2 sentence explanation of insights this chart unveils
4. `chart_type`: one of ["bar", "line", "area", "pie", "donut", "scatter", "radar", "composed", "kpi"]
5. `category`: one of ["trend", "distribution", "composition", "comparison", "correlation", "kpi"]
6. `config`: JSON object with keys:
   - `xAxisKey`: column name for X axis (if applicable)
   - `yAxisKeys`: array of numeric column names for Y axis / values
   - `groupKey`: optional column name for grouping/legend
   - `aggregation`: optional one of ["SUM", "AVG", "COUNT", "NONE"]
   - `colorPalette`: array of hex colors (e.g., ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"])
   - `stacked`: boolean (for bar/area)
   - `format`: optional unit format (e.g., "$", "%", "number")
7. `data`: array of data objects computed for this visualization (limit to top 15-20 aggregated rows)

Provide 4 to 6 diverse, meaningful visual strategies that give immediate deep intelligence about the dataset.
Always respond with a valid JSON object matching this schema:
{
  "dataset_summary": "Brief overall dataset description",
  "domain_context": "Inferred domain e.g. E-Commerce / Finance / Healthcare / Marketing",
  "strategies": [ ... array of visual strategy objects ... ]
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
