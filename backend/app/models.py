from pydantic import BaseModel
from typing import List, Dict, Any, Optional


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