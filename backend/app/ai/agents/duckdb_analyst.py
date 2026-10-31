import time
from typing import Dict, Any, List
from app.analytics_engine.duckdb_engine import DuckDBEngine
from app.core.logging import get_logger

logger = get_logger("app.ai.agents.duckdb_analyst")


class DuckDBAnalystAgent:
    """Agent 3: Quantitative calculation engine executing deterministic SQL against DuckDB."""

    @staticmethod
    def execute_hypotheses(
        file_path: str,
        hypotheses: List[Dict[str, Any]],
        profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        print(f"\n[Agent 3: DuckDB Analyst] --> Compiling and executing vectorized SQL queries for {len(hypotheses)} investigations...")
        logger.info(f"[Agent 3: DuckDB Analyst] Executing SQL on {file_path}")

        cols = profile.get("columns", [])
        col_names = [c["name"] for c in cols]
        num_cols = [c["name"] for c in cols if c.get("inferred_type") in ["integer", "float", "numeric"]]

        # 1. Compute High-Level Global KPIs
        kpi_cards = []
        if num_cols:
            primary_metric = num_cols[0]
            try:
                kpi_sql = f'SELECT SUM("{primary_metric}") as total, AVG("{primary_metric}") as avg, COUNT(*) as count FROM dataset'
                res = DuckDBEngine.query_file(file_path, kpi_sql)
                if res:
                    total_val = res[0].get("total") or 0
                    avg_val = res[0].get("avg") or 0
                    count_val = res[0].get("count") or 0

                    kpi_cards.append({
                        "label": f"Total {primary_metric.replace('_', ' ')}",
                        "value": f"{total_val:,.2f}" if isinstance(total_val, float) else f"{total_val:,}",
                        "subtext": f"Across {count_val:,} operational records",
                        "status": "positive"
                    })
                    kpi_cards.append({
                        "label": f"Average {primary_metric.replace('_', ' ')}",
                        "value": f"{avg_val:,.2f}" if isinstance(avg_val, float) else f"{avg_val:,}",
                        "subtext": "Mean per operational unit",
                        "status": "neutral"
                    })
            except Exception as e:
                logger.warning(f"[Agent 3: DuckDB Analyst] KPI computation error: {e}")

        if len(num_cols) > 1:
            second_metric = num_cols[1]
            try:
                res2 = DuckDBEngine.query_file(file_path, f'SELECT SUM("{second_metric}") as total FROM dataset')
                if res2:
                    val = res2[0].get("total") or 0
                    kpi_cards.append({
                        "label": f"Total {second_metric.replace('_', ' ')}",
                        "value": f"{val:,.2f}" if isinstance(val, float) else f"{val:,}",
                        "subtext": "Cumulative secondary performance metric",
                        "status": "positive"
                    })
            except Exception:
                pass

        # 2. Execute SQL for each strategic hypothesis
        executed_findings = []
        for idx, h in enumerate(hypotheses, 1):
            dim = h.get("target_dimension")
            met = h.get("target_metric")
            agg = (h.get("aggregation") or "SUM").upper()
            if agg not in ["SUM", "AVG", "COUNT", "MIN", "MAX"]:
                agg = "SUM"

            # Validate column existence
            if dim not in col_names:
                dim = col_names[0] if col_names else "dimension"
            if met not in col_names and met != "*":
                met = num_cols[0] if num_cols else col_names[0]

            # Construct optimized analytical query
            is_date = any(k in dim.lower() for k in ["date", "time", "year", "month", "day"])
            if is_date:
                sql = f'SELECT STRFTIME(TRY_CAST("{dim}" AS DATE), \'%Y-%m\') as "{dim}", {agg}("{met}") as "{met}" FROM dataset WHERE "{dim}" IS NOT NULL GROUP BY 1 ORDER BY 1 LIMIT 20'
            elif met == "*" or dim == met:
                sql = f'SELECT "{dim}", COUNT(*) as count FROM dataset WHERE "{dim}" IS NOT NULL GROUP BY 1 ORDER BY count DESC LIMIT 12'
            else:
                sql = f'SELECT "{dim}", {agg}("{met}") as "{met}" FROM dataset WHERE "{dim}" IS NOT NULL AND "{met}" IS NOT NULL GROUP BY 1 ORDER BY "{met}" DESC LIMIT 12'

            t0 = time.time()
            data = []
            try:
                data = DuckDBEngine.query_file(file_path, sql)
            except Exception as sql_err:
                fallback_sql = f'SELECT "{dim}", COUNT(*) as count FROM dataset GROUP BY 1 ORDER BY 2 DESC LIMIT 10'
                try:
                    data = DuckDBEngine.query_file(file_path, fallback_sql)
                    sql = fallback_sql
                except Exception:
                    data = []

            elapsed_ms = round((time.time() - t0) * 1000, 2)
            print(f"   [Agent 3: DuckDB Analyst] Query {idx}/{len(hypotheses)}: {len(data)} rows in {elapsed_ms}ms | SQL: {sql[:65]}...")

            executed_findings.append({
                "id": h.get("id", f"finding_{idx}"),
                "title": h.get("title", f"Finding {idx}"),
                "business_question": h.get("business_question", ""),
                "dimension": dim,
                "metric": met,
                "sql": sql,
                "data": data,
                "execution_ms": elapsed_ms,
            })

        print(f"   [Agent 3: DuckDB Analyst] All queries executed mathematically with 0 LLM calculations.")
        return {
            "kpis": kpi_cards,
            "executed_findings": executed_findings
        }
