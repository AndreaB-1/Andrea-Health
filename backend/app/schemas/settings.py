from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class ReminderTime(BaseModel):
    label: str
    time: str
    enabled: bool = True


class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    calorie_goal: Optional[int] = None
    protein_goal: Optional[int] = None
    height_cm: Optional[float] = None
    telegram_chat_id: Optional[str] = None
    telegram_bot_token: Optional[str] = None
    claude_api_key: Optional[str] = None
    reminder_times: Optional[List[ReminderTime]] = None
    telegram_reminders_enabled: Optional[bool] = None


class SettingsResponse(BaseModel):
    theme: str = "dark"
    calorie_goal: int = 1700
    protein_goal: int = 100
    height_cm: Optional[float] = None
    telegram_chat_id: Optional[str] = None
    telegram_bot_token: Optional[str] = None
    has_claude_api_key: bool = False
    reminder_times: List[Dict[str, Any]] = []
    telegram_reminders_enabled: bool = False
