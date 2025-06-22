"""Add status field to activities

Revision ID: 0e5e9e63a32e
Revises:
Create Date: 2025-06-22 08:19:03.787101

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0e5e9e63a32e"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add status column to activity table
    op.add_column(
        "activity",
        sa.Column("status", sa.String(), nullable=False, server_default="created"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove status column from activity table
    op.drop_column("activity", "status")
