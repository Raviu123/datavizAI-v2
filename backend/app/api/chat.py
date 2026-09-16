import json
import uuid
import pandas as pd
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from app.api.datasets import DATASETS_DB
from app.ai.agent import DataAnalystAgent
from app.core.logging import get_logger

logger = get_logger("app.api.chat")

router = APIRouter()

class ChatRequest(BaseModel):
    dataset_id: str
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    sql: Optional[str] = None
    chart_data: Optional[List[Dict[str, Any]]] = None
    visualization: Optional[Dict[str, Any]] = None

@router.post("", response_model=ChatResponse)
async def chat_with_data(request: ChatRequest):
    """
    PandasAI-inspired Agentic Data Analyst Chat Endpoint:
    Routes natural language data questions to DataAnalystAgent to perform tool executions,
    temporal aggregations, SQL execution with auto-correction, and data-driven answer synthesis.
    """
    dataset_id = request.dataset_id
    if dataset_id not in DATASETS_DB:
        logger.warning(f"[Chat API] Dataset ID '{dataset_id}' not found in active database.")
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")

    d = DATASETS_DB[dataset_id]
    conv_id = request.conversation_id or str(uuid.uuid4())

    logger.info(f"💬 [Chat Request] Dataset: '{d['name']}' | Message: \"{request.message}\"")

    agent = DataAnalystAgent()
    agent_res = await agent.process_query(d, request.message)

    return ChatResponse(
        conversation_id=conv_id,
        message=agent_res.get("message", ""),
        sql=agent_res.get("sql"),
        chart_data=agent_res.get("chart_data"),
        visualization=agent_res.get("visualization")
    )
