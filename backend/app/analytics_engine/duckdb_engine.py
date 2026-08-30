import duckdb
import pandas as pd
from pathlib import Path
from typing import Optional, Any
from app.core.logging import get_logger
from app.core.constants import MAX_QUERY_ROWS, ALLOWED_SQL_STATEMENTS

logger = get_logger(__name__)


class DuckDBEngine:
    """
    Analytical execution engine using DuckDB.
    Handles SQL execution against datasets (Parquet/CSV).
    The LLM reasons about data. DuckDB calculates it.
    """

    def __init__(self):
        self._conn: Optional[duckdb.DuckDBPyConnection] = None

    def _get_connection(self) -> duckdb.DuckDBPyConnection:
        if self._conn is None:
            self._conn = duckdb.connect(database=":memory:")
        return self._conn

    def query_parquet(self, parquet_path: str, sql: str) -> list[dict]:
        """Execute SQL against a Parquet file. Returns list of row dicts."""
        validated_sql = self._validate_sql(sql)
        conn = self._get_connection()
        try:
            # Register the parquet file as a view
            conn.execute(f"CREATE OR REPLACE VIEW dataset AS SELECT * FROM read_parquet('{parquet_path}')")
            result = conn.execute(validated_sql).fetchdf()
            if len(result) > MAX_QUERY_ROWS:
                result = result.head(MAX_QUERY_ROWS)
                logger.warning(f"Query result truncated to {MAX_QUERY_ROWS} rows")
            return result.to_dict(orient="records")
        except Exception as e:
            logger.error(f"DuckDB query failed: {e}")
            raise

    def query_csv(self, csv_path: str, sql: str) -> list[dict]:
        """Execute SQL against a CSV file."""
        validated_sql = self._validate_sql(sql)
        conn = self._get_connection()
        try:
            conn.execute(f"CREATE OR REPLACE VIEW dataset AS SELECT * FROM read_csv_auto('{csv_path}')")
            result = conn.execute(validated_sql).fetchdf()
            if len(result) > MAX_QUERY_ROWS:
                result = result.head(MAX_QUERY_ROWS)
            return result.to_dict(orient="records")
        except Exception as e:
            logger.error(f"DuckDB CSV query failed: {e}")
            raise

    def profile_dataframe(self, df: pd.DataFrame) -> dict:
        """Generate statistical profile of a DataFrame."""
        conn = self._get_connection()
        conn.register("df_view", df)
        profile = {
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": [],
        }
        for col in df.columns:
            col_info = {
                "name": col,
                "dtype": str(df[col].dtype),
                "null_count": int(df[col].isna().sum()),
                "null_pct": round(df[col].isna().mean() * 100, 2),
                "unique_count": int(df[col].nunique()),
            }
            if pd.api.types.is_numeric_dtype(df[col]):
                col_info.update({
                    "min": float(df[col].min()) if not df[col].isna().all() else None,
                    "max": float(df[col].max()) if not df[col].isna().all() else None,
                    "mean": float(df[col].mean()) if not df[col].isna().all() else None,
                })
            profile["columns"].append(col_info)
        return profile

    def _validate_sql(self, sql: str) -> str:
        """Validate that SQL only contains allowed statements."""
        stripped = sql.strip().upper()
        first_word = stripped.split()[0] if stripped.split() else ""
        if first_word not in ALLOWED_SQL_STATEMENTS:
            raise ValueError(
                f"SQL statement '{first_word}' is not allowed. "
                f"Only {ALLOWED_SQL_STATEMENTS} statements are permitted."
            )
        return sql

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None


# Singleton instance
duckdb_engine = DuckDBEngine()
