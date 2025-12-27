"""add_pool_length_and_num_lengths_to_activity

Revision ID: 9b1677ce4cdb
Revises: 092b258ae1b1
Create Date: 2025-12-27 11:15:07.184599

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9b1677ce4cdb"
down_revision: Union[str, Sequence[str], None] = "092b258ae1b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add pool_length column to activity table
    op.add_column(
        "activity",
        sa.Column("pool_length", sa.SmallInteger(), nullable=True),
    )

    # Add num_lengths column to activity table
    op.add_column(
        "activity",
        sa.Column("num_lengths", sa.SmallInteger(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove num_lengths column from activity table
    op.drop_column("activity", "num_lengths")

    # Remove pool_length column from activity table
    op.drop_column("activity", "pool_length")
