import duckdb
import pandas as pd
import numpy as np
from typing import Dict, Any, List

class DataProfiler:
    """
    DuckDB and Pandas powered dataset profiling and column data-type detection engine.
    """
    
    @staticmethod
    def profile_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Profiles a pandas DataFrame, detecting types and calculating statistical summaries.
        """
        total_rows, total_cols = df.shape
        columns_info = []

        for col in df.columns:
            series = df[col]
            non_null_count = int(series.count())
            null_count = int(series.isnull().sum())
            null_percentage = round((null_count / total_rows) * 100, 2) if total_rows > 0 else 0
            unique_count = int(series.nunique())

            # Infer data type
            inferred_type = DataProfiler._infer_column_type(series)

            # Extract sample values (top 5 non-null)
            sample_values = series.dropna().unique()[:5].tolist()
            # Convert numpy/pandas types to standard python types for JSON serialization
            sample_values = [DataProfiler._clean_value(val) for val in sample_values]

            col_meta = {
                "name": str(col),
                "inferred_type": inferred_type,
                "null_count": null_count,
                "null_percentage": null_percentage,
                "unique_count": unique_count,
                "sample_values": sample_values,
                "stats": {}
            }

            # Statistical summaries based on type
            if inferred_type in ["integer", "float", "numeric"]:
                numeric_series = pd.to_numeric(series.dropna(), errors="coerce")
                if not numeric_series.empty:
                    col_meta["stats"] = {
                        "min": DataProfiler._clean_value(numeric_series.min()),
                        "max": DataProfiler._clean_value(numeric_series.max()),
                        "mean": DataProfiler._clean_value(round(numeric_series.mean(), 2)),
                        "median": DataProfiler._clean_value(round(numeric_series.median(), 2)),
                        "std": DataProfiler._clean_value(round(numeric_series.std(), 2)) if len(numeric_series) > 1 else 0
                    }
            elif inferred_type == "categorical":
                val_counts = series.value_counts().head(5).to_dict()
                col_meta["stats"] = {
                    "top_categories": {str(k): int(v) for k, v in val_counts.items()}
                }
            elif inferred_type == "datetime":
                dt_series = pd.to_datetime(series.dropna(), errors="coerce")
                if not dt_series.empty:
                    col_meta["stats"] = {
                        "min_date": dt_series.min().isoformat(),
                        "max_date": dt_series.max().isoformat()
                    }

            columns_info.append(col_meta)

        return {
            "total_rows": total_rows,
            "total_columns": total_cols,
            "columns": columns_info
        }

    @staticmethod
    def _infer_column_type(series: pd.Series) -> str:
        """Infers high level semantic data type."""
        dtype_str = str(series.dtype).lower()

        if "int" in dtype_str:
            return "integer"
        elif "float" in dtype_str:
            return "float"
        elif "datetime" in dtype_str or "timestamp" in dtype_str:
            return "datetime"
        elif "bool" in dtype_str:
            return "boolean"
        
        # Try datetime conversion for string series
        cleaned = series.dropna().astype(str)
        if cleaned.empty:
            return "text"

        # Check if text column can be parsed as dates
        if len(cleaned) > 0:
            sample = cleaned.head(20)
            try:
                pd.to_datetime(sample, errors="raise", format="mixed")
                return "datetime"
            except Exception:
                pass

        # Distinguish between categorical and text
        unique_ratio = series.nunique() / len(series) if len(series) > 0 else 1.0
        if unique_ratio < 0.2 or series.nunique() <= 30:
            return "categorical"

        return "text"

    @staticmethod
    def _clean_value(val: Any) -> Any:
        if pd.isna(val):
            return None
        if isinstance(val, (np.integer, np.int64, np.int32)):
            return int(val)
        if isinstance(val, (np.floating, np.float64, np.float32)):
            return float(val)
        if isinstance(val, (pd.Timestamp, np.datetime64)):
            return str(val)
        return val
