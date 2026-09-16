import uuid
import json
import httpx
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.analytics_engine.profiler import DataProfiler
from app.analytics_engine.duckdb_engine import DuckDBEngine
from app.ai.providers.factory import LLMProviderFactory
from app.ai.prompts.strategy_prompt import SYSTEM_PROMPT, build_analysis_prompt

router = APIRouter()

# In-memory store for connected Live Data Sources
LIVE_DATA_SOURCES: Dict[str, Dict[str, Any]] = {}

class ConnectLiveSourceRequest(BaseModel):
    name: str
    source_url: str
    refresh_interval_seconds: int = 5
    source_type: str = "rest_stream"  # shopify / rest_stream / weather / custom

class ApprovedLiveDashboardRequest(BaseModel):
    source_id: str
    selected_candidate_ids: List[str]

@router.get("")
async def list_data_sources():
    """List all connected live data sources."""
    sources = list(LIVE_DATA_SOURCES.values())
    return {"data_sources": sources, "total": len(sources)}

@router.post("/connect-url")
async def connect_live_source_url(body: ConnectLiveSourceRequest):
    """
    Step 1: Connect to a Live Source URL (e.g. http://localhost:8000/api/v1/mock/shopify/live-orders).
    Fetches initial payload, profiles streaming schema, and returns AI visual candidates for user approval.
    """
    source_id = str(uuid.uuid4())
    url = body.source_url.strip()

    # Fetch initial payload from live source URL
    payload = None
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(url)
            res.raise_for_status()
            payload = res.json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch data from Live URL: {str(e)}")

    # Extract records array
    records = []
    if isinstance(payload, list):
        records = payload
    elif isinstance(payload, dict):
        records = payload.get("orders") or payload.get("data") or payload.get("items") or [payload]

    if not records or not isinstance(records, list):
        raise HTTPException(status_code=400, detail="Live URL payload did not return a valid list of records or orders.")

    # Convert head for pandas profiling
    df = pd.DataFrame(records)
    profile = DataProfiler.profile_dataframe(df)

    # Trigger AI Candidate Discovery for Live Stream
    sample_rows = records[:10]
    provider = LLMProviderFactory.get_provider()
    prompt = build_analysis_prompt(body.name, profile, sample_rows)

    candidates = []
    dataset_summary = f"Live stream from {url}"
    domain_context = "Real-Time E-Commerce Stream"

    try:
        ai_res = await provider.analyze_json(prompt=prompt, system_prompt=SYSTEM_PROMPT)
        candidates = ai_res.get("candidates") or ai_res.get("strategies") or []
        dataset_summary = ai_res.get("dataset_summary", dataset_summary)
        domain_context = ai_res.get("domain_context", domain_context)
    except Exception as e:
        print(f"LLM Live Analysis fallback: {e}")
        # Dynamic Candidate Fallbacks
        numeric_cols = [c["name"] for c in profile.get("columns", []) if c.get("inferred_type") in ["integer", "float", "numeric"]]
        cat_cols = [c["name"] for c in profile.get("columns", []) if c.get("inferred_type") == "categorical"]

        if cat_cols and numeric_cols:
            cat_name, num_name = cat_cols[0], numeric_cols[0]
            candidates.append({
                "id": "live_cand_1",
                "title": f"Live {num_name} Breakdown by {cat_name}",
                "description": f"Real-time comparative streaming volume across {cat_name}.",
                "chart_type": "bar",
                "suitability_score": 0.96,
                "recommended": True,
                "config": {"xAxisKey": cat_name, "yAxisKeys": [num_name], "colorPalette": ["#6366f1"]}
            })
            candidates.append({
                "id": "live_cand_2",
                "title": f"Live Proportional Share ({cat_name})",
                "description": f"Donut share distribution of real-time incoming orders.",
                "chart_type": "donut",
                "suitability_score": 0.91,
                "recommended": True,
                "config": {"xAxisKey": cat_name, "yAxisKeys": [num_name], "colorPalette": ["#10b981", "#6366f1", "#f59e0b"]}
            })
            candidates.append({
                "id": "live_cand_3",
                "title": f"Live Hierarchy Treemap ({cat_name})",
                "description": f"Proportional rectangle volume scaled to live transactions.",
                "chart_type": "treemap",
                "suitability_score": 0.88,
                "recommended": False,
                "config": {"xAxisKey": cat_name, "yAxisKeys": [num_name], "colorPalette": ["#ec4899", "#8b5cf6"]}
            })

    source_record = {
        "id": source_id,
        "name": body.name,
        "source_url": url,
        "refresh_interval_seconds": body.refresh_interval_seconds,
        "source_type": body.source_type,
        "profile": profile,
        "candidates": candidates,
        "dataset_summary": dataset_summary,
        "domain_context": domain_context,
        "status": "connected",
        "last_updated": pd.Timestamp.now().isoformat()
    }

    LIVE_DATA_SOURCES[source_id] = source_record

    return {
        "status": "success",
        "source_id": source_id,
        "name": body.name,
        "source_url": url,
        "profile": profile,
        "dataset_summary": dataset_summary,
        "domain_context": domain_context,
        "candidates": candidates
    }

@router.get("/{source_id}/poll-live-data")
async def poll_live_data_feed(source_id: str):
    """
    Step 2: Real-Time Live Feed Endpoint.
    Polls the connected Live Source URL, recalculates charts dynamically via DuckDB, 
    and streams updated data points back to the real-time frontend dashboard.
    """
    if source_id not in LIVE_DATA_SOURCES:
        raise HTTPException(status_code=404, detail="Live Data Source not found")

    source = LIVE_DATA_SOURCES[source_id]
    url = source["source_url"]

    # Poll live URL
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            res = await client.get(url)
            res.raise_for_status()
            raw_payload = res.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error polling live URL feed: {str(e)}")

    records = []
    if isinstance(raw_payload, list):
        records = raw_payload
    elif isinstance(raw_payload, dict):
        records = raw_payload.get("orders") or raw_payload.get("data") or raw_payload.get("items") or [raw_payload]

    # Load into memory DuckDB table
    df = pd.DataFrame(records)
    conn = DuckDBEngine.query_file

    computed_charts = []
    approved_candidates = source.get("approved_candidates") or source.get("candidates") or []

    for cand in approved_candidates:
        cfg = cand.get("config", {})
        x_axis = cfg.get("xAxisKey")
        y_keys = cfg.get("yAxisKeys", [])
        y_axis = y_keys[0] if y_keys else x_axis
        agg = cfg.get("aggregation", "SUM")

        chart_data = []
        if x_axis and x_axis in df.columns:
            try:
                # Query in-memory DataFrame via DuckDB logic
                if y_axis in df.columns and x_axis != y_axis:
                    grouped = df.groupby(x_axis)[y_axis].sum().reset_index().sort_values(by=y_axis, ascending=False).head(15)
                    chart_data = grouped.to_dict(orient="records")
                else:
                    counts = df[x_axis].value_counts().reset_index().head(15)
                    counts.columns = [x_axis, "count"]
                    chart_data = counts.to_dict(orient="records")
            except Exception as err:
                print(f"Live aggregation error: {err}")

        computed_charts.append({
            "id": cand.get("id"),
            "title": cand.get("title"),
            "chart_type": cand.get("chart_type", "bar"),
            "config": cfg,
            "data": chart_data
        })

    source["last_updated"] = pd.Timestamp.now().isoformat()

    return {
        "status": "live",
        "source_id": source_id,
        "source_name": source["name"],
        "timestamp": pd.Timestamp.now().isoformat(),
        "live_metrics": raw_payload.get("live_metrics") if isinstance(raw_payload, dict) else {},
        "total_records": len(records),
        "visualizations": computed_charts
    }

@router.post("/{source_id}/approve-candidates")
async def approve_live_candidates(source_id: str, body: ApprovedLiveDashboardRequest):
    """
    Step 3: User confirms which AI proposed live charts to pin to the Live Dashboard.
    """
    if source_id not in LIVE_DATA_SOURCES:
        raise HTTPException(status_code=404, detail="Live Data Source not found")

    source = LIVE_DATA_SOURCES[source_id]
    all_cands = source.get("candidates", [])
    cand_map = {c["id"]: c for c in all_cands if "id" in c}

    approved = []
    for cid in body.selected_candidate_ids:
        if cid in cand_map:
            approved.append(cand_map[cid])

    source["approved_candidates"] = approved
    return {
        "status": "success",
        "source_id": source_id,
        "approved_count": len(approved)
    }
