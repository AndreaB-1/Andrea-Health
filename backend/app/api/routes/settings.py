from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.schemas.settings import SettingsUpdate, SettingsResponse
from app.api.deps import get_current_user
from app.core.security import encrypt_value

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings(current_user: User = Depends(get_current_user)):
    s = current_user.settings or {}
    return SettingsResponse(
        theme=s.get("theme", "dark"),
        calorie_goal=s.get("calorie_goal", 1700),
        protein_goal=s.get("protein_goal", 100),
        height_cm=s.get("height_cm"),
        telegram_chat_id=s.get("telegram_chat_id"),
        telegram_bot_token=s.get("telegram_bot_token"),
        has_claude_api_key=bool(s.get("claude_api_key_encrypted")),
        reminder_times=s.get("reminder_times", []),
        telegram_reminders_enabled=s.get("telegram_reminders_enabled", False),
    )


@router.put("", response_model=SettingsResponse)
async def update_settings(
    body: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    s = dict(current_user.settings or {})

    if body.theme is not None:
        s["theme"] = body.theme
    if body.calorie_goal is not None:
        s["calorie_goal"] = body.calorie_goal
    if body.protein_goal is not None:
        s["protein_goal"] = body.protein_goal
    if body.height_cm is not None:
        s["height_cm"] = body.height_cm
    if body.telegram_chat_id is not None:
        s["telegram_chat_id"] = body.telegram_chat_id
    if body.telegram_bot_token is not None:
        s["telegram_bot_token"] = body.telegram_bot_token
    if body.claude_api_key is not None:
        s["claude_api_key_encrypted"] = encrypt_value(body.claude_api_key)
    if body.reminder_times is not None:
        s["reminder_times"] = [r.model_dump() for r in body.reminder_times]
    if body.telegram_reminders_enabled is not None:
        s["telegram_reminders_enabled"] = body.telegram_reminders_enabled

    current_user.settings = s
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return await get_settings(current_user)
