"""Telegram bot worker using polling (runs as separate container)."""
import logging
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not set, worker exiting.")
        return

    from telegram.ext import ApplicationBuilder, MessageHandler, filters
    from app.db.session import AsyncSessionLocal
    from app.services.telegram_service import handle_update

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

    application = ApplicationBuilder().token(settings.TELEGRAM_BOT_TOKEN).build()
    application.add_handler(MessageHandler(filters.TEXT, dispatch))

    logger.info("Telegram worker started, polling...")
    application.run_polling()


if __name__ == "__main__":
    main()
