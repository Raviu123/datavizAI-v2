from typing import Dict, Any, List
from app.core.logging import get_logger

logger = get_logger("app.ai.agents.chart_designer")

PALETTES = [
    ["#6366f1", "#4f46e5", "#818cf8"],  # Indigo
    ["#10b981", "#059669", "#34d399"],  # Emerald
    ["#f59e0b", "#d97706", "#fbbf24"],  # Amber
    ["#ec4899", "#db2777", "#f472b6"],  # Pink
    ["#06b6d4", "#0891b2", "#22d3ee"],  # Cyan
    ["#8b5cf6", "#7c3aed", "#a78bfa"],  # Purple
]


class ChartDesignerAgent:
    """Agent 4: Selects optimal chart representations and builds frontend visual specifications."""

    @staticmethod
    def design_charts(executed_findings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        print(f"\n[Agent 4: Chart Designer] --> Designing publication-grade visualizations for {len(executed_findings)} findings...")
        logger.info("[Agent 4: Chart Designer] Designing visualizations")

        designed_findings = []
        for idx, f in enumerate(executed_findings):
            data = f.get("data", [])
            dim = f.get("dimension")
            met = f.get("metric")

            if not data:
                f["chart"] = None
                designed_findings.append(f)
                continue

            first_row = data[0]
            keys = list(first_row.keys())
            x_key = keys[0] if keys else dim
            y_keys = [keys[1]] if len(keys) > 1 else [keys[0]]

            # Determine optimal chart type
            is_date = any(k in str(x_key).lower() for k in ["date", "time", "month", "year", "day", "period"])
            row_count = len(data)

            if is_date:
                chart_type = "line"
            elif row_count <= 5 and any(k in f.get("title", "").lower() for k in ["share", "distribution", "mix", "proportion"]):
                chart_type = "donut"
            elif row_count > 8 and any(k in f.get("title", "").lower() for k in ["volume", "hierarchy", "product", "sku"]):
                chart_type = "treemap"
            elif len(keys) >= 3:
                chart_type = "composed"
                y_keys = keys[1:3]
            else:
                chart_type = "bar"

            palette = PALETTES[idx % len(PALETTES)]

            chart_spec = {
                "id": f"chart_{f['id']}",
                "title": f.get("title"),
                "chart_type": chart_type,
                "config": {
                    "xAxisKey": x_key,
                    "yAxisKeys": y_keys,
                    "colorPalette": palette,
                    "stacked": False,
                },
                "data": data,
            }

            f["chart"] = chart_spec
            print(f"   [Agent 4: Chart Designer] Finding {idx + 1} paired with: [{chart_type.upper()}] chart ({x_key} vs {', '.join(y_keys)})")
            designed_findings.append(f)

        return designed_findings
