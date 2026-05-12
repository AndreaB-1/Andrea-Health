from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class BiometricCreate(BaseModel):
    weight_kg: float
    body_fat_pct: Optional[float] = None
    muscle_mass_kg: Optional[float] = None
    body_water_pct: Optional[float] = None
    bone_mass_kg: Optional[float] = None
    visceral_fat_index: Optional[float] = None
    notes: Optional[str] = None
    measured_at: Optional[datetime] = None


class BiometricResponse(BaseModel):
    id: int
    user_id: int
    weight_kg: float
    body_fat_pct: Optional[float] = None
    muscle_mass_kg: Optional[float] = None
    body_water_pct: Optional[float] = None
    bone_mass_kg: Optional[float] = None
    visceral_fat_index: Optional[float] = None
    bmi: Optional[float] = None
    notes: Optional[str] = None
    measured_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
