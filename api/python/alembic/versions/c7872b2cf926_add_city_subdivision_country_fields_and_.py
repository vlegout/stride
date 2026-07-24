"""Add city, subdivision, country fields and remove location field

Revision ID: c7872b2cf926
Revises: 0e5e9e63a32e
Create Date: 2025-06-22 10:19:18.795641

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c7872b2cf926"
down_revision: str | Sequence[str] | None = "0e5e9e63a32e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new location fields to activity table
    op.add_column("activity", sa.Column("city", sa.String(), nullable=True))
    op.add_column("activity", sa.Column("subdivision", sa.String(), nullable=True))
    op.add_column("activity", sa.Column("country", sa.String(), nullable=True))

    # Remove the old location field
    op.drop_column("activity", "location")


def downgrade() -> None:
    """Downgrade schema."""
    # Add back the location field
    op.add_column("activity", sa.Column("location", sa.String(), nullable=True))

    # Remove the new location fields
    op.drop_column("activity", "country")
    op.drop_column("activity", "subdivision")
    op.drop_column("activity", "city")
