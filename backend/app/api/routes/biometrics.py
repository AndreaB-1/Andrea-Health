from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from datetime import datetime
from app.db.session import get_db
from app.models.user import User
from app.models.biometric_log import BiometricLog
from app.schemas.biometrics import BiometricCreate, BiometricResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/biometrics", tags=["biometrics"])


def compute_bmi(weight_kg: float, height_cm: Optional[float]) -> Optional[float]:
    if height_cm and height_cm > 0:
        h = height_cm / 100
        return round(weight_kg / (h * h), 1)
    return None


@router.get("", response_model=List[BiometricResponse])
async def list_biometrics(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(BiometricLog).where(BiometricLog.user_id == current_user.id)
    if from_date:
        q = q.where(BiometricLog.measured_at >= from_date)
    if to_date:
        q = q.where(BiometricLog.measured_at <= to_date)
    q = q.order_by(BiometricLog.measured_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/latest", response_model=Optional[BiometricResponse])
async def latest_biometric(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(BiometricLog).where(BiometricLog.user_id == current_user.id).order_by(BiometricLog.measured_at.desc()).limit(1)
    result = await db.execute(q)
    return result.scalar_one_or_none()


@router.post("", response_model=BiometricResponse)
async def create_biometric(
    body: BiometricCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    height_cm = (current_user.settings or {}).get("height_cm")
    bmi = compute_bmi(body.weight_kg, height_cm)

    muscle_mass = body.muscle_mass_kg
    if muscle_mass is None and body.body_fat_pct is not None:
        fat_kg = body.weight_kg * (body.body_fat_pct / 100)
        muscle_mass = round(body.weight_kg - fat_kg, 2)

    data = body.model_dump(exclude_none=True)
    if bmi:
        data["bmi"] = bmi
    if muscle_mass:
        data["muscle_mass_kg"] = muscle_mass

    log = BiometricLog(user_id=current_user.id, **data)
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.delete("/{log_id}")
async def delete_biometric(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BiometricLog).where(BiometricLog.id == log_id, BiometricLog.user_id == current_user.id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(log)
    await db.commit()
    return {"message": "Deleted"}
