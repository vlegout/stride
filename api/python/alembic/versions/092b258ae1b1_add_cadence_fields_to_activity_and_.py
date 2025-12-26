"""add cadence fields to activity and tracepoint

Revision ID: 092b258ae1b1
Revises: 6bc63aa6ba32
Create Date: 2025-12-26 18:06:39.412695

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "092b258ae1b1"
down_revision: Union[str, Sequence[str], None] = "6bc63aa6ba32"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add avg_cadence column to activity table
    op.add_column(
        "activity",
        sa.Column("avg_cadence", sa.SmallInteger(), nullable=True),
    )

    # Add max_cadence column to activity table
    op.add_column(
        "activity",
        sa.Column("max_cadence", sa.SmallInteger(), nullable=True),
    )

    # Add cadence column to tracepoint table
    op.add_column(
        "tracepoint",
        sa.Column("cadence", sa.SmallInteger(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove cadence column from tracepoint table
    op.drop_column("tracepoint", "cadence")

    # Remove max_cadence column from activity table
    op.drop_column("activity", "max_cadence")

    # Remove avg_cadence column from activity table
    op.drop_column("activity", "avg_cadence")
