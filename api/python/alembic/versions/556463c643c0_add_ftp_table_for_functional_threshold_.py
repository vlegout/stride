"""add_ftp_table_for_functional_threshold_power

Revision ID: 556463c643c0
Revises: 82cdcb052b9e
Create Date: 2025-07-02 19:56:33.342119

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "556463c643c0"
down_revision: str | Sequence[str] | None = "82cdcb052b9e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create ftp table
    op.create_table(
        "ftp",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("ftp", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["user.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop ftp table
    op.drop_table("ftp")
