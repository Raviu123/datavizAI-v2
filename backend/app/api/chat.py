from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ChatRequest(BaseModel):
    dataset_id: str
    message: str
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    visualization: Optional[dict] = None


@router.post("", response_model=ChatResponse)
async def chat_with_data(request: ChatRequest):
    """Send a natural language query about a dataset."""
    # Placeholder: real implementation via AI agent
    return ChatResponse(
        conversation_id=request.conversation_id or "new-conversation",
        message="AI chat is being set up. Dataset and LLM integration coming soon.",
        visualization=None,
    )
