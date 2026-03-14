"""add index on activity user_id and start_time

Revision ID: b1c2d3e4f5a6
Revises: b3c4d5e6f7a8
Create Date: 2026-03-14 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "b3c4d5e6f7a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index(
        "ix_activity_user_id_start_time",
        "activity",
        ["user_id", "start_time"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_activity_user_id_start_time", table_name="activity")
