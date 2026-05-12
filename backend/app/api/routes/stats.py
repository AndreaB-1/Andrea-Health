from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, date, timezone
from app.db.session import get_db
from app.models.user import User
from app.models.diary_entry import DiaryEntry, EntryType
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
async def get_stats(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    if not from_date:
        from_date = datetime.now(timezone.utc) - timedelta(days=30)
    if not to_date:
        to_date = datetime.now(timezone.utc)

    q = select(DiaryEntry).where(
        DiaryEntry.user_id == current_user.id,
        DiaryEntry.created_at >= from_date,
        DiaryEntry.created_at <= to_date,
    )
    result = await db.execute(q)
    entries = result.scalars().all()

    meals = [e for e in entries if e.type == EntryType.meal]
    bathroom = [e for e in entries if e.type == EntryType.bathroom]

    days_with_data: set = set()
    for e in entries:
        days_with_data.add(e.created_at.date() if hasattr(e.created_at, 'date') else e.created_at)

    total_days = (to_date - from_date).days + 1
    tracked_days = len(days_with_data)

    total_kcal = sum(e.calories or 0 for e in meals)
    avg_kcal = total_kcal / tracked_days if tracked_days > 0 else 0

    avg_carbs = sum(e.carbs or 0 for e in meals) / tracked_days if tracked_days > 0 else 0
    avg_protein = sum(e.protein or 0 for e in meals) / tracked_days if tracked_days > 0 else 0
    avg_fat = sum(e.fat or 0 for e in meals) / tracked_days if tracked_days > 0 else 0

    avg_bathroom = len(bathroom) / tracked_days if tracked_days > 0 else 0

    streak = _calculate_streak(list(days_with_data))

    return {
        "avg_calories": round(avg_kcal, 1),
        "avg_carbs": round(avg_carbs, 1),
        "avg_protein": round(avg_protein, 1),
        "avg_fat": round(avg_fat, 1),
        "avg_bathroom": round(avg_bathroom, 1),
        "tracked_days": tracked_days,
        "total_days": total_days,
        "streak": streak,
        "total_entries": len(entries),
    }


@router.get("/daily")
async def get_daily_stats(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    if not from_date:
        from_date = datetime.now(timezone.utc) - timedelta(days=30)
    if not to_date:
        to_date = datetime.now(timezone.utc)

    q = select(DiaryEntry).where(
        DiaryEntry.user_id == current_user.id,
        DiaryEntry.created_at >= from_date,
        DiaryEntry.created_at <= to_date,
    ).order_by(DiaryEntry.created_at)
    result = await db.execute(q)
    entries = result.scalars().all()

    daily: Dict[str, Dict[str, Any]] = {}
    for entry in entries:
        d = entry.created_at.date().isoformat() if hasattr(entry.created_at, 'date') else str(entry.created_at)[:10]
        if d not in daily:
            daily[d] = {"date": d, "calories": 0, "carbs": 0, "protein": 0, "fat": 0,
                        "meals": 0, "bathroom": 0, "entries": []}
        if entry.type == EntryType.meal:
            daily[d]["calories"] += entry.calories or 0
            daily[d]["carbs"] += entry.carbs or 0
            daily[d]["protein"] += entry.protein or 0
            daily[d]["fat"] += entry.fat or 0
            daily[d]["meals"] += 1
        elif entry.type == EntryType.bathroom:
            daily[d]["bathroom"] += 1
        daily[d]["entries"].append(entry.id)

    return sorted(daily.values(), key=lambda x: x["date"])


def _calculate_streak(days: list) -> int:
    if not days:
        return 0
    sorted_days = sorted(days, reverse=True)
    today = date.today()
    streak = 0
    current = today
    for d in sorted_days:
        if isinstance(d, datetime):
            d = d.date()
        if d == current:
            streak += 1
            current = current - timedelta(days=1)
        elif d < current:
            break
    return streak
