from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.diary_entry import DiaryEntry, EntryType
from app.models.biometric_log import BiometricLog
from app.models.telegram_message import TelegramMessage, MessageDirection
from app.services.claude_service import analyze_text
from app.core.security import decrypt_value
import httpx


async def send_message(token: str, chat_id: str, text: str) -> None:
    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown"},
        )


async def handle_update(data: Dict[str, Any], db: AsyncSession) -> None:
    message = data.get("message")
    if not message:
        return

    chat_id = str(message["chat"]["id"])
    text = message.get("text", "")
    tg_msg_id = message.get("message_id")

    result = await db.execute(select(User))
    users = result.scalars().all()

    user = None
    for u in users:
        s = u.settings or {}
        if s.get("telegram_chat_id") == chat_id:
            user = u
            break

    if not user:
        return

    s = user.settings or {}
    token = s.get("telegram_bot_token", "")

    tg_in = TelegramMessage(
        user_id=user.id, telegram_message_id=tg_msg_id,
        direction=MessageDirection.incoming, content=text
    )
    db.add(tg_in)

    response_text = await _process_command(text, user, db)

    if response_text:
        await send_message(token, chat_id, response_text)
        tg_out = TelegramMessage(
            user_id=user.id, direction=MessageDirection.outgoing, content=response_text
        )
        db.add(tg_out)

    await db.commit()


async def _process_command(text: str, user: User, db: AsyncSession) -> Optional[str]:
    if text.startswith("/start"):
        return (
            "👋 *Benvenuto in Andrea Health!*\n\n"
            "Comandi disponibili:\n"
            "/log <testo> — Aggiungi voce al diario\n"
            "/oggi — Riepilogo di oggi\n"
            "/stats — Statistiche settimana\n"
            "/peso <kg> [%grasso] — Logga peso\n"
        )

    if text.startswith("/log "):
        entry_text = text[5:].strip()
        api_key = None
        s = user.settings or {}
        if s.get("claude_api_key_encrypted"):
            api_key = decrypt_value(s["claude_api_key_encrypted"])

        analysis = await analyze_text(entry_text, api_key)
        entry = DiaryEntry(
            user_id=user.id, type=analysis.type, raw_text=entry_text,
            parsed_text=analysis.parsed, meal_name=analysis.meal_name,
            calories=analysis.macros.calories if analysis.macros else None,
            carbs=analysis.macros.carbs if analysis.macros else None,
            protein=analysis.macros.protein if analysis.macros else None,
            fat=analysis.macros.fat if analysis.macros else None,
            urine_type=analysis.urine_type, stool_type=analysis.stool_type,
            ai_analyzed=bool(api_key), confidence=analysis.confidence,
        )
        db.add(entry)
        kcal_str = f" (~{int(analysis.macros.calories)} kcal)" if analysis.macros else ""
        return f"✅ *Voce aggiunta:*\n{analysis.parsed}{kcal_str}"

    if text.startswith("/peso"):
        parts = text.split()
        if len(parts) < 2:
            return "❌ Uso: /peso <kg> [%grasso]"
        try:
            weight = float(parts[1])
            fat_pct = float(parts[2]) if len(parts) > 2 else None
            log = BiometricLog(user_id=user.id, weight_kg=weight, body_fat_pct=fat_pct)
            db.add(log)
            return f"✅ Peso registrato: *{weight} kg*" + (f" | Grasso: {fat_pct}%" if fat_pct else "")
        except ValueError:
            return "❌ Valore non valido"

    if text.startswith("/oggi"):
        from datetime import datetime, timezone
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        q = select(DiaryEntry).where(
            DiaryEntry.user_id == user.id, DiaryEntry.created_at >= today_start
        )
        result = await db.execute(q)
        entries = result.scalars().all()
        meals = [e for e in entries if e.type == EntryType.meal]
        bathroom = [e for e in entries if e.type == EntryType.bathroom]
        total_kcal = sum(e.calories or 0 for e in meals)
        return (
            f"📊 *Riepilogo di Oggi*\n"
            f"━━━━━━━━━━━━━━━\n"
            f"🍽 Pasti: {len(meals)} | ~{int(total_kcal)} kcal\n"
            f"💧 Bagno: {len(bathroom)}×\n"
            f"━━━━━━━━━━━━━━━"
        )

    return None
