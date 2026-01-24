"""add_heatmap_table

Revision ID: a1b2c3d4e5f7
Revises: bedd3260e74e
Create Date: 2026-01-24 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


revision: str = "a1b2c3d4e5f7"
down_revision: Union[str, Sequence[str], None] = "bedd3260e74e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "heatmap",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("polylines", JSON(), nullable=False, server_default="[]"),
        sa.Column("activity_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("point_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["user.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("heatmap")
