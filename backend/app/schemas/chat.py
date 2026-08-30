from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    dataset_id: str
    message: str
    conversation_id: Optional[str] = None


class VisualizationSpec(BaseModel):
    type: str
    title: Optional[str] = None
    x_axis: Optional[dict] = None
    y_axis: Optional[dict] = None
    data: Optional[list] = None


class ChatResponse(BaseModel):
    conversation_id: str
    message: str
    visualization: Optional[VisualizationSpec] = None
    sql_executed: Optional[str] = None
