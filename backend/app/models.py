from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class AnalysisRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=1000, description="The user's question about the data")


class VisualizationRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=500, description="Description of the desired visualization")


class DataInfo(BaseModel):
    rows: int
    columns: List[str]
    data_types: Dict[str, str]
    preview: List[Dict[str, Any]]


class UploadResponse(BaseModel):
    message: str
    filename: str
    rows: int
    columns: List[str]
    preview: List[Dict[str, Any]]


class AnalysisResponse(BaseModel):
    query: str
    analysis: str
    status: str


class VisualizationResponse(BaseModel):
    prompt: str
    visualization: Dict[str, Any]
    status: str


class HealthResponse(BaseModel):
    status: str
    message: str


class ErrorResponse(BaseModel):
    detail: str