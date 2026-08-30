import duckdb
import pandas as pd
import os
from typing import List, Dict, Any

class DuckDBEngine:
    """
    DuckDB SQL analytical execution engine for dataset file queries and chart aggregations.
    """
    
    @staticmethod
    def query_file(file_path: str, sql_query: str) -> List[Dict[str, Any]]:
        """
        Executes a SQL query against a dataset file (CSV, Parquet, Excel, JSON) using DuckDB.
        Replaces 'dataset' table alias with read_csv_auto/read_parquet/read_json.
        """
        ext = os.path.splitext(file_path)[1].lower()
        clean_path = str(file_path).replace("\\", "/")
        conn = duckdb.connect(database=':memory:')

        # Register dataset table
        if ext == '.csv':
            conn.execute(f"CREATE TABLE dataset AS SELECT * FROM read_csv_auto('{clean_path}')")
        elif ext == '.parquet':
            conn.execute(f"CREATE TABLE dataset AS SELECT * FROM read_parquet('{clean_path}')")
        elif ext == '.json':
            conn.execute(f"CREATE TABLE dataset AS SELECT * FROM read_json_auto('{clean_path}')")
        elif ext in ['.xlsx', '.xls']:
            df = pd.read_excel(file_path)
            conn.register('dataset', df)
        else:
            conn.execute(f"CREATE TABLE dataset AS SELECT * FROM read_csv_auto('{clean_path}')")

        try:
            res_df = conn.execute(sql_query).fetchdf()
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
    def generate_chart_data(file_path: str, x_axis: str, y_axis: str, agg: str = "SUM", limit: int = 15) -> List[Dict[str, Any]]:
        """
        Generates aggregated chart data points using DuckDB SQL queries.
        """
        agg_upper = agg.upper() if agg in ["SUM", "AVG", "COUNT", "MIN", "MAX"] else "SUM"
        
        if agg_upper == "COUNT" or not y_axis or x_axis == y_axis:
            query = f"""
                SELECT "{x_axis}" AS {x_axis}, COUNT(*) AS count 
                FROM dataset 
                WHERE "{x_axis}" IS NOT NULL 
                GROUP BY "{x_axis}" 
                ORDER BY count DESC 
                LIMIT {limit}
            """
        else:
            query = f"""
                SELECT "{x_axis}" AS {x_axis}, {agg_upper}("{y_axis}") AS {y_axis} 
                FROM dataset 
                WHERE "{x_axis}" IS NOT NULL AND "{y_axis}" IS NOT NULL 
                GROUP BY "{x_axis}" 
                ORDER BY {y_axis} DESC 
                LIMIT {limit}
            """
        try:
            return DuckDBEngine.query_file(file_path, query)
        except Exception:
            fallback_query = f'SELECT "{x_axis}", "{y_axis}" FROM dataset LIMIT {limit}'
            try:
                return DuckDBEngine.query_file(file_path, fallback_query)
            except Exception:
                return []
