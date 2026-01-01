"""add_power_to_notification

Revision ID: 401bc1eef0c6
Revises: 8d2d94b7f265
Create Date: 2026-01-01 16:22:20.831213

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "401bc1eef0c6"
down_revision: Union[str, Sequence[str], None] = "8d2d94b7f265"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("notification", sa.Column("power", sa.Float(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("notification", "power")
