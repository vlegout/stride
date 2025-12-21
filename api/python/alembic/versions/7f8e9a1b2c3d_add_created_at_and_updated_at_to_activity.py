"""add created_at and updated_at to activity

Revision ID: 7f8e9a1b2c3d
Revises: 4ada3f772d58
Create Date: 2025-12-21 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7f8e9a1b2c3d"
down_revision: Union[str, Sequence[str], None] = "4ada3f772d58"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add created_at column to activity table
    op.add_column(
        "activity",
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("(NOW() AT TIME ZONE 'utc')"),
        ),
    )

    # Add updated_at column to activity table
    op.add_column(
        "activity",
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("(NOW() AT TIME ZONE 'utc')"),
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove updated_at column from activity table
    op.drop_column("activity", "updated_at")

    # Remove created_at column from activity table
    op.drop_column("activity", "created_at")
