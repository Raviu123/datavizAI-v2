import datetime
import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import Column, String, Integer, BigInteger, Text, DateTime, JSON
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    size_bytes = Column(BigInteger, default=0)
    total_rows = Column(Integer, default=0)
    total_columns = Column(Integer, default=0)
    status = Column(String(50), default="ready")

    # JSON metadata payloads
    profile = Column(JSON, nullable=True)
    preview_rows = Column(JSON, nullable=True)
    candidates = Column(JSON, nullable=True)
    candidate_logs = Column(JSON, nullable=True)
    ai_analysis = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "size_bytes": self.size_bytes,
            "file_path": self.file_path,
            "total_rows": self.total_rows,
            "total_columns": self.total_columns,
            "status": self.status,
            "profile": self.profile or {},
            "preview_rows": self.preview_rows or [],
            "candidates": self.candidates or [],
            "candidate_logs": self.candidate_logs or [],
            "ai_analysis": self.ai_analysis,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DataSourceModel(Base):
    __tablename__ = "data_sources"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    source_url = Column(String(1024), nullable=False)
    refresh_interval_seconds = Column(Integer, default=5)
    source_type = Column(String(64), default="rest_stream")
    status = Column(String(50), default="connected")

    dataset_summary = Column(Text, nullable=True)
    domain_context = Column(String(255), nullable=True)
    profile = Column(JSON, nullable=True)
    candidates = Column(JSON, nullable=True)
    approved_candidates = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "source_url": self.source_url,
            "refresh_interval_seconds": self.refresh_interval_seconds,
            "source_type": self.source_type,
            "status": self.status,
            "dataset_summary": self.dataset_summary,
            "domain_context": self.domain_context,
            "profile": self.profile or {},
            "candidates": self.candidates or [],
            "approved_candidates": self.approved_candidates or [],
            "last_updated": self.updated_at.isoformat() if self.updated_at else None,
        }


class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(64), index=True, nullable=False)
    dataset_id = Column(String(64), index=True, nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    message = Column(Text, nullable=False)
    sql = Column(Text, nullable=True)
    chart_data = Column(JSON, nullable=True)
    visualization = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class ReportModel(Base):
    __tablename__ = "reports"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    dataset_id = Column(String(64), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    executive_summary = Column(Text, nullable=False)

    kpis = Column(JSON, nullable=False, default=list)
    sections = Column(JSON, nullable=False, default=list)
    anomalies = Column(JSON, nullable=False, default=list)
    recommendations = Column(JSON, nullable=False, default=list)
    orchestration_logs = Column(JSON, nullable=False, default=list)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "dataset_id": self.dataset_id,
            "title": self.title,
            "executive_summary": self.executive_summary,
            "kpis": self.kpis or [],
            "sections": self.sections or [],
            "anomalies": self.anomalies or [],
            "recommendations": self.recommendations or [],
            "orchestration_logs": self.orchestration_logs or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

