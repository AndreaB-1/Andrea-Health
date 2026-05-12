"""Standalone Telegram bot worker using polling (for the telegram container)."""
import asyncio
import logging
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not set, worker exiting.")
        return

    try:
        from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters
        from app.db.session import AsyncSessionLocal
        from app.services.telegram_service import handle_update

        app = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()

        async def dispatch(update, context):
            if update.message:
                data = {
                    "message": {
                        "chat": {"id": update.message.chat_id},
                        "text": update.message.text or "",
                        "message_id": update.message.message_id,
                    }
                }
                async with AsyncSessionLocal() as db:
                    await handle_update(data, db)

        app.add_handler(MessageHandler(filters.TEXT, dispatch))
        logger.info("Telegram worker started, polling...")
        await app.run_polling()
    except Exception as e:
        logger.error(f"Telegram worker error: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
