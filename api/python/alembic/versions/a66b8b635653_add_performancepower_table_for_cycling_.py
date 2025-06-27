"""Add PerformancePower table for cycling power performances

Revision ID: a66b8b635653
Revises: f1d2a86022f0
Create Date: 2025-06-27 13:47:59.382031

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a66b8b635653"
down_revision: Union[str, Sequence[str], None] = "f1d2a86022f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create performancepower table
    op.create_table(
        "performancepower",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("time", sa.Interval(), nullable=False),
        sa.Column("power", sa.Float(), nullable=False),
        sa.Column("activity_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["activity_id"],
            ["activity.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop performancepower table
    op.drop_table("performancepower")
