import json
import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Dict, Any

from app.db.models import DatasetModel, ReportModel
from app.db.session import get_db, get_db_context
from app.ai.agents.orchestrator import ExecutiveReportOrchestrator
from app.core.logging import get_logger

logger = get_logger("app.api.reports")

router = APIRouter()


@router.get("/datasets/{dataset_id}/reports/generate/stream")
@router.post("/datasets/{dataset_id}/reports/generate/stream")
async def generate_dataset_report_stream(dataset_id: str):
    """
    Streams live agentic reporting events (thoughts, tool calls, SQL queries, observations, and milestone completions)
    via Server-Sent Events (SSE). Automatically persists the complete dossier to the database upon completion.
    """
    async with get_db_context() as db:
        stmt = select(DatasetModel).where(DatasetModel.id == dataset_id)
        result = await db.execute(stmt)
        dataset = result.scalar_one_or_none()

        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")

        dataset_id_val = dataset.id
        dataset_name_val = dataset.name
        file_path_val = dataset.file_path
        profile_val = dataset.profile or {}
        sample_rows_val = (dataset.preview_rows or [])[:10]

    async def event_generator():
        try:
            async for event in ExecutiveReportOrchestrator.generate_dossier_stream(
                dataset_id=dataset_id_val,
                dataset_name=dataset_name_val,
                file_path=file_path_val,
                profile=profile_val,
                sample_rows=sample_rows_val,
            ):
                if event.get("type") == "dossier_ready":
                    dossier = event["dossier"]
                    # Persist to database
                    async with get_db_context() as db:
                        report_record = ReportModel(
                            id=dossier["id"],
                            dataset_id=dataset_id_val,
                            title=dossier["title"],
                            executive_summary=dossier["executive_summary"],
                            kpis=dossier["kpis"],
                            sections=dossier["sections"],
                            anomalies=dossier["anomalies"],
                            recommendations=dossier["recommendations"],
                            orchestration_logs=dossier["orchestration_logs"],
                        )
                        db.add(report_record)
                        await db.commit()
                        await db.refresh(report_record)
                        saved_report = report_record.to_dict()

                    complete_event = {
                        "type": "complete",
                        "message": f"Executive report '{dossier['title']}' generated and saved successfully.",
                        "report": saved_report,
                        "total_elapsed": event.get("total_elapsed"),
                        "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
                    }
                    yield f"data: {json.dumps(complete_event)}\n\n"
                else:
                    yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"[Report Streaming Error] {e}", exc_info=True)
            err_event = {
                "type": "error",
                "message": f"Failed to generate report: {str(e)}",
                "timestamp": datetime.datetime.now().strftime("%H:%M:%S")
            }
            yield f"data: {json.dumps(err_event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("/datasets/{dataset_id}/reports/generate")
async def generate_dataset_report(
    dataset_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Synchronous fallback: Triggers the 5-Agent Autonomous Reporting Pipeline
    and returns the saved Executive Dossier.
    """
    stmt = select(DatasetModel).where(DatasetModel.id == dataset_id)
    result = await db.execute(stmt)
    dataset = result.scalar_one_or_none()

    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    profile = dataset.profile or {}
    sample_rows = (dataset.preview_rows or [])[:10]

    # Run Multi-Agent Orchestrator
    try:
        dossier = await ExecutiveReportOrchestrator.generate_dossier(
            dataset_id=dataset.id,
            dataset_name=dataset.name,
            file_path=dataset.file_path,
            profile=profile,
            sample_rows=sample_rows
        )
    except Exception as e:
        logger.error(f"[Report Generation Error] {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")

    # Save to database
    report_record = ReportModel(
        id=dossier["id"],
        dataset_id=dataset.id,
        title=dossier["title"],
        executive_summary=dossier["executive_summary"],
        kpis=dossier["kpis"],
        sections=dossier["sections"],
        anomalies=dossier["anomalies"],
        recommendations=dossier["recommendations"],
        orchestration_logs=dossier["orchestration_logs"],
    )
    db.add(report_record)
    await db.commit()
    await db.refresh(report_record)

    return report_record.to_dict()


@router.get("/datasets/{dataset_id}/reports")
async def list_dataset_reports(
    dataset_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Lists all saved executive reports for a dataset."""
    stmt = (
        select(ReportModel)
        .where(ReportModel.dataset_id == dataset_id)
        .order_by(desc(ReportModel.created_at))
    )
    result = await db.execute(stmt)
    reports = result.scalars().all()
    return {"reports": [r.to_dict() for r in reports]}


@router.get("/reports/{report_id}")
async def get_report_by_id(
    report_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Fetches a specific executive report dossier by ID."""
    stmt = select(ReportModel).where(ReportModel.id == report_id)
    result = await db.execute(stmt)
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return report.to_dict()
