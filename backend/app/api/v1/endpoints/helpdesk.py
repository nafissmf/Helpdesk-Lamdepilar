"""Helpdesk HTTP routes. Each route checks a permission name, never a role name."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.deps_permission import permission_name_set, require_any_permission, require_permission
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.auth import User
from app.models.helpdesk import Article, ManualPage, Notification, Ticket, TicketAttachment, TicketReply
from app.schemas.common import WebResponse
from app.services import helpdesk as svc

router = APIRouter()


def _parse_bool(value: str | None) -> bool:
    return str(value or "").lower() in {"1", "true", "yes", "on"}


@router.get("/helpdesk/config", response_model=WebResponse[dict])
def get_config(db: Session = Depends(get_db), _user: User = Depends(require_permission("view_dashboard"))):
    return WebResponse(status="success", data=svc.helpdesk_config(db))


@router.get("/helpdesk/summary", response_model=WebResponse[dict])
def get_summary(db: Session = Depends(get_db), user: User = Depends(require_permission("view_dashboard"))):
    return WebResponse(status="success", data=svc.summary(db, user))


@router.get("/services", response_model=WebResponse[list])
def list_services(
    q: str | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(require_any_permission("create_ticket", "view_own_ticket", "view_all_ticket", "manage_service")),
):
    rows = svc.search_services(db, q)
    return WebResponse(status="success", data=[{"id": row.id, "name": row.name} for row in rows])


@router.get("/services/manage", response_model=WebResponse[dict])
def list_services_manage(
    q: str | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_service")),
):
    rows = svc.list_services_manage(db, q)
    return WebResponse(status="success", data={"items": [svc.service_item(row) for row in rows]})


@router.post("/services", response_model=WebResponse[dict])
def create_service(
    name: str = Form(...),
    is_active: str = Form("true"),
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_service")),
):
    row = svc.create_service(db, name=name, is_active=_parse_bool(is_active))
    return WebResponse(status="success", message="Layanan berhasil ditambahkan", data=svc.service_item(row))


@router.put("/services/{service_id}", response_model=WebResponse[dict])
def update_service(
    service_id: int,
    name: str = Form(...),
    is_active: str = Form("true"),
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_service")),
):
    row = svc.update_service(db, service_id, name=name, is_active=_parse_bool(is_active))
    return WebResponse(status="success", message="Layanan berhasil diperbarui", data=svc.service_item(row))


@router.delete("/services/{service_id}", response_model=WebResponse[dict])
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_service")),
):
    svc.delete_service(db, service_id)
    return WebResponse(status="success", message="Layanan dihapus atau dinonaktifkan", data={"id": service_id})


@router.get("/services/{service_id}/categories", response_model=WebResponse[list])
def list_categories(
    service_id: int,
    q: str | None = None,
    db: Session = Depends(get_db),
    _user: User = Depends(require_any_permission("create_ticket", "view_own_ticket", "view_all_ticket", "manage_service")),
):
    rows = svc.search_categories(db, service_id, q)
    return WebResponse(
        status="success",
        data=[{"id": row.id, "name": row.name, "color": row.color, "service_id": row.service_id} for row in rows],
    )


@router.post("/services/{service_id}/categories", response_model=WebResponse[dict])
def create_category(
    service_id: int,
    name: str = Form(...),
    color: str = Form("#8b1538"),
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_service")),
):
    row = svc.create_category(db, service_id, name=name, color=color)
    return WebResponse(
        status="success",
        message="Kategori berhasil ditambahkan",
        data={"id": row.id, "name": row.name, "color": row.color, "service_id": row.service_id},
    )


@router.put("/categories/{category_id}", response_model=WebResponse[dict])
def update_category(
    category_id: int,
    name: str = Form(...),
    color: str = Form("#8b1538"),
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_service")),
):
    row = svc.update_category(db, category_id, name=name, color=color)
    return WebResponse(
        status="success",
        message="Kategori berhasil diperbarui",
        data={"id": row.id, "name": row.name, "color": row.color, "service_id": row.service_id},
    )


@router.delete("/categories/{category_id}", response_model=WebResponse[dict])
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_service")),
):
    svc.delete_category(db, category_id)
    return WebResponse(status="success", message="Kategori dihapus", data={"id": category_id})


@router.get("/tickets", response_model=WebResponse[dict])
def list_tickets(
    q: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(require_any_permission("view_own_ticket", "view_all_ticket")),
):
    query = svc.scoped_tickets(db, user)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(Ticket.title.ilike(like))
    rows = query.order_by(Ticket.created_at.desc()).limit(limit).all()
    return WebResponse(status="success", data={"items": [svc.ticket_list_item(row) for row in rows]})


@router.post("/tickets", response_model=WebResponse[dict])
async def create_ticket(
    title: str = Form(...),
    service_id: int = Form(...),
    category_id: int = Form(...),
    description: str = Form(...),
    study_program: str = Form(""),
    staff_priority: str = Form("false"),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("create_ticket")),
):
    ticket = svc.create_ticket(
        db,
        user,
        title=title,
        service_id=service_id,
        category_id=category_id,
        staff_priority=_parse_bool(staff_priority),
        description=description,
        study_program=study_program,
    )
    await svc.store_uploads(db, files, ticket_id=ticket.id, reply_id=None)
    db.commit()
    db.refresh(ticket)
    ticket = svc.get_ticket_or_404(db, user, ticket.uuid)
    return WebResponse(status="success", message="Tiket berhasil dibuat", data=svc.ticket_detail(db, ticket))


@router.get("/tickets/{ticket_id}", response_model=WebResponse[dict])
def get_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_any_permission("view_own_ticket", "view_all_ticket")),
):
    ticket = svc.get_ticket_or_404(db, user, ticket_id)
    return WebResponse(status="success", data=svc.ticket_detail(db, ticket))


@router.post("/tickets/{ticket_id}/replies", response_model=WebResponse[dict])
async def reply_ticket(
    ticket_id: str,
    body: str = Form(...),
    files: list[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    user: User = Depends(require_any_permission("reply_ticket", "reply_own_ticket")),
):
    ticket = svc.get_ticket_or_404(db, user, ticket_id)
    reply = svc.add_reply(db, user, ticket, body)
    await svc.store_uploads(db, files, ticket_id=None, reply_id=reply.id)
    db.commit()
    ticket = svc.get_ticket_or_404(db, user, ticket_id)
    return WebResponse(status="success", message="Balasan terkirim", data=svc.ticket_detail(db, ticket))


@router.post("/tickets/{ticket_id}/close", response_model=WebResponse[dict])
def close_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("close_ticket")),
):
    ticket = svc.get_ticket_or_404(db, user, ticket_id)
    svc.close_ticket(db, user, ticket)
    db.commit()
    ticket = svc.get_ticket_or_404(db, user, ticket_id)
    return WebResponse(status="success", message="Tiket diselesaikan", data=svc.ticket_detail(db, ticket))


@router.delete("/tickets/{ticket_id}", response_model=WebResponse[dict])
def delete_ticket(
    ticket_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("delete_ticket")),
):
    ticket = svc.get_ticket_or_404(db, user, ticket_id)
    deleted_id = svc.delete_ticket(db, user, ticket)
    db.commit()
    return WebResponse(status="success", message="Tiket dihapus", data={"id": deleted_id})


@router.get("/tickets/{ticket_id}/attachments/{attachment_id}")
def download_attachment(
    ticket_id: str,
    attachment_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_any_permission("view_own_ticket", "view_all_ticket")),
):
    ticket = svc.get_ticket_or_404(db, user, ticket_id)
    row = db.query(TicketAttachment).filter(TicketAttachment.id == attachment_id).first()
    if not row:
        raise NotFoundException("Lampiran tidak ditemukan")
    if row.reply_id:
        reply = (
            db.query(TicketReply)
            .filter(TicketReply.id == row.reply_id, TicketReply.ticket_id == ticket.id)
            .first()
        )
        belongs = reply is not None
    else:
        belongs = row.ticket_id == ticket.id
    if not belongs:
        raise NotFoundException("Lampiran tidak ditemukan")
    path = svc.attachment_path(row)
    if not path.exists():
        raise NotFoundException("Berkas tidak ditemukan")
    mime = row.mime_type or "application/octet-stream"
    inline = mime == "application/pdf" or mime.startswith("image/") or (
        row.file_name or ""
    ).lower().endswith((".pdf", ".png", ".jpg", ".jpeg", ".webp"))
    return FileResponse(
        path,
        media_type=mime,
        filename=row.file_name,
        content_disposition_type="inline" if inline else "attachment",
    )


@router.get("/articles", response_model=WebResponse[dict])
def list_articles(
    q: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_any_permission("view_article", "manage_article")),
):
    names = permission_name_set(db, user)
    published_only = "manage_article" not in names
    rows = svc.list_articles(db, q, published_only)
    return WebResponse(status="success", data={"items": [svc.article_item(row) for row in rows]})


@router.post("/articles", response_model=WebResponse[dict])
async def create_article(
    title: str = Form(...),
    body: str = Form(""),
    status: str = Form("published"),
    card_color: str = Form("#2B7DE0"),
    pdf: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_article")),
):
    has_pdf = bool(pdf and pdf.filename)
    row = svc.create_article(
        db,
        title=title,
        body=body,
        status=status,
        card_color=card_color,
        has_pdf=has_pdf,
    )
    if has_pdf:
        await svc.store_article_pdf(db, row, pdf)
        db.commit()
        db.refresh(row)
    return WebResponse(status="success", data=svc.article_item(row))


@router.get("/articles/{article_id}", response_model=WebResponse[dict])
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_any_permission("view_article", "manage_article")),
):
    row = db.query(Article).filter(Article.id == article_id).first()
    names = permission_name_set(db, user)
    if not row or (row.status != "published" and "manage_article" not in names):
        raise NotFoundException("Artikel tidak ditemukan")
    return WebResponse(status="success", data=svc.article_item(row))


@router.get("/articles/{article_id}/pdf")
def get_article_pdf(
    article_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_any_permission("view_article", "manage_article")),
):
    row = db.query(Article).filter(Article.id == article_id).first()
    names = permission_name_set(db, user)
    if not row or (row.status != "published" and "manage_article" not in names):
        raise NotFoundException("Artikel tidak ditemukan")
    if not row.pdf_stored_name:
        raise NotFoundException("PDF tidak ditemukan")
    path = svc.article_pdf_path(row)
    if not path or not path.exists():
        raise NotFoundException("Berkas PDF tidak ditemukan")
    return FileResponse(
        path,
        media_type=row.pdf_mime_type or "application/pdf",
        filename=row.pdf_file_name or "artikel.pdf",
        content_disposition_type="inline",
    )


@router.put("/articles/{article_id}", response_model=WebResponse[dict])
async def update_article(
    article_id: int,
    title: str = Form(...),
    body: str = Form(""),
    status: str = Form("published"),
    card_color: str = Form("#2B7DE0"),
    remove_pdf: str = Form("false"),
    pdf: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_article")),
):
    has_new_pdf = bool(pdf and pdf.filename)
    row = svc.update_article(
        db,
        article_id,
        title=title,
        body=body,
        status=status,
        card_color=card_color,
        remove_pdf=_parse_bool(remove_pdf),
        has_new_pdf=has_new_pdf,
    )
    if has_new_pdf:
        await svc.store_article_pdf(db, row, pdf)
        db.commit()
        db.refresh(row)
    return WebResponse(status="success", data=svc.article_item(row))


@router.delete("/articles/{article_id}", response_model=WebResponse[dict])
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_article")),
):
    svc.delete_article(db, article_id)
    return WebResponse(status="success", data={"id": article_id})


@router.get("/manual", response_model=WebResponse[dict])
def list_manual(
    db: Session = Depends(get_db),
    _user: User = Depends(require_any_permission("view_manual", "manage_manual")),
):
    rows = svc.list_manual_pages(db)
    return WebResponse(status="success", data={"items": [svc.manual_item(row) for row in rows]})


@router.post("/manual", response_model=WebResponse[dict])
async def create_manual(
    title: str = Form(...),
    body: str = Form(""),
    slug: str = Form(""),
    sort_order: int = Form(0),
    pdf: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_manual")),
):
    has_pdf = bool(pdf and pdf.filename)
    row = svc.create_manual(
        db,
        title=title,
        body=body,
        slug=slug or None,
        sort_order=sort_order,
        has_pdf=has_pdf,
    )
    if has_pdf:
        await svc.store_manual_pdf(db, row, pdf)
        db.commit()
        db.refresh(row)
    return WebResponse(status="success", data=svc.manual_item(row))


@router.get("/manual/{slug}", response_model=WebResponse[dict])
def get_manual(
    slug: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_any_permission("view_manual", "manage_manual")),
):
    row = db.query(ManualPage).filter(ManualPage.slug == slug).first()
    if not row:
        raise NotFoundException("Halaman manual tidak ditemukan")
    return WebResponse(status="success", data=svc.manual_item(row))


@router.get("/manual/{manual_id}/pdf")
def get_manual_pdf(
    manual_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_any_permission("view_manual", "manage_manual")),
):
    row = db.query(ManualPage).filter(ManualPage.id == manual_id).first()
    if not row or not row.pdf_stored_name:
        raise NotFoundException("PDF tidak ditemukan")
    path = svc.manual_pdf_path(row)
    if not path or not path.exists():
        raise NotFoundException("Berkas PDF tidak ditemukan")
    return FileResponse(
        path,
        media_type=row.pdf_mime_type or "application/pdf",
        filename=row.pdf_file_name or "manual.pdf",
        content_disposition_type="inline",
    )


@router.put("/manual/{manual_id}", response_model=WebResponse[dict])
async def update_manual(
    manual_id: int,
    title: str = Form(...),
    body: str = Form(""),
    slug: str = Form(""),
    sort_order: int = Form(0),
    remove_pdf: str = Form("false"),
    pdf: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_manual")),
):
    has_new_pdf = bool(pdf and pdf.filename)
    row = svc.update_manual(
        db,
        manual_id,
        title=title,
        body=body,
        slug=slug or None,
        sort_order=sort_order,
        remove_pdf=remove_pdf.lower() in {"1", "true", "yes"},
        has_new_pdf=has_new_pdf,
    )
    if has_new_pdf:
        await svc.store_manual_pdf(db, row, pdf)
        db.commit()
        db.refresh(row)
    return WebResponse(status="success", data=svc.manual_item(row))


@router.delete("/manual/{manual_id}", response_model=WebResponse[dict])
def delete_manual(
    manual_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("manage_manual")),
):
    svc.delete_manual(db, manual_id)
    return WebResponse(status="success", data={"id": manual_id})


@router.get("/reports/tickets", response_model=WebResponse[dict])
def ticket_report(
    range_days: int = Query(default=30, alias="range"),
    db: Session = Depends(get_db),
    user: User = Depends(require_any_permission("view_own_report", "view_all_report")),
):
    if range_days not in {7, 30, 90}:
        raise BadRequestException("Periode laporan tidak valid")
    return WebResponse(status="success", data=svc.report(db, user, range_days))


@router.get("/reports/tickets/export")
def export_ticket_report(
    range_days: int = Query(default=30, alias="range"),
    export_format: str = Query(default="pdf", alias="format"),
    db: Session = Depends(get_db),
    user: User = Depends(require_any_permission("export_own_report", "export_all_report")),
):
    names = permission_name_set(db, user)
    if range_days not in {7, 30, 90}:
        raise BadRequestException("Periode laporan tidak valid")
    fmt = (export_format or "pdf").strip().lower()
    if fmt not in {"pdf", "xlsx", "excel"}:
        raise BadRequestException("Format ekspor tidak valid (pdf/xlsx)")
    data = svc.report(db, user, range_days)
    if data["scope"] == "all" and "export_all_report" not in names:
        raise ForbiddenException("Insufficient permissions")
    if data["scope"] == "own" and "export_own_report" not in names and "export_all_report" not in names:
        raise ForbiddenException("Insufficient permissions")
    if fmt in {"xlsx", "excel"}:
        content = svc.build_report_xlsx(data)
        filename = f"laporan-tiket-{range_days}hari.xlsx"
        media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        content = svc.build_report_pdf(data)
        filename = f"laporan-tiket-{range_days}hari.pdf"
        media = "application/pdf"
    return Response(
        content=content,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/notifications", response_model=WebResponse[dict])
def list_notifications(
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("view_notification")),
):
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )
    return WebResponse(
        status="success",
        data={
            "items": [
                {
                    "id": row.id,
                    "message_key": row.message_key,
                    "payload": json.loads(row.payload) if row.payload else {},
                    "is_read": bool(row.is_read),
                    "created_at": row.created_at,
                }
                for row in rows
            ]
        },
    )


@router.post("/notifications/{notification_id}/read", response_model=WebResponse[dict])
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("view_notification")),
):
    row = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user.id)
        .first()
    )
    if not row:
        raise NotFoundException("Notifikasi tidak ditemukan")
    row.is_read = True
    db.commit()
    return WebResponse(status="success", data={"id": row.id})
