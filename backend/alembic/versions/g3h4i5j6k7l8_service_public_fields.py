"""services: description, group, sort_order, card_color for public catalog

Revision ID: g3h4i5j6k7l8
Revises: f2a3b4c5d6e7
Create Date: 2026-11-17

"""
from alembic import op
import sqlalchemy as sa


revision = "g3h4i5j6k7l8"
down_revision = "f2a3b4c5d6e7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("services", sa.Column("description", sa.Text(), nullable=True))
    op.add_column(
        "services",
        sa.Column("group", sa.String(length=32), nullable=False, server_default="info"),
    )
    op.add_column(
        "services",
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "services",
        sa.Column("card_color", sa.String(length=32), nullable=False, server_default="#2B7DE0"),
    )


def downgrade() -> None:
    op.drop_column("services", "card_color")
    op.drop_column("services", "sort_order")
    op.drop_column("services", "group")
    op.drop_column("services", "description")
