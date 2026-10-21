"""tickets: study_program (jurusan)

Revision ID: d0e1f2a3b4c5
Revises: c9d0e1f2a3b4
Create Date: 2026-10-21

"""
from alembic import op
import sqlalchemy as sa


revision = "d0e1f2a3b4c5"
down_revision = "c9d0e1f2a3b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tickets", sa.Column("study_program", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("tickets", "study_program")
