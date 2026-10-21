"""manual_pages: optional PDF attachment

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-10-20

"""
from alembic import op
import sqlalchemy as sa


revision = "c9d0e1f2a3b4"
down_revision = "b8c9d0e1f2a3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("manual_pages", sa.Column("pdf_file_name", sa.String(length=255), nullable=True))
    op.add_column("manual_pages", sa.Column("pdf_stored_name", sa.String(length=255), nullable=True))
    op.add_column("manual_pages", sa.Column("pdf_mime_type", sa.String(length=255), nullable=True))
    op.add_column("manual_pages", sa.Column("pdf_size", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("manual_pages", "pdf_size")
    op.drop_column("manual_pages", "pdf_mime_type")
    op.drop_column("manual_pages", "pdf_stored_name")
    op.drop_column("manual_pages", "pdf_file_name")
