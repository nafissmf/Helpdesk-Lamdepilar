"""articles: optional PDF attachment

Revision ID: e1f2a3b4c5d6
Revises: d0e1f2a3b4c5
Create Date: 2026-10-21

"""
from alembic import op
import sqlalchemy as sa


revision = "e1f2a3b4c5d6"
down_revision = "d0e1f2a3b4c5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("articles", sa.Column("pdf_file_name", sa.String(length=255), nullable=True))
    op.add_column("articles", sa.Column("pdf_stored_name", sa.String(length=255), nullable=True))
    op.add_column("articles", sa.Column("pdf_mime_type", sa.String(length=255), nullable=True))
    op.add_column("articles", sa.Column("pdf_size", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("articles", "pdf_size")
    op.drop_column("articles", "pdf_mime_type")
    op.drop_column("articles", "pdf_stored_name")
    op.drop_column("articles", "pdf_file_name")
