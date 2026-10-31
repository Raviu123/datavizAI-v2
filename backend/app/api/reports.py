from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Dict, Any

from app.db.models import DatasetModel, ReportModel
from app.db.session import get_db
from app.ai.agents.orchestrator import ExecutiveReportOrchestrator
from app.core.logging import get_logger

logger = get_logger("app.api.reports")

router = APIRouter()


@router.post("/datasets/{dataset_id}/reports/generate")
async def generate_dataset_report(
    dataset_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Triggers the 5-Agent Autonomous Reporting Pipeline:
    Agent 1 (Anomaly Scout) -> Agent 2 (Business Strategist) -> Agent 3 (DuckDB Analyst)
    -> Agent 4 (Chart Designer) -> Agent 5 (Executive Synthesizer)
    Saves and returns the complete Executive Dossier.
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
