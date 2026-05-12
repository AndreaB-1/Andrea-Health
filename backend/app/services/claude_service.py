import json
from typing import Optional
import anthropic
from app.schemas.diary import AnalyzeResponse, TagSchema, MacrosSchema
from app.models.diary_entry import EntryType, UrineType, StoolType
from app.core.config import settings

SYSTEM_PROMPT = """Sei un assistente nutrizionale. Analizza il testo e restituisci SOLO JSON:
{
  "type": "meal" | "bathroom" | "note",
  "parsed": "descrizione strutturata in italiano",
  "meal_name": "nome pasto se identificabile, es. Colazione | Pranzo | Cena | Spuntino",
  "tags": [
    {"label": "~XXX kcal", "type": "kcal"},
    {"label": "C:Xg P:Xg G:Xg", "type": "macro"}
  ],
  "macros": {"calories": int, "carbs": float, "protein": float, "fat": float} | null,
  "urine_type": "clear" | "normal" | "concentrated" | null,
  "stool_type": "normal" | "hard" | "soft" | "diarrhea" | null,
  "confidence": 0.0-1.0
}"""


async def analyze_text(text: str, api_key: Optional[str] = None) -> AnalyzeResponse:
    key = api_key or settings.ANTHROPIC_API_KEY
    if not key:
        return _fallback_analysis(text)

    try:
        client = anthropic.Anthropic(api_key=key)
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": text}],
        )
        raw = message.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0]
        data = json.loads(raw)
        return _parse_response(data)
    except Exception:
        return _fallback_analysis(text)


def _parse_response(data: dict) -> AnalyzeResponse:
    macros = None
    if data.get("macros"):
        m = data["macros"]
        macros = MacrosSchema(
            calories=int(m.get("calories", 0)),
            carbs=float(m.get("carbs", 0)),
            protein=float(m.get("protein", 0)),
            fat=float(m.get("fat", 0)),
        )

    tags = [TagSchema(label=t["label"], type=t["type"]) for t in (data.get("tags") or [])]

    entry_type = EntryType.note
    raw_type = data.get("type", "note")
    if raw_type in ("meal", "bathroom", "note"):
        entry_type = EntryType(raw_type)

    urine = None
    if data.get("urine_type") in ("clear", "normal", "concentrated"):
        urine = UrineType(data["urine_type"])

    stool = None
    if data.get("stool_type") in ("normal", "hard", "soft", "diarrhea"):
        stool = StoolType(data["stool_type"])

    return AnalyzeResponse(
        type=entry_type,
        parsed=data.get("parsed", ""),
        meal_name=data.get("meal_name"),
        tags=tags,
        macros=macros,
        urine_type=urine,
        stool_type=stool,
        confidence=float(data.get("confidence", 0.5)),
    )


def _fallback_analysis(text: str) -> AnalyzeResponse:
    lower = text.lower()
    if any(w in lower for w in ["urina", "pipi", "bagno", "feci", "cacca", "wc"]):
        return AnalyzeResponse(type=EntryType.bathroom, parsed=text, confidence=0.6)
    return AnalyzeResponse(type=EntryType.note, parsed=text, confidence=0.3)
