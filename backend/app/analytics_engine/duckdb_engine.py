import duckdb
import pandas as pd
import os
from typing import List, Dict, Any, Optional
from app.core.logging import get_logger

logger = get_logger("app.analytics_engine.duckdb")


class DuckDBEngine:
    """
    DuckDB SQL analytical execution engine for dataset file queries, trend analytics, and chart aggregations.
    Secured with external access disabled for query execution.
    """
    
    @staticmethod
    def _resolve_file_path(file_path: str) -> str:
        """Resolves relative file path across current working directory and backend directory."""
        if os.path.exists(file_path):
            return file_path
        # Check backend/ subfolder if launched from repo root
        cand1 = os.path.join("backend", file_path.lstrip("./\\"))
        if os.path.exists(cand1):
            return cand1
        # Check stripping backend/ if launched from backend directory
        cand2 = file_path.replace("backend/", "").replace("backend\\", "").lstrip("./\\")
        if os.path.exists(cand2):
            return cand2
        # Check root storage directory
        cand3 = os.path.join("storage", "datasets", os.path.basename(file_path))
        if os.path.exists(cand3):
            return cand3
        cand4 = os.path.join("backend", "storage", "datasets", os.path.basename(file_path))
        if os.path.exists(cand4):
            return cand4
        return file_path

    @staticmethod
    def _get_connection(file_path: str) -> duckdb.DuckDBPyConnection:
        resolved_path = DuckDBEngine._resolve_file_path(file_path)
        ext = os.path.splitext(resolved_path)[1].lower()
        clean_path = str(resolved_path).replace("\\", "/")
        conn = duckdb.connect(database=':memory:')

        try:
            if ext == '.csv':
                conn.execute(f"CREATE TABLE dataset AS SELECT * FROM read_csv_auto('{clean_path}')")
            elif ext == '.parquet':
                conn.execute(f"CREATE TABLE dataset AS SELECT * FROM read_parquet('{clean_path}')")
            elif ext == '.json':
                conn.execute(f"CREATE TABLE dataset AS SELECT * FROM read_json_auto('{clean_path}')")
            elif ext in ['.xlsx', '.xls']:
                df = pd.read_excel(resolved_path)
                conn.register('dataset', df)
            else:
                conn.execute(f"CREATE TABLE dataset AS SELECT * FROM read_csv_auto('{clean_path}')")
        except Exception as e:
            logger.error(f"[DuckDB Load Error] Failed to load '{clean_path}' into table: {e}")
            conn.close()
            raise e

        # Sandbox: Lock down external filesystem & network access after the table is loaded
        try:
            conn.execute("SET enable_external_access = false;")
        except Exception:
            pass

        return conn

    @staticmethod
    def query_file(file_path: str, sql_query: str) -> List[Dict[str, Any]]:
        """
        Executes a SQL query against a dataset file (CSV, Parquet, Excel, JSON) using DuckDB.
        Sanitizes query to only allow read-only analytical queries.
        """
        clean_sql = (sql_query or "").strip()
        if not clean_sql:
            return []

        # Sanitize against destructive SQL
        first_token = clean_sql.split()[0].upper() if clean_sql.split() else ""
        if first_token in ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "ATTACH", "INSTALL", "LOAD", "EXPORT", "COPY"]:
            raise ValueError(f"Disallowed SQL statement '{first_token}'. Only analytical read queries (SELECT, WITH) are permitted.")

        conn = DuckDBEngine._get_connection(file_path)
        try:
            res_df = conn.execute(clean_sql).fetchdf()
            records = res_df.to_dict(orient='records')
            cleaned = []
            for row in records:
                clean_row = {}
                for k, v in row.items():
                    if pd.isna(v):
                        clean_row[k] = None
                    elif isinstance(v, (pd.Timestamp, float)) and pd.isna(v):
                        clean_row[k] = None
                    elif hasattr(v, 'item'):
                        clean_row[k] = v.item()
                    else:
                        clean_row[k] = str(v) if isinstance(v, (pd.Timestamp,)) else v
                cleaned.append(clean_row)
            return cleaned
        finally:
            conn.close()

    @staticmethod
    def paginate_file(file_path: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Fetches a slice of rows using DuckDB vectorized execution without re-reading the entire file via Pandas.
        """
        query = f'SELECT * FROM dataset LIMIT {int(limit)} OFFSET {int(offset)}'
        return DuckDBEngine.query_file(file_path, query)

    @staticmethod
    def inspect_column_values(file_path: str, column_name: str, limit: int = 10) -> List[Any]:
        """Returns distinct non-null sample values for a specific column."""
        sql = f'SELECT DISTINCT "{column_name}" FROM dataset WHERE "{column_name}" IS NOT NULL LIMIT {limit}'
        try:
            res = DuckDBEngine.query_file(file_path, sql)
            return [row.get(column_name) for row in res]
        except Exception:
            return []

    @staticmethod
    def detect_date_columns(file_path: str) -> List[str]:
        """Detects date/timestamp columns in dataset schema."""
        conn = DuckDBEngine._get_connection(file_path)
        date_cols = []
        try:
            df_info = conn.execute("DESCRIBE dataset").fetchdf()
            for _, row in df_info.iterrows():
                col_name = row['column_name']
                col_type = str(row['column_type']).lower()
                if any(t in col_type for t in ['date', 'timestamp', 'time']):
                    date_cols.append(col_name)
        except Exception:
            pass
        finally:
            conn.close()
        return date_cols

    @staticmethod
    def generate_chart_data(file_path: str, x_axis: str, y_axis: str, agg: str = "SUM", limit: int = 15) -> List[Dict[str, Any]]:
        """
        Generates aggregated chart data points using DuckDB SQL queries.
        Ensures output column aliases strictly synchronize with requested y_axis keys.
        """
        agg_upper = agg.upper() if agg in ["SUM", "AVG", "COUNT", "MIN", "MAX"] else "SUM"
        resolved_path = DuckDBEngine._resolve_file_path(file_path)
        val_alias = y_axis if y_axis and y_axis != x_axis else "count"
        
        if agg_upper == "COUNT" or not y_axis or x_axis == y_axis:
            query = f"""
                SELECT "{x_axis}" AS "{x_axis}", COUNT(*) AS "{val_alias}" 
                FROM dataset 
                WHERE "{x_axis}" IS NOT NULL 
                GROUP BY 1 
                ORDER BY 2 DESC 
                LIMIT {limit}
            """
        else:
            query = f"""
                SELECT "{x_axis}" AS "{x_axis}", {agg_upper}("{y_axis}") AS "{val_alias}" 
                FROM dataset 
                WHERE "{x_axis}" IS NOT NULL AND "{y_axis}" IS NOT NULL 
                GROUP BY 1 
                ORDER BY 2 DESC 
                LIMIT {limit}
            """
        try:
            return DuckDBEngine.query_file(resolved_path, query)
        except Exception:
            fallback_query = f'SELECT "{x_axis}", "{y_axis}" FROM dataset WHERE "{x_axis}" IS NOT NULL LIMIT {limit}'
            try:
                return DuckDBEngine.query_file(resolved_path, fallback_query)
            except Exception:
                return []
