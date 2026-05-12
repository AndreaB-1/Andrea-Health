from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timedelta, timezone
import io
import csv
from app.db.session import get_db
from app.models.user import User
from app.models.diary_entry import DiaryEntry
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/csv")
async def export_csv(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
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

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Type", "Raw Text", "Parsed", "Meal Name",
                     "Calories", "Carbs", "Protein", "Fat", "Urine", "Stool", "AI"])
    for e in entries:
        writer.writerow([
            e.created_at.isoformat(), e.type.value, e.raw_text, e.parsed_text or "",
            e.meal_name or "", e.calories or "", e.carbs or "", e.protein or "", e.fat or "",
            e.urine_type.value if e.urine_type else "", e.stool_type.value if e.stool_type else "",
            e.ai_analyzed,
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=andrea_health_export.csv"},
    )


@router.get("/pdf")
async def export_pdf(
    from_date: Optional[datetime] = Query(None, alias="from"),
    to_date: Optional[datetime] = Query(None, alias="to"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not from_date:
        from_date = datetime.now(timezone.utc) - timedelta(days=7)
    if not to_date:
        to_date = datetime.now(timezone.utc)

    q = select(DiaryEntry).where(
        DiaryEntry.user_id == current_user.id,
        DiaryEntry.created_at >= from_date,
        DiaryEntry.created_at <= to_date,
    ).order_by(DiaryEntry.created_at)
    result = await db.execute(q)
    entries = result.scalars().all()

    html = f"""
    <html><head><meta charset="utf-8">
    <style>body{{font-family:sans-serif;font-size:12px;}}
    h1{{color:#00e5a0;}} table{{width:100%;border-collapse:collapse;}}
    th,td{{border:1px solid #ccc;padding:4px;text-align:left;}}
    th{{background:#f0f0f0;}}</style></head>
    <body>
    <h1>Andrea Health — Diario</h1>
    <p>Periodo: {from_date.date()} — {to_date.date()}</p>
    <table>
    <tr><th>Data</th><th>Tipo</th><th>Descrizione</th><th>Kcal</th><th>P</th><th>C</th><th>G</th></tr>
    """
    for e in entries:
        html += f"""<tr>
        <td>{e.created_at.strftime('%d/%m %H:%M')}</td>
        <td>{e.type.value}</td>
        <td>{e.parsed_text or e.raw_text}</td>
        <td>{int(e.calories) if e.calories else '-'}</td>
        <td>{e.protein or '-'}</td>
        <td>{e.carbs or '-'}</td>
        <td>{e.fat or '-'}</td>
        </tr>"""
    html += "</table></body></html>"

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=andrea_health_weekly.pdf"},
        )
    except Exception:
        return StreamingResponse(
            io.BytesIO(html.encode()),
            media_type="text/html",
            headers={"Content-Disposition": "attachment; filename=andrea_health_weekly.html"},
        )
