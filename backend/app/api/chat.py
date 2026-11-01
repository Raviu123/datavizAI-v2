import uuid
import json
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, asc

from app.db.models import DatasetModel, ChatMessageModel
from app.db.session import get_db, get_db_context
from app.ai.agent import DataAnalystAgent
from app.core.logging import get_logger

logger = get_logger("app.api.chat")

router = APIRouter()


class ChatRequest(BaseModel):
    dataset_id: str
    message: str
    conversation_id: Optional[str] = None
    attached_chart: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    sql: Optional[str] = None
    chart_data: Optional[List[Dict[str, Any]]] = None
    visualization: Optional[Dict[str, Any]] = None
    thoughts: Optional[List[str]] = None


@router.post("/stream")
async def chat_with_data_stream(request: ChatRequest):
    """
    Real-Time Agentic Data Analyst Chat Streaming:
    Progressively streams live agent reasoning, DuckDB tool calls, observations,
    and synthesized markdown answers with interactive visualizations.
    """
    dataset_id = request.dataset_id
    conv_id = request.conversation_id or str(uuid.uuid4())

    async with get_db_context() as db:
        stmt = select(DatasetModel).where(DatasetModel.id == dataset_id)
        result = await db.execute(stmt)
        dataset = result.scalar_one_or_none()

        if not dataset:
            raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")

        dataset_dict = dataset.to_dict()

        # Fetch recent conversation history
        history_stmt = (
            select(ChatMessageModel)
            .where(ChatMessageModel.conversation_id == conv_id)
            .order_by(asc(ChatMessageModel.created_at))
            .limit(6)
        )
        history_res = await db.execute(history_stmt)
        history_rows = history_res.scalars().all()
        history_payload = [{"role": m.role, "message": m.message, "sql": m.sql} for m in history_rows]

        # Save user message to database
        user_msg_record = ChatMessageModel(
            conversation_id=conv_id,
            dataset_id=dataset_id,
            role="user",
            message=request.message,
        )
        db.add(user_msg_record)
        await db.commit()

    agent = DataAnalystAgent()

    async def event_generator():
        final_msg = None
        final_sql = None
        final_chart_data = None
        final_viz = None

        try:
            # Yield initial connecting event
            yield f"data: {json.dumps({'type': 'init', 'event': 'init', 'conversation_id': conv_id})}\n\n"

            async for event in agent.process_query_stream(
                dataset_record=dataset_dict,
                user_message=request.message,
                history=history_payload,
                attached_chart=request.attached_chart
            ):
                event_type = event.get("type")
                if event_type == "final_answer":
                    final_msg = event.get("message")
                    final_sql = event.get("sql")
                    final_chart_data = event.get("chart_data")
                    final_viz = event.get("visualization")

                    # Persist assistant response to DB
                    async with get_db_context() as db:
                        assistant_record = ChatMessageModel(
                            conversation_id=conv_id,
                            dataset_id=dataset_id,
                            role="assistant",
                            message=final_msg or "",
                            sql=final_sql,
                            chart_data=final_chart_data,
                            visualization=final_viz,
                        )
                        db.add(assistant_record)
                        await db.commit()

                    payload = {
                        "type": "final_answer",
                        "event": "final_answer",
                        "conversation_id": conv_id,
                        "message": final_msg,
                        "sql": final_sql,
                        "chart_data": final_chart_data,
                        "visualization": final_viz
                    }
                    yield f"data: {json.dumps(payload)}\n\n"
                else:
                    event_copy = dict(event)
                    event_copy["event"] = event_type
                    yield f"data: {json.dumps(event_copy)}\n\n"

        except Exception as e:
            logger.error(f"[Chat Stream Error] {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.post("", response_model=ChatResponse)
async def chat_with_data(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Standard Non-Streaming Endpoint for backwards compatibility.
    """
    dataset_id = request.dataset_id

    stmt = select(DatasetModel).where(DatasetModel.id == dataset_id)
    result = await db.execute(stmt)
    dataset = result.scalar_one_or_none()

    if not dataset:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")

    conv_id = request.conversation_id or str(uuid.uuid4())

    history_stmt = (
        select(ChatMessageModel)
        .where(ChatMessageModel.conversation_id == conv_id)
        .order_by(asc(ChatMessageModel.created_at))
        .limit(6)
    )
    history_res = await db.execute(history_stmt)
    history_rows = history_res.scalars().all()
    history_payload = [{"role": m.role, "message": m.message, "sql": m.sql} for m in history_rows]

    user_msg_record = ChatMessageModel(
        conversation_id=conv_id,
        dataset_id=dataset_id,
        role="user",
        message=request.message,
    )
    db.add(user_msg_record)

    agent = DataAnalystAgent()
    agent_res = await agent.process_query(
        dataset.to_dict(),
        request.message,
        history=history_payload,
        attached_chart=request.attached_chart
    )

    ai_message = agent_res.get("message", "")
    ai_sql = agent_res.get("sql")
    ai_chart_data = agent_res.get("chart_data")
    ai_visualization = agent_res.get("visualization")
    thoughts = agent_res.get("thoughts", [])

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
        thoughts=thoughts,
    )
