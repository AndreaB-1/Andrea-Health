# Import all models here so Alembic can detect them
from app.db.session import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.diary_entry import DiaryEntry  # noqa: F401
from app.models.biometric_log import BiometricLog  # noqa: F401
from app.models.telegram_message import TelegramMessage  # noqa: F401
