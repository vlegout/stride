"""remove minutes and seconds fields from lap table

Revision ID: f1d2a86022f0
Revises: c3bc7c6e9f0d
Create Date: 2025-06-27 13:04:08.752082

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1d2a86022f0'
down_revision: Union[str, Sequence[str], None] = 'c3bc7c6e9f0d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove minutes and seconds fields from lap table
    op.drop_column('lap', 'minutes')
    op.drop_column('lap', 'seconds')


def downgrade() -> None:
    """Downgrade schema."""
    # Add back minutes and seconds fields to lap table
    op.add_column('lap', sa.Column('minutes', sa.Integer(), nullable=True))
    op.add_column('lap', sa.Column('seconds', sa.Integer(), nullable=True))
