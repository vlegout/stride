"""add_rank_to_notification

Revision ID: bedd3260e74e
Revises: 401bc1eef0c6
Create Date: 2026-01-02 12:41:13.810601

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "bedd3260e74e"
down_revision: Union[str, Sequence[str], None] = "401bc1eef0c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("notification", sa.Column("rank", sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("notification", "rank")
