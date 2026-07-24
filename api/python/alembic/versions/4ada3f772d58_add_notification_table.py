"""add notification table

Revision ID: 4ada3f772d58
Revises: e1d51382fb2b
Create Date: 2025-12-14 09:37:48.290540

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4ada3f772d58"
down_revision: str | Sequence[str] | None = "e1d51382fb2b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create notification table
    op.create_table(
        "notification",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("activity_id", sa.UUID(), nullable=False),
        sa.Column("type", sa.String(), nullable=False),
        sa.Column("distance", sa.Float(), nullable=False),
        sa.Column("achievement_year", sa.Integer(), nullable=True),
        sa.Column("message", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["activity_id"],
            ["activity.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop notification table
    op.drop_table("notification")
