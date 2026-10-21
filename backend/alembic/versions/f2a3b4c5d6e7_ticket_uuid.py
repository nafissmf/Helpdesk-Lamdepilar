"""tickets: public uuid for unguessable URLs

Revision ID: f2a3b4c5d6e7
Revises: e1f2a3b4c5d6
Create Date: 2026-10-21

"""
import uuid

from alembic import op
import sqlalchemy as sa


revision = "f2a3b4c5d6e7"
down_revision = "e1f2a3b4c5d6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tickets", sa.Column("uuid", sa.String(length=36), nullable=True))
    conn = op.get_bind()
    rows = conn.execute(sa.text("SELECT id FROM tickets WHERE uuid IS NULL")).fetchall()
    for (ticket_id,) in rows:
        conn.execute(
            sa.text("UPDATE tickets SET uuid = :uuid WHERE id = :id"),
            {"uuid": str(uuid.uuid4()), "id": ticket_id},
        )
    op.alter_column("tickets", "uuid", existing_type=sa.String(length=36), nullable=False)
    op.create_index("ix_tickets_uuid", "tickets", ["uuid"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_tickets_uuid", table_name="tickets")
    op.drop_column("tickets", "uuid")
