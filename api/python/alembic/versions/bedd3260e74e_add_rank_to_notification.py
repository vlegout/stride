"""add_rank_to_notification

Revision ID: bedd3260e74e
Revises: 401bc1eef0c6
Create Date: 2026-01-02 12:41:13.810601

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "bedd3260e74e"
down_revision: str | Sequence[str] | None = "401bc1eef0c6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("notification", sa.Column("rank", sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("notification", "rank")
