import pandas as pd
from pathlib import Path
from typing import Tuple
from app.core.logging import get_logger
from app.core.constants import SUPPORTED_UPLOAD_FORMATS, MAX_FILE_SIZE_BYTES

logger = get_logger(__name__)


class IngestionService:
    """
    Handles file ingestion pipeline:
    Upload -> Validate -> Parse -> Profile -> Convert to Parquet -> Store
    """

    SUPPORTED_FORMATS = SUPPORTED_UPLOAD_FORMATS

    def validate_file(self, filename: str, size_bytes: int) -> None:
        ext = Path(filename).suffix.lower()
        if ext not in self.SUPPORTED_FORMATS:
            raise ValueError(
                f"Unsupported file format '{ext}'. "
                f"Supported: {self.SUPPORTED_FORMATS}"
            )
        if size_bytes > MAX_FILE_SIZE_BYTES:
            raise ValueError(
                f"File too large. Max size is {MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
            )

    def parse_file(self, file_path: str) -> pd.DataFrame:
        """Parse file into a DataFrame based on extension."""
        path = Path(file_path)
        ext = path.suffix.lower()

        logger.info(f"Parsing file: {path.name} ({ext})")

        if ext == ".csv":
            return pd.read_csv(file_path)
        elif ext in (".xlsx", ".xls"):
            return pd.read_excel(file_path)
        elif ext == ".json":
            return pd.read_json(file_path)
        elif ext == ".parquet":
            return pd.read_parquet(file_path)
        else:
            raise ValueError(f"Cannot parse file with extension: {ext}")

    def convert_to_parquet(self, df: pd.DataFrame, output_path: str) -> str:
        """Convert DataFrame to Parquet format for analytical queries."""
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        df.to_parquet(output_path, index=False, engine="pyarrow")
        logger.info(f"Converted to Parquet: {output_path}")
        return output_path

    def clean_column_names(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normalize column names: lowercase, strip whitespace, replace spaces."""
        df.columns = [
            col.strip().lower().replace(" ", "_").replace("-", "_")
            for col in df.columns
        ]
        return df


ingestion_service = IngestionService()
