import os
import uuid
import json
import pandas as pd
import duckdb
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import Optional, List, Dict, Any

from app.analytics_engine.profiler import DataProfiler
from app.analytics_engine.duckdb_engine import DuckDBEngine
from app.ai.providers.factory import LLMProviderFactory
from app.ai.prompts.strategy_prompt import SYSTEM_PROMPT, build_analysis_prompt
from app.config import settings

router = APIRouter()

STORAGE_DIR = os.path.join(settings.LOCAL_STORAGE_PATH, "datasets")
META_FILE = os.path.join(settings.LOCAL_STORAGE_PATH, "datasets_meta.json")
os.makedirs(STORAGE_DIR, exist_ok=True)

def _load_meta() -> Dict[str, Dict[str, Any]]:
    if os.path.exists(META_FILE):
        try:
            with open(META_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def _save_meta(data: Dict[str, Dict[str, Any]]):
    try:
        with open(META_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving metadata: {e}")

DATASETS_DB: Dict[str, Dict[str, Any]] = _load_meta()

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Uploads a dataset file (CSV, XLSX, Parquet, JSON), saves it, profiles column structures via DuckDB,
    and returns dataset metadata + preview rows.
    """
    filename = file.filename
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".csv", ".xlsx", ".xls", ".parquet", ".json"]:
        raise HTTPException(status_code=400, detail="Unsupported file type. Allowed: .csv, .xlsx, .xls, .parquet, .json")

    dataset_id = str(uuid.uuid4())
    file_path = os.path.join(STORAGE_DIR, f"{dataset_id}{ext}")

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Read into pandas DataFrame for initial profiling
    try:
        if ext == ".csv":
            df = pd.read_csv(file_path)
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(file_path)
        elif ext == ".parquet":
            df = pd.read_parquet(file_path)
        elif ext == ".json":
            df = pd.read_json(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse data file: {str(e)}")

    # Profile dataset
    profile = DataProfiler.profile_dataframe(df)

    # Convert head for preview
    preview_rows = df.head(100).to_dict(orient="records")
    cleaned_rows = [
        {k: DataProfiler._clean_value(v) for k, v in row.items()}
        for row in preview_rows
    ]

    dataset_record = {
        "id": dataset_id,
        "name": filename,
        "size_bytes": len(content),
        "file_path": file_path,
        "total_rows": profile["total_rows"],
        "total_columns": profile["total_columns"],
        "profile": profile,
        "preview_rows": cleaned_rows,
        "ai_analysis": None,
        "status": "ready"
    }

    DATASETS_DB[dataset_id] = dataset_record
    _save_meta(DATASETS_DB)

    return {
        "id": dataset_id,
        "name": filename,
        "total_rows": profile["total_rows"],
        "total_columns": profile["total_columns"],
        "profile": profile,
        "preview_rows": cleaned_rows[:20]
    }

@router.get("/")
async def list_datasets():
    """Lists uploaded datasets."""
    items = []
    for d_id, d in DATASETS_DB.items():
        items.append({
            "id": d["id"],
            "name": d["name"],
            "size_bytes": d.get("size_bytes", 0),
            "total_rows": d.get("total_rows", 0),
            "total_columns": d.get("total_columns", 0),
            "has_ai_analysis": d.get("ai_analysis") is not None
        })
    return {"datasets": items}

@router.get("/{dataset_id}")
async def get_dataset(dataset_id: str, limit: int = Query(100, ge=1, le=1000), offset: int = Query(0, ge=0)):
    """Gets dataset details, paginated data grid rows, profile, and AI chart strategies."""
    if dataset_id not in DATASETS_DB:
        raise HTTPException(status_code=404, detail="Dataset not found")

    d = DATASETS_DB[dataset_id]
    file_path = d["file_path"]

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Dataset file lost on server")

    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".csv":
        df = pd.read_csv(file_path)
    else:
        df = pd.read_excel(file_path)

    paginated_df = df.iloc[offset:offset+limit]
    rows = paginated_df.to_dict(orient="records")
    cleaned_rows = [
        {k: DataProfiler._clean_value(v) for k, v in row.items()}
        for row in rows
    ]

    return {
        "id": d["id"],
        "name": d["name"],
        "total_rows": d["total_rows"],
        "total_columns": d["total_columns"],
        "profile": d["profile"],
        "rows": cleaned_rows,
        "ai_analysis": d.get("ai_analysis")
    }

from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    supported_capabilities: Optional[List[Dict[str, Any]]] = None

@router.post("/{dataset_id}/analyze")
async def analyze_dataset(dataset_id: str, body: Optional[AnalyzeRequest] = None):
    """
    Triggers OpenRouter AI Analysis on the dataset:
    Generates visual strategy specifications and queries DuckDB to compute actual chart data.
    """
    if dataset_id not in DATASETS_DB:
        raise HTTPException(status_code=404, detail="Dataset not found")

    d = DATASETS_DB[dataset_id]
    profile = d["profile"]
    sample_rows = d["preview_rows"][:10]

    capabilities = body.supported_capabilities if body else None

    # Initialize LLM Adapter (OpenRouter)
    provider = LLMProviderFactory.get_provider()
    prompt = build_analysis_prompt(d["name"], profile, sample_rows, capabilities=capabilities)

    analysis_payload = None
    try:
        analysis_payload = await provider.analyze_json(prompt=prompt, system_prompt=SYSTEM_PROMPT)
    except Exception as e:
        print(f"OpenRouter call error or timeout ({e}). Using DuckDB analytics strategy fallback.")
        analysis_payload = _generate_duckdb_fallback_strategies(d["name"], profile, d["file_path"])

    # Populate strategy chart data directly using DuckDB queries
    if analysis_payload and "strategies" in analysis_payload:
        for strat in analysis_payload["strategies"]:
            cfg = strat.get("config", {})
            x_axis = cfg.get("xAxisKey")
            y_keys = cfg.get("yAxisKeys", [])
            y_axis = y_keys[0] if y_keys else x_axis
            agg = cfg.get("aggregation", "SUM")

            if x_axis and d.get("file_path"):
                computed_data = DuckDBEngine.generate_chart_data(d["file_path"], x_axis, y_axis, agg=agg)
                if computed_data:
                    strat["data"] = computed_data

    d["ai_analysis"] = analysis_payload
    _save_meta(DATASETS_DB)

    return {
        "status": "success",
        "dataset_id": dataset_id,
        "analysis": analysis_payload
    }

def _generate_duckdb_fallback_strategies(name: str, profile: Dict[str, Any], file_path: str) -> Dict[str, Any]:
    """Generates analytical strategies directly computed via DuckDB SQL queries."""
    cols = profile.get("columns", [])
    numeric_cols = [c for c in cols if c["inferred_type"] in ["integer", "float", "numeric"]]
    cat_cols = [c for c in cols if c["inferred_type"] == "categorical"]
    date_cols = [c for c in cols if c["inferred_type"] == "datetime"]

    strategies = []
    
    # 1. Bar chart for categorical vs numeric
    if cat_cols and numeric_cols:
        cat_name = cat_cols[0]["name"]
        num_name = numeric_cols[0]["name"]
        chart_data = DuckDBEngine.generate_chart_data(file_path, cat_name, num_name, agg="SUM")
        strategies.append({
            "id": "strategy_1",
            "title": f"Distribution of {num_name} by {cat_name}",
            "description": f"Aggregated sum of {num_name} grouped across {cat_name} values.",
            "chart_type": "bar",
            "category": "comparison",
            "config": {
                "xAxisKey": cat_name,
                "yAxisKeys": [num_name],
                "colorPalette": ["#3b82f6"],
                "stacked": False
            },
            "data": chart_data
        })

    # 2. Line chart if datetime exists
    if date_cols and numeric_cols:
        date_name = date_cols[0]["name"]
        num_name = numeric_cols[0]["name"]
        chart_data = DuckDBEngine.generate_chart_data(file_path, date_name, num_name, agg="SUM")
        strategies.append({
            "id": "strategy_2",
            "title": f"{num_name} Trend Over Time",
            "description": f"Tracks historical temporal movement of {num_name}.",
            "chart_type": "line",
            "category": "trend",
            "config": {
                "xAxisKey": date_name,
                "yAxisKeys": [num_name],
                "colorPalette": ["#10b981"]
            },
            "data": chart_data
        })

    # 3. Pie/Donut Chart for top category shares
    if cat_cols:
        cat_name = cat_cols[0]["name"]
        chart_data = DuckDBEngine.generate_chart_data(file_path, cat_name, cat_name, agg="COUNT")
        strategies.append({
            "id": "strategy_3",
            "title": f"Category Breakdown ({cat_name})",
            "description": f"Percentage distribution of records across major {cat_name} categories.",
            "chart_type": "donut",
            "category": "composition",
            "config": {
                "xAxisKey": cat_name,
                "yAxisKeys": ["count"],
                "colorPalette": ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#10b981"]
            },
            "data": chart_data
        })

    # 4. KPI Cards via DuckDB
    if numeric_cols:
        for idx, num_col in enumerate(numeric_cols[:2]):
            col_name = num_col["name"]
            res = DuckDBEngine.query_file(file_path, f'SELECT SUM("{col_name}") as total, AVG("{col_name}") as avg FROM dataset')
            if res:
                total_val = round(float(res[0].get("total") or 0), 2)
                avg_val = round(float(res[0].get("avg") or 0), 2)
                strategies.append({
                    "id": f"kpi_{idx}",
                    "title": f"Total {col_name}",
                    "description": f"Aggregated metric calculated via DuckDB engine.",
                    "chart_type": "kpi",
                    "category": "kpi",
                    "config": {
                        "primaryValue": total_val,
                        "subText": f"Average: {avg_val}",
                        "colorPalette": ["#3b82f6"]
                    },
                    "data": []
                })

    return {
        "dataset_summary": f"Dataset {name} containing {len(cols)} variables.",
        "domain_context": "DuckDB Vectorized SQL Engine",
        "strategies": strategies
    }
