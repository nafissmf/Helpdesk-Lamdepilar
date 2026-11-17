"""Public helpdesk endpoints — no authentication required."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db
from app.core.exceptions import BadRequestException, NotFoundException
from app.core.rate_limit import enforce_rate_limit
from app.core.turnstile import turnstile_is_configured, verify_turnstile_response
from app.models.helpdesk import Article, ManualPage, Service
from app.schemas.common import WebResponse
from app.services import helpdesk as svc

router = APIRouter(prefix="/public", tags=["Public Helpdesk"])


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return (forwarded.split(",")[0] or "").strip() or "unknown"
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _enforce_guest_ticket_rate_limit(request: Request) -> None:
    enforce_rate_limit(
        request,
        scope="public_ticket",
        max_attempts=10,
        window_seconds=600,
        detail="Terlalu banyak pengajuan tiket. Silakan coba lagi nanti.",
    )


def _enforce_track_rate_limit(request: Request) -> None:
    enforce_rate_limit(
        request,
        scope="public_track",
        max_attempts=30,
        window_seconds=300,
        detail="Terlalu banyak percobaan pelacakan. Silakan coba lagi nanti.",
    )


@router.get("/config", response_model=WebResponse[dict])
def get_public_config(db: Session = Depends(get_db)):
    return WebResponse(status="success", data=svc.helpdesk_config(db))


@router.get("/services", response_model=WebResponse[list])
def list_public_services(q: str | None = None, db: Session = Depends(get_db)):
    rows = (
        db.query(Service)
        .options(joinedload(Service.categories))
        .filter(Service.is_active.is_(True))
    )
    if q:
        like = f"%{q.strip()}%"
        rows = rows.filter((Service.name.ilike(like)) | (Service.description.ilike(like)))
    items = rows.order_by(Service.sort_order.asc(), Service.name.asc()).all()
    return WebResponse(status="success", data=[svc.public_service_item(row) for row in items])


@router.get("/services/{service_id}/categories", response_model=WebResponse[list])
def list_public_categories(
    service_id: int,
    q: str | None = None,
    db: Session = Depends(get_db),
):
    service = db.query(Service).filter(Service.id == service_id, Service.is_active.is_(True)).first()
    if not service:
        raise NotFoundException("Layanan tidak ditemukan")
    rows = svc.search_categories(db, service_id, q)
    return WebResponse(
        status="success",
        data=[{"id": row.id, "name": row.name, "color": row.color, "service_id": row.service_id} for row in rows],
    )


@router.get("/articles", response_model=WebResponse[dict])
def list_public_articles(q: str | None = None, db: Session = Depends(get_db)):
    rows = svc.list_articles(db, q, published_only=True)
    return WebResponse(status="success", data={"items": [svc.article_item(row) for row in rows]})


@router.get("/articles/{article_id}", response_model=WebResponse[dict])
def get_public_article(article_id: int, db: Session = Depends(get_db)):
    row = (
        db.query(Article)
        .filter(Article.id == article_id, Article.status == "published")
        .first()
    )
    if not row:
        raise NotFoundException("Artikel tidak ditemukan")
    return WebResponse(status="success", data=svc.article_item(row))


@router.get("/manual", response_model=WebResponse[dict])
def list_public_manual(db: Session = Depends(get_db)):
    rows = svc.list_manual_pages(db)
    return WebResponse(
        status="success",
        data={"items": [svc.manual_item(row, include_body=False) for row in rows]},
    )


@router.get("/manual/{slug}", response_model=WebResponse[dict])
def get_public_manual(slug: str, db: Session = Depends(get_db)):
    row = db.query(ManualPage).filter(ManualPage.slug == slug).first()
    if not row:
        raise NotFoundException("Panduan tidak ditemukan")
    return WebResponse(status="success", data=svc.manual_item(row, include_body=True))


@router.get("/stats", response_model=WebResponse[dict])
def get_public_stats(db: Session = Depends(get_db)):
    return WebResponse(status="success", data=svc.public_stats(db))


@router.post("/tickets", response_model=WebResponse[dict])
async def create_public_ticket(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    university: str = Form(""),
    study_program: str = Form(""),
    title: str = Form(...),
    description: str = Form(...),
    service_id: int = Form(...),
    category_id: int = Form(...),
    turnstile_token: str = Form(""),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    _enforce_guest_ticket_rate_limit(request)

    if turnstile_is_configured():
        if not (turnstile_token or "").strip():
            raise BadRequestException(
                "Verifikasi keamanan wajib. Muat ulang halaman lalu coba lagi."
            )
        if not verify_turnstile_response(turnstile_token, _client_ip(request)):
            raise BadRequestException(
                "Verifikasi keamanan gagal atau kedaluwarsa. Silakan coba lagi."
            )

    if not (name or "").strip():
        raise BadRequestException("Nama wajib diisi")
    if not (phone or "").strip():
        raise BadRequestException("Nomor WhatsApp wajib diisi")
    if not (university or "").strip():
        raise BadRequestException("Nama universitas wajib diisi")
    if not (study_program or "").strip():
        raise BadRequestException("Jurusan wajib diisi")

    institution = svc._format_guest_institution(university, study_program)
    user = svc.find_or_create_guest_user(
        db,
        name=name,
        email=email,
        phone=phone,
        institution=institution,
    )
    ticket = svc.create_guest_ticket(
        db,
        user,
        title=title,
        service_id=service_id,
        category_id=category_id,
        description=description,
        study_program=study_program,
    )
    await svc.store_uploads(db, files, ticket_id=ticket.id, reply_id=None)
    db.commit()
    db.refresh(ticket)
    ticket = svc.track_guest_ticket(db, code=ticket.uuid, email=email)
    detail = svc.ticket_detail(db, ticket)
    return WebResponse(
        status="success",
        message="Tiket berhasil dikirim",
        data={
            **detail,
            "tracking_code": ticket.uuid,
        },
    )


@router.get("/tickets/track", response_model=WebResponse[dict])
def track_public_ticket(
    request: Request,
    code: str = Query(...),
    email: str = Query(...),
    db: Session = Depends(get_db),
):
    _enforce_track_rate_limit(request)
    ticket = svc.track_guest_ticket(db, code=code, email=email)
    detail = svc.ticket_detail(db, ticket)
    return WebResponse(
        status="success",
        data={
            **detail,
            "tracking_code": ticket.uuid,
        },
    )


@router.post("/tickets/reply", response_model=WebResponse[dict])
async def reply_public_ticket(
    request: Request,
    code: str = Form(...),
    email: str = Form(...),
    body: str = Form(...),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
):
    _enforce_guest_ticket_rate_limit(request)
    ticket, reply = svc.add_guest_reply(db, code=code, email=email, body=body)
    await svc.store_uploads(db, files, ticket_id=ticket.id, reply_id=reply.id)
    db.commit()
    ticket = svc.track_guest_ticket(db, code=code, email=email)
    detail = svc.ticket_detail(db, ticket)
    return WebResponse(
        status="success",
        message="Balasan berhasil dikirim",
        data={
            **detail,
            "tracking_code": ticket.uuid,
        },
    )
