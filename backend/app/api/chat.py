import uuid
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc

from app.db.models import DatasetModel, ChatMessageModel
from app.db.session import get_db
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
async def chat_with_data(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Agentic Data Analyst Chat Endpoint:
    Routes natural language data questions to DataAnalystAgent,
    persisting multi-turn conversational history in the database.
    """
    dataset_id = request.dataset_id

    # Retrieve dataset from database
    stmt = select(DatasetModel).where(DatasetModel.id == dataset_id)
    result = await db.execute(stmt)
    dataset = result.scalar_one_or_none()

    if not dataset:
        logger.warning(f"[Chat API] Dataset ID '{dataset_id}' not found in database.")
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")

    conv_id = request.conversation_id or str(uuid.uuid4())

    # Fetch recent conversation history for this conversation_id (last 6 messages)
    history_stmt = (
        select(ChatMessageModel)
        .where(ChatMessageModel.conversation_id == conv_id)
        .order_by(asc(ChatMessageModel.created_at))
        .limit(6)
    )
    history_res = await db.execute(history_stmt)
    history_rows = history_res.scalars().all()
    history_payload = [{"role": m.role, "message": m.message, "sql": m.sql} for m in history_rows]

    logger.info(f"[Chat Request] Dataset: '{dataset.name}' | Conv: '{conv_id}' | Message: \"{request.message}\"")

    # Save user message to database
    user_msg_record = ChatMessageModel(
        conversation_id=conv_id,
        dataset_id=dataset_id,
        role="user",
        message=request.message,
    )
    db.add(user_msg_record)

    # Process query with conversational history
    agent = DataAnalystAgent()
    agent_res = await agent.process_query(
        dataset.to_dict(),
        request.message,
        history=history_payload
    )

    ai_message = agent_res.get("message", "")
    ai_sql = agent_res.get("sql")
    ai_chart_data = agent_res.get("chart_data")
    ai_visualization = agent_res.get("visualization")

    # Save assistant response to database
    assistant_msg_record = ChatMessageModel(
        conversation_id=conv_id,
        dataset_id=dataset_id,
        role="assistant",
        message=ai_message,
        sql=ai_sql,
        chart_data=ai_chart_data,
        visualization=ai_visualization,
    )
    db.add(assistant_msg_record)
    await db.commit()

    return ChatResponse(
        conversation_id=conv_id,
        message=ai_message,
        sql=ai_sql,
        chart_data=ai_chart_data,
        visualization=ai_visualization,
    )
