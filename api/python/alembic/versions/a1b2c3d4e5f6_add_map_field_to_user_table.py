"""add map field to user table

Revision ID: a1b2c3d4e5f6
Revises: 62d155b54e4c
Create Date: 2025-07-06 07:58:53.803787

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "62d155b54e4c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add map column to user table
    op.add_column(
        "user",
        sa.Column("map", sa.String(), nullable=False, server_default="leaflet"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove map column from user table
    op.drop_column("user", "map")
