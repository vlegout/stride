"""add min_temperature to activity

Revision ID: 6bc63aa6ba32
Revises: d512fe12eb64
Create Date: 2025-12-26 08:13:19.646162

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "6bc63aa6ba32"
down_revision: str | Sequence[str] | None = "d512fe12eb64"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "activity",
        sa.Column("min_temperature", sa.SmallInteger(), nullable=True),
    )
    op.drop_column("lap", "avg_temperature")


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        "lap",
        sa.Column("avg_temperature", sa.SmallInteger(), nullable=True),
    )
    op.drop_column("activity", "min_temperature")
