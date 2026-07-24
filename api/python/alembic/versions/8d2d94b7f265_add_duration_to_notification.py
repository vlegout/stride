"""add_duration_to_notification

Revision ID: 8d2d94b7f265
Revises: f5aa56e8d4a5
Create Date: 2026-01-01 15:56:31.384587

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "8d2d94b7f265"
down_revision: str | Sequence[str] | None = "f5aa56e8d4a5"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add duration column for power-based notifications
    op.add_column("notification", sa.Column("duration", sa.Interval(), nullable=True))

    # Make distance nullable to support both distance and duration notifications
    op.alter_column("notification", "distance", existing_type=sa.Float(), nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Make distance non-nullable again
    op.alter_column(
        "notification", "distance", existing_type=sa.Float(), nullable=False
    )

    # Drop duration column
    op.drop_column("notification", "duration")
