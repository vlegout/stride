"""add activity zone tables for pace, power, and heart rate

Revision ID: 24aba78c08c3
Revises: a1b2c3d4e5f6
Create Date: 2025-07-07 20:02:57.414107

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "24aba78c08c3"
down_revision: str | Sequence[str] | None = "a1b2c3d4e5f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "activityzonepace",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("activity_id", sa.UUID(), nullable=False),
        sa.Column("zone_id", sa.UUID(), nullable=False),
        sa.Column("time_in_zone", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(
            ["activity_id"],
            ["activity.id"],
        ),
        sa.ForeignKeyConstraint(
            ["zone_id"],
            ["zone.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "activityzonepower",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("activity_id", sa.UUID(), nullable=False),
        sa.Column("zone_id", sa.UUID(), nullable=False),
        sa.Column("time_in_zone", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(
            ["activity_id"],
            ["activity.id"],
        ),
        sa.ForeignKeyConstraint(
            ["zone_id"],
            ["zone.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "activityzoneheartrate",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("activity_id", sa.UUID(), nullable=False),
        sa.Column("zone_id", sa.UUID(), nullable=False),
        sa.Column("time_in_zone", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(
            ["activity_id"],
            ["activity.id"],
        ),
        sa.ForeignKeyConstraint(
            ["zone_id"],
            ["zone.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("activityzoneheartrate")
    op.drop_table("activityzonepower")
    op.drop_table("activityzonepace")
