import time
import math
from typing import Dict, Any, List, Optional
from app.analytics_engine.duckdb_engine import DuckDBEngine
from app.core.logging import get_logger

logger = get_logger("app.ai.agents.toolbox")


class ForensicToolbox:
    """
    Forensic Data Science & SQL Toolkit for Autonomous Investigator Agent.
    All operations execute deterministically inside DuckDB.
    """

    def __init__(self, file_path: str):
        self.file_path = file_path

    def execute_sql(self, sql_query: str) -> Dict[str, Any]:
        """Runs a sanitized DuckDB analytical SQL query and returns exact data points."""
        t0 = time.time()
        try:
            records = DuckDBEngine.query_file(self.file_path, sql_query)
            elapsed_ms = round((time.time() - t0) * 1000, 2)
            columns = list(records[0].keys()) if records else []
            return {
                "success": True,
                "row_count": len(records),
                "columns": columns,
                "data": records[:15],
                "execution_ms": elapsed_ms,
            }
        except Exception as e:
            elapsed_ms = round((time.time() - t0) * 1000, 2)
            return {
                "success": False,
                "error": str(e),
                "execution_ms": elapsed_ms,
            }

    def get_column_stats(self, column_name: str) -> Dict[str, Any]:
        """Calculates statistical distribution metrics for a specific column."""
        sql = f"""
            SELECT 
                COUNT(*) as total_count,
                COUNT("{column_name}") as non_null_count,
                COUNT(DISTINCT "{column_name}") as distinct_count,
                MIN(TRY_CAST("{column_name}" AS DOUBLE)) as min_val,
                MAX(TRY_CAST("{column_name}" AS DOUBLE)) as max_val,
                AVG(TRY_CAST("{column_name}" AS DOUBLE)) as avg_val,
                STDDEV(TRY_CAST("{column_name}" AS DOUBLE)) as std_val
            FROM dataset
        """
        res = self.execute_sql(sql)
        if res.get("success") and res.get("data"):
            return res["data"][0]
        return {}

    def test_correlation(self, col_a: str, col_b: str) -> Dict[str, Any]:
        """Computes Pearson correlation coefficient between two continuous numeric variables."""
        sql = f"""
            SELECT CORR(
                TRY_CAST("{col_a}" AS DOUBLE), 
                TRY_CAST("{col_b}" AS DOUBLE)
            ) as correlation
            FROM dataset
            WHERE "{col_a}" IS NOT NULL AND "{col_b}" IS NOT NULL
        """
        res = self.execute_sql(sql)
        if res.get("success") and res.get("data"):
            corr = res["data"][0].get("correlation")
            clean_corr = round(corr, 4) if corr is not None and not math.isnan(corr) else 0.0
            return {
                "metric_a": col_a,
                "metric_b": col_b,
                "correlation": clean_corr,
                "relationship": (
                    "Strong Positive" if clean_corr > 0.6
                    else "Moderate Positive" if clean_corr > 0.3
                    else "Strong Negative" if clean_corr < -0.6
                    else "Moderate Negative" if clean_corr < -0.3
                    else "Weak / No Correlation"
                )
            }
        return {"error": "Failed to compute correlation"}

    def check_cohort_breakdown(
        self,
        cohort_col: str,
        metric_col: str,
        agg: str = "SUM",
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Groups data by a categorical cohort and calculates aggregated metric sums/averages."""
        agg_upper = agg.upper() if agg in ["SUM", "AVG", "COUNT", "MIN", "MAX"] else "SUM"
        if metric_col == "*" or cohort_col == metric_col:
            sql = f'SELECT "{cohort_col}", COUNT(*) as count FROM dataset WHERE "{cohort_col}" IS NOT NULL GROUP BY 1 ORDER BY count DESC LIMIT {limit}'
        else:
            sql = f'SELECT "{cohort_col}", {agg_upper}("{metric_col}") as "{metric_col}" FROM dataset WHERE "{cohort_col}" IS NOT NULL AND "{metric_col}" IS NOT NULL GROUP BY 1 ORDER BY "{metric_col}" DESC LIMIT {limit}'

        res = self.execute_sql(sql)
        return res.get("data", []) if res.get("success") else []

    def get_tool_manifest(self) -> List[Dict[str, str]]:
        """Returns the list of available tools with instructions for the ReAct loop."""
        return [
            {
                "tool": "execute_sql",
                "params": "sql_query (str)",
                "description": "Execute any DuckDB SQL query to aggregate, filter, group, or order data."
            },
            {
                "tool": "get_column_stats",
                "params": "column_name (str)",
                "description": "Get min, max, avg, stddev, null counts for a numeric column."
            },
            {
                "tool": "test_correlation",
                "params": "col_a (str), col_b (str)",
                "description": "Calculate statistical correlation between two numeric metrics."
            },
            {
                "tool": "check_cohort_breakdown",
                "params": "cohort_col (str), metric_col (str), agg (str)",
                "description": "Group by categorical cohort and aggregate a numeric metric (SUM, AVG, COUNT)."
            }
        ]
