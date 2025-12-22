"""add temperature fields to activity lap and tracepoint

Revision ID: d512fe12eb64
Revises: 7f8e9a1b2c3d
Create Date: 2025-12-22 15:33:58.054296

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d512fe12eb64"
down_revision: Union[str, Sequence[str], None] = "7f8e9a1b2c3d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add avg_temperature column to activity table
    op.add_column(
        "activity",
        sa.Column("avg_temperature", sa.SmallInteger(), nullable=True),
    )

    # Add max_temperature column to activity table
    op.add_column(
        "activity",
        sa.Column("max_temperature", sa.SmallInteger(), nullable=True),
    )

    # Add avg_temperature column to lap table
    op.add_column(
        "lap",
        sa.Column("avg_temperature", sa.SmallInteger(), nullable=True),
    )

    # Add temperature column to tracepoint table
    op.add_column(
        "tracepoint",
        sa.Column("temperature", sa.SmallInteger(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove temperature column from tracepoint table
    op.drop_column("tracepoint", "temperature")

    # Remove avg_temperature column from lap table
    op.drop_column("lap", "avg_temperature")

    # Remove max_temperature column from activity table
    op.drop_column("activity", "max_temperature")

    # Remove avg_temperature column from activity table
    op.drop_column("activity", "avg_temperature")
