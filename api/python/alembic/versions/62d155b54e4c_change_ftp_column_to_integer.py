"""change_ftp_column_to_integer

Revision ID: 62d155b54e4c
Revises: 556463c643c0
Create Date: 2025-07-03 07:25:00.041675

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "62d155b54e4c"
down_revision: str | Sequence[str] | None = "556463c643c0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        "ftp", "ftp", type_=sa.Integer(), postgresql_using="ROUND(ftp)::integer"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column("ftp", "ftp", type_=sa.Float())
