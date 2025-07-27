"""Add PerformanceRecord table for top 5 tracking

Revision ID: f4df0b04a5cc
Revises: 24aba78c08c3
Create Date: 2025-07-27 16:01:38.549675

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f4df0b04a5cc"
down_revision: Union[str, Sequence[str], None] = "24aba78c08c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "performancerecord",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("activity_id", sa.UUID(), nullable=False),
        sa.Column("performance_id", sa.UUID(), nullable=True),
        sa.Column("performance_power_id", sa.UUID(), nullable=True),
        sa.Column("metric_type", sa.String(), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("scope", sa.String(), nullable=False),
        sa.Column("record_date", sa.DateTime(), nullable=False),
        sa.Column("sport", sa.String(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["activity_id"],
            ["activity.id"],
        ),
        sa.ForeignKeyConstraint(
            ["performance_id"],
            ["performance.id"],
        ),
        sa.ForeignKeyConstraint(
            ["performance_power_id"],
            ["performancepower.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("performancerecord")
