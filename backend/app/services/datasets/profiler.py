import pandas as pd
from typing import Any
from app.core.logging import get_logger

logger = get_logger(__name__)


class DataProfiler:
    """
    Generates statistical and semantic profile of a dataset.
    This profile is used as context for the AI agent.
    """

    def profile(self, df: pd.DataFrame, dataset_name: str = "dataset") -> dict:
        """Generate a full data profile."""
        profile = {
            "dataset": dataset_name,
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": [],
        }

        for col in df.columns:
            col_profile = self._profile_column(df[col])
            profile["columns"].append(col_profile)

        return profile

    def _profile_column(self, series: pd.Series) -> dict:
        info: dict[str, Any] = {
            "name": series.name,
            "dtype": str(series.dtype),
            "null_count": int(series.isna().sum()),
            "null_pct": round(series.isna().mean() * 100, 2),
            "unique_count": int(series.nunique()),
            "sample_values": series.dropna().head(5).tolist(),
        }

        # Numeric columns
        if pd.api.types.is_numeric_dtype(series):
            info["role"] = "measure"
            info["semantic_type"] = "numeric"
            if not series.isna().all():
                info["min"] = float(series.min())
                info["max"] = float(series.max())
                info["mean"] = round(float(series.mean()), 4)
                info["allowed_aggregations"] = ["sum", "avg", "min", "max", "count"]

        # Datetime columns
        elif pd.api.types.is_datetime64_any_dtype(series):
            info["role"] = "time_dimension"
            info["semantic_type"] = "date"

        # Categorical / string
        elif series.nunique() < 50:
            info["role"] = "dimension"
            info["semantic_type"] = "category"
            info["top_values"] = series.value_counts().head(10).to_dict()

        else:
            info["role"] = "attribute"
            info["semantic_type"] = "text"

        return info


data_profiler = DataProfiler()
