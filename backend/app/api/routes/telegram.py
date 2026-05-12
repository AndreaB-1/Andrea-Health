from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/api/telegram", tags=["telegram"])


@router.post("/test")
async def test_telegram(current_user: User = Depends(get_current_user)):
    s = current_user.settings or {}
    token = s.get("telegram_bot_token") or settings.TELEGRAM_BOT_TOKEN
    chat_id = s.get("telegram_chat_id")

    if not token or not chat_id:
        raise HTTPException(status_code=400, detail="Telegram not configured")

    try:
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={"chat_id": chat_id, "text": "✅ Andrea Health: connessione Telegram funzionante!"},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to send message")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Test message sent"}


@router.post("/webhook/{secret}")
async def telegram_webhook(
    secret: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    if secret != settings.TELEGRAM_WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")

    data = await request.json()
    from app.services.telegram_service import handle_update
    await handle_update(data, db)
    return {"ok": True}
