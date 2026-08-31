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

class GenerateChartsRequest(BaseModel):
    selected_candidate_ids: Optional[List[str]] = None
    custom_charts: Optional[List[Dict[str, Any]]] = None

@router.post("/{dataset_id}/candidates")
async def get_chart_candidates(dataset_id: str, body: Optional[AnalyzeRequest] = None):
    """
    Step 1: AI candidate discovery. Suggests 8-12 doable chart candidates for user selection.
    """
    if dataset_id not in DATASETS_DB:
        raise HTTPException(status_code=404, detail="Dataset not found")

    d = DATASETS_DB[dataset_id]
    profile = d["profile"]
    sample_rows = d["preview_rows"][:10]
    capabilities = body.supported_capabilities if body else None

    provider = LLMProviderFactory.get_provider()
    prompt = build_analysis_prompt(d["name"], profile, sample_rows, capabilities=capabilities)

    logs = [
        f"[{pd.Timestamp.now().isoformat()}] Step 1: Initializing LLM Candidate Discovery via OpenRouter.",
        f"[{pd.Timestamp.now().isoformat()}] Profiling metadata: {profile.get('total_rows')} rows, {profile.get('total_columns')} columns.",
    ]

    analysis_payload = None
    try:
        analysis_payload = await provider.analyze_json(prompt=prompt, system_prompt=SYSTEM_PROMPT)
        logs.append(f"[{pd.Timestamp.now().isoformat()}] LLM candidate discovery successful.")
    except Exception as e:
        logs.append(f"[{pd.Timestamp.now().isoformat()}] OpenRouter call error/timeout ({e}). Generating DuckDB candidate fallbacks.")
        analysis_payload = _generate_duckdb_fallback_candidates(d["name"], profile, d["file_path"])

    candidates = analysis_payload.get("candidates", [])
    if not candidates and "strategies" in analysis_payload:
        candidates = analysis_payload["strategies"]

    d["candidates"] = candidates
    d["candidate_logs"] = logs
    _save_meta(DATASETS_DB)

    return {
        "status": "success",
        "dataset_id": dataset_id,
        "dataset_summary": analysis_payload.get("dataset_summary"),
        "domain_context": analysis_payload.get("domain_context"),
        "candidates": candidates,
        "logs": logs
    }

@router.post("/{dataset_id}/generate-selected")
async def generate_selected_charts(dataset_id: str, body: GenerateChartsRequest):
    """
    Step 2: User selection confirmation. Computes DuckDB aggregated data for selected candidate chart specifications.
    """
    if dataset_id not in DATASETS_DB:
        raise HTTPException(status_code=404, detail="Dataset not found")

    d = DATASETS_DB[dataset_id]
    file_path = d["file_path"]
    candidates = d.get("candidates", [])

    logs = [
        f"[{pd.Timestamp.now().isoformat()}] Step 2: Processing selected charts batch.",
    ]

    selected_specs = []
    if body.selected_candidate_ids:
        cand_map = {c["id"]: c for c in candidates if "id" in c}
        for cid in body.selected_candidate_ids:
            if cid in cand_map:
                selected_specs.append(dict(cand_map[cid]))

    if body.custom_charts:
        for custom_c in body.custom_charts:
            selected_specs.append(custom_c)

    # Compute DuckDB visual payloads
    for spec in selected_specs:
        cfg = spec.get("config", {})
        x_axis = cfg.get("xAxisKey")
        y_keys = cfg.get("yAxisKeys", [])
        y_axis = y_keys[0] if y_keys else x_axis
        agg = cfg.get("aggregation", "SUM")

        if spec.get("chart_type") == "kpi":
            if y_axis:
                res = DuckDBEngine.query_file(file_path, f'SELECT SUM("{y_axis}") as total, AVG("{y_axis}") as avg FROM dataset')
                if res:
                    cfg["primaryValue"] = round(float(res[0].get("total") or 0), 2)
                    cfg["subText"] = f"Average: {round(float(res[0].get('avg') or 0), 2)}"
                    spec["data"] = []
                    logs.append(f"[{pd.Timestamp.now().isoformat()}] Computed DuckDB KPI: {spec.get('title')}")
        elif x_axis and file_path:
            t0 = pd.Timestamp.now()
            computed_data = DuckDBEngine.generate_chart_data(file_path, x_axis, y_axis, agg=agg)
            t1 = pd.Timestamp.now()
            elapsed_ms = round((t1 - t0).total_seconds() * 1000, 2)
            spec["data"] = computed_data or []
            logs.append(f"[{pd.Timestamp.now().isoformat()}] DuckDB Query '{x_axis} vs {y_axis} ({agg})' completed in {elapsed_ms}ms ({len(spec['data'])} data points)")

    ai_analysis = d.get("ai_analysis") or {}
    dataset_summary = ai_analysis.get("dataset_summary") if isinstance(ai_analysis, dict) else None
    domain_context = ai_analysis.get("domain_context") if isinstance(ai_analysis, dict) else None

    payload = {
        "dataset_summary": dataset_summary or f"Visual analytics for {d['name']}",
        "domain_context": domain_context or "DataViz AI Engine",
        "strategies": selected_specs
    }
    d["ai_analysis"] = payload
    _save_meta(DATASETS_DB)

    return {
        "status": "success",
        "dataset_id": dataset_id,
        "analysis": payload,
        "logs": logs
    }

@router.post("/{dataset_id}/analyze")
async def analyze_dataset(dataset_id: str, body: Optional[AnalyzeRequest] = None):
    """
    Legacy direct route: Generates visual strategy specifications and queries DuckDB directly.
    """
    if dataset_id not in DATASETS_DB:
        raise HTTPException(status_code=404, detail="Dataset not found")

    d = DATASETS_DB[dataset_id]
    profile = d["profile"]
    sample_rows = d["preview_rows"][:10]
    capabilities = body.supported_capabilities if body else None

    provider = LLMProviderFactory.get_provider()
    prompt = build_analysis_prompt(d["name"], profile, sample_rows, capabilities=capabilities)

    logs = [
        f"[{pd.Timestamp.now().isoformat()}] Executing Direct AI Analysis & DuckDB Query compilation.",
    ]

    analysis_payload = None
    try:
        analysis_payload = await provider.analyze_json(prompt=prompt, system_prompt=SYSTEM_PROMPT)
    except Exception as e:
        logs.append(f"[{pd.Timestamp.now().isoformat()}] LLM exception: {e}. Utilizing DuckDB strategy fallbacks.")
        analysis_payload = _generate_duckdb_fallback_strategies(d["name"], profile, d["file_path"])

    strategies = analysis_payload.get("candidates") or analysis_payload.get("strategies") or []
    for strat in strategies:
        cfg = strat.get("config", {})
        x_axis = cfg.get("xAxisKey")
        y_keys = cfg.get("yAxisKeys", [])
        y_axis = y_keys[0] if y_keys else x_axis
        agg = cfg.get("aggregation", "SUM")

        if strat.get("chart_type") == "kpi":
            if y_axis:
                res = DuckDBEngine.query_file(d["file_path"], f'SELECT SUM("{y_axis}") as total, AVG("{y_axis}") as avg FROM dataset')
                if res:
                    cfg["primaryValue"] = round(float(res[0].get("total") or 0), 2)
                    cfg["subText"] = f"Average: {round(float(res[0].get('avg') or 0), 2)}"
                    strat["data"] = []
        elif x_axis and d.get("file_path"):
            computed_data = DuckDBEngine.generate_chart_data(d["file_path"], x_axis, y_axis, agg=agg)
            if computed_data:
                strat["data"] = computed_data

    analysis_payload["strategies"] = strategies
    d["ai_analysis"] = analysis_payload
    _save_meta(DATASETS_DB)

    return {
        "status": "success",
        "dataset_id": dataset_id,
        "analysis": analysis_payload,
        "logs": logs
    }

def _generate_duckdb_fallback_candidates(name: str, profile: Dict[str, Any], file_path: str) -> Dict[str, Any]:
    cols = profile.get("columns", [])
    numeric_cols = [c for c in cols if c["inferred_type"] in ["integer", "float", "numeric"]]
    cat_cols = [c for c in cols if c["inferred_type"] == "categorical"]
    date_cols = [c for c in cols if c["inferred_type"] == "datetime"]

    candidates = []
    
    if cat_cols and numeric_cols:
        cat_name = cat_cols[0]["name"]
        num_name = numeric_cols[0]["name"]
        candidates.append({
            "id": "cand_1",
            "title": f"{num_name} Distribution by {cat_name}",
            "description": f"Grouped comparative breakdown of aggregate {num_name} across {cat_name}.",
            "chart_type": "bar",
            "category": "comparison",
            "suitability_score": 0.95,
            "recommended": True,
            "config": {"xAxisKey": cat_name, "yAxisKeys": [num_name], "colorPalette": ["#3b82f6"]}
        })
        candidates.append({
            "id": "cand_2",
            "title": f"Hierarchical Volume Treemap ({cat_name})",
            "description": f"Nested rectangular proportional volume of {num_name}.",
            "chart_type": "treemap",
            "category": "hierarchy",
            "suitability_score": 0.88,
            "recommended": True,
            "config": {"xAxisKey": cat_name, "yAxisKeys": [num_name], "colorPalette": ["#10b981", "#6366f1", "#f59e0b"]}
        })

    if date_cols and numeric_cols:
        date_name = date_cols[0]["name"]
        num_name = numeric_cols[0]["name"]
        candidates.append({
            "id": "cand_3",
            "title": f"Temporal Timeline of {num_name}",
            "description": f"Tracks multi-period continuous trend updates for {num_name}.",
            "chart_type": "line",
            "category": "trend",
            "suitability_score": 0.96,
            "recommended": True,
            "config": {"xAxisKey": date_name, "yAxisKeys": [num_name], "colorPalette": ["#10b981"]}
        })
        candidates.append({
            "id": "cand_4",
            "title": f"Cumulative Volume Shading ({num_name})",
            "description": f"Area chart displaying total volume accumulation.",
            "chart_type": "area",
            "category": "trend",
            "suitability_score": 0.89,
            "recommended": False,
            "config": {"xAxisKey": date_name, "yAxisKeys": [num_name], "colorPalette": ["#8b5cf6"]}
        })

    if cat_cols:
        cat_name = cat_cols[0]["name"]
        candidates.append({
            "id": "cand_5",
            "title": f"Proportional Share ({cat_name})",
            "description": f"Category segment composition donut distribution.",
            "chart_type": "donut",
            "category": "composition",
            "suitability_score": 0.90,
            "recommended": True,
            "config": {"xAxisKey": cat_name, "yAxisKeys": ["count"], "colorPalette": ["#6366f1", "#8b5cf6", "#ec4899"]}
        })
        candidates.append({
            "id": "cand_6",
            "title": f"Stage Conversion Funnel ({cat_name})",
            "description": f"Process flow throughput drop-off per stage.",
            "chart_type": "funnel",
            "category": "funnel",
            "suitability_score": 0.85,
            "recommended": False,
            "config": {"xAxisKey": cat_name, "yAxisKeys": ["count"], "colorPalette": ["#ec4899", "#f43f5e", "#f59e0b"]}
        })

    if len(numeric_cols) >= 2:
        num1 = numeric_cols[0]["name"]
        num2 = numeric_cols[1]["name"]
        candidates.append({
            "id": "cand_7",
            "title": f"Correlation Matrix: {num1} vs {num2}",
            "description": f"Scatter correlation plot analyzing metric relationship.",
            "chart_type": "scatter",
            "category": "correlation",
            "suitability_score": 0.92,
            "recommended": True,
            "config": {"xAxisKey": num1, "yAxisKeys": [num2], "colorPalette": ["#f43f5e"]}
        })
        candidates.append({
            "id": "cand_8",
            "title": f"3D Metric Bubble Clustering",
            "description": f"Bubble plot with variable Z-axis dimension.",
            "chart_type": "bubble",
            "category": "correlation",
            "suitability_score": 0.87,
            "recommended": False,
            "config": {"xAxisKey": num1, "yAxisKeys": [num2], "zAxisKey": num2, "colorPalette": ["#ec4899"]}
        })

    if numeric_cols:
        for idx, num_col in enumerate(numeric_cols[:2]):
            col_name = num_col["name"]
            candidates.append({
                "id": f"cand_kpi_{idx}",
                "title": f"Executive Metric: Total {col_name}",
                "description": f"High level total and average stat indicator.",
                "chart_type": "kpi",
                "category": "kpi",
                "suitability_score": 0.98,
                "recommended": True,
                "config": {"primaryValue": 0, "colorPalette": ["#3b82f6"]}
            })

    return {
        "dataset_summary": f"Dataset {name} profiling metadata.",
        "domain_context": "DuckDB Vectorized Analytics Engine",
        "candidates": candidates
    }

def _generate_duckdb_fallback_strategies(name: str, profile: Dict[str, Any], file_path: str) -> Dict[str, Any]:
    cands = _generate_duckdb_fallback_candidates(name, profile, file_path)
    return {
        "dataset_summary": cands["dataset_summary"],
        "domain_context": cands["domain_context"],
        "strategies": cands["candidates"][:5]
    }
