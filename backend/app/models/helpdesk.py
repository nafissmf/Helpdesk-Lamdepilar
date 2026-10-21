from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.db.base_class import Base
from app.db.types import UTCDateTime
from app.models.base import TimestampMixin


class Service(Base, TimestampMixin):
    __tablename__ = "services"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    categories = relationship("Category", back_populates="service", cascade="all, delete-orphan")


class Category(Base, TimestampMixin):
    __tablename__ = "categories"
    __table_args__ = (UniqueConstraint("service_id", "name", name="uq_category_service_name"),)

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    service_id = Column(BigInteger, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    color = Column(String(32), nullable=False, default="#2B7DE0")

    service = relationship("Service", back_populates="categories")


class Ticket(Base, TimestampMixin):
    __tablename__ = "tickets"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    uuid = Column(String(36), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    study_program = Column(String(255), nullable=True)
    service_id = Column(BigInteger, ForeignKey("services.id"), nullable=False)
    category_id = Column(BigInteger, ForeignKey("categories.id"), nullable=False)
    staff_priority = Column(Boolean, nullable=False, default=False)
    status = Column(String(32), nullable=False, default="open")
    requester_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    assigned_to = Column(String(36), ForeignKey("users.id"), nullable=True)
    resolved_at = Column(UTCDateTime, nullable=True)

    service = relationship("Service")
    category = relationship("Category")
    requester = relationship("User", foreign_keys=[requester_id])
    assignee = relationship("User", foreign_keys=[assigned_to])
    replies = relationship("TicketReply", back_populates="ticket", cascade="all, delete-orphan")
    attachments = relationship("TicketAttachment", back_populates="ticket", cascade="all, delete-orphan")


class TicketReply(Base, TimestampMixin):
    __tablename__ = "ticket_replies"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ticket_id = Column(BigInteger, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)

    ticket = relationship("Ticket", back_populates="replies")
    author = relationship("User")
    attachments = relationship("TicketAttachment", back_populates="reply", cascade="all, delete-orphan")


class TicketAttachment(Base):
    __tablename__ = "ticket_attachments"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    ticket_id = Column(BigInteger, ForeignKey("tickets.id", ondelete="CASCADE"), nullable=True, index=True)
    reply_id = Column(BigInteger, ForeignKey("ticket_replies.id", ondelete="CASCADE"), nullable=True, index=True)
    file_name = Column(String(255), nullable=False)
    stored_name = Column(String(255), nullable=False)
    mime_type = Column(String(255), nullable=False)
    size = Column(Integer, nullable=False)
    created_at = Column(UTCDateTime, nullable=True)

    ticket = relationship("Ticket", back_populates="attachments")
    reply = relationship("TicketReply", back_populates="attachments")


class Article(Base, TimestampMixin):
    __tablename__ = "articles"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String(32), nullable=False, default="draft")
    card_color = Column(String(32), nullable=False, default="#2B7DE0")
    pdf_file_name = Column(String(255), nullable=True)
    pdf_stored_name = Column(String(255), nullable=True)
    pdf_mime_type = Column(String(255), nullable=True)
    pdf_size = Column(Integer, nullable=True)


class ManualPage(Base, TimestampMixin):
    __tablename__ = "manual_pages"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False)
    body = Column(Text, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    pdf_file_name = Column(String(255), nullable=True)
    pdf_stored_name = Column(String(255), nullable=True)
    pdf_mime_type = Column(String(255), nullable=True)
    pdf_size = Column(Integer, nullable=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message_key = Column(String(64), nullable=False)
    payload = Column(Text, nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(UTCDateTime, nullable=True)
