from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from datetime import datetime
from app.db.session import get_db
from app.models.user import User
from app.models.diary_entry import DiaryEntry, EntryType
from app.schemas.diary import (
    DiaryEntryCreate, DiaryEntryUpdate, DiaryEntryResponse,
    AnalyzeRequest, AnalyzeResponse
)
from app.api.deps import get_current_user
from app.services.claude_service import analyze_text

router = APIRouter(prefix="/api/entries", tags=["entries"])


@router.get("", response_model=List[DiaryEntryResponse])
async def list_entries(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    type: Optional[EntryType] = None,
    limit: int = Query(100, le=500),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(DiaryEntry).where(DiaryEntry.user_id == current_user.id)
    if from_date:
        q = q.where(DiaryEntry.created_at >= from_date)
    if to_date:
        q = q.where(DiaryEntry.created_at <= to_date)
    if type:
        q = q.where(DiaryEntry.type == type)
    q = q.order_by(DiaryEntry.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=DiaryEntryResponse)
async def create_entry(
    body: DiaryEntryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = DiaryEntry(user_id=current_user.id, **body.model_dump(exclude_none=True))
    if not entry.type:
        entry.type = EntryType.note
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=DiaryEntryResponse)
async def update_entry(
    entry_id: int,
    body: DiaryEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DiaryEntry).where(DiaryEntry.id == entry_id, DiaryEntry.user_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(entry, field, value)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/{entry_id}")
async def delete_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(DiaryEntry).where(DiaryEntry.id == entry_id, DiaryEntry.user_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(entry)
    await db.commit()
    return {"message": "Deleted"}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_entry(
    body: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
):
    api_key = None
    if current_user.settings:
        from app.core.security import decrypt_value
        encrypted = current_user.settings.get("claude_api_key_encrypted")
        if encrypted:
            api_key = decrypt_value(encrypted)

    result = await analyze_text(body.text, api_key)
    return result


@router.post("/analyze-and-save", response_model=DiaryEntryResponse)
async def analyze_and_save(
    body: AnalyzeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    api_key = None
    if current_user.settings:
        from app.core.security import decrypt_value
        encrypted = current_user.settings.get("claude_api_key_encrypted")
        if encrypted:
            api_key = decrypt_value(encrypted)

    analysis = await analyze_text(body.text, api_key)

    entry = DiaryEntry(
        user_id=current_user.id,
        type=analysis.type,
        raw_text=body.text,
        parsed_text=analysis.parsed,
        meal_name=analysis.meal_name,
        calories=analysis.macros.calories if analysis.macros else None,
        carbs=analysis.macros.carbs if analysis.macros else None,
        protein=analysis.macros.protein if analysis.macros else None,
        fat=analysis.macros.fat if analysis.macros else None,
        urine_type=analysis.urine_type,
        stool_type=analysis.stool_type,
        ai_analyzed=True,
        confidence=analysis.confidence,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry
