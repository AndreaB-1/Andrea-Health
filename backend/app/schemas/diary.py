from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.diary_entry import EntryType, UrineType, StoolType


class TagSchema(BaseModel):
    label: str
    type: str


class MacrosSchema(BaseModel):
    calories: int
    carbs: float
    protein: float
    fat: float


class DiaryEntryCreate(BaseModel):
    raw_text: str
    type: Optional[EntryType] = None
    parsed_text: Optional[str] = None
    meal_name: Optional[str] = None
    calories: Optional[float] = None
    carbs: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    urine_type: Optional[UrineType] = None
    stool_type: Optional[StoolType] = None
    ai_analyzed: bool = False
    confidence: Optional[float] = None


class DiaryEntryUpdate(BaseModel):
    raw_text: Optional[str] = None
    parsed_text: Optional[str] = None
    meal_name: Optional[str] = None
    calories: Optional[float] = None
    carbs: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    urine_type: Optional[UrineType] = None
    stool_type: Optional[StoolType] = None


class DiaryEntryResponse(BaseModel):
    id: int
    user_id: int
    type: EntryType
    raw_text: str
    parsed_text: Optional[str] = None
    meal_name: Optional[str] = None
    calories: Optional[float] = None
    carbs: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    urine_type: Optional[UrineType] = None
    stool_type: Optional[StoolType] = None
    ai_analyzed: bool
    confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AnalyzeRequest(BaseModel):
    text: str


class AnalyzeResponse(BaseModel):
    type: EntryType
    parsed: str
    meal_name: Optional[str] = None
    tags: List[TagSchema] = []
    macros: Optional[MacrosSchema] = None
    urine_type: Optional[UrineType] = None
    stool_type: Optional[StoolType] = None
    confidence: float
