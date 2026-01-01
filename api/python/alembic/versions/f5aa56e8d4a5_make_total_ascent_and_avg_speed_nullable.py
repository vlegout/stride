"""make_total_ascent_and_avg_speed_nullable

Revision ID: f5aa56e8d4a5
Revises: 9b1677ce4cdb
Create Date: 2026-01-01 09:30:59.219768

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f5aa56e8d4a5"
down_revision: Union[str, Sequence[str], None] = "9b1677ce4cdb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Make total_ascent nullable
    op.alter_column(
        "activity",
        "total_ascent",
        existing_type=sa.REAL(),
        nullable=True,
    )

    # Make avg_speed nullable
    op.alter_column(
        "activity",
        "avg_speed",
        existing_type=sa.REAL(),
        nullable=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Make avg_speed not nullable
    op.alter_column(
        "activity",
        "avg_speed",
        existing_type=sa.REAL(),
        nullable=False,
    )

    # Make total_ascent not nullable
    op.alter_column(
        "activity",
        "total_ascent",
        existing_type=sa.REAL(),
        nullable=False,
    )
