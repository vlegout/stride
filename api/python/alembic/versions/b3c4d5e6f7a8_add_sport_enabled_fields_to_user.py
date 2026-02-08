"""add sport enabled fields to user

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f7
Create Date: 2026-02-08 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b3c4d5e6f7a8"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user",
        sa.Column(
            "running_enabled", sa.Boolean(), nullable=False, server_default="true"
        ),
    )
    op.add_column(
        "user",
        sa.Column(
            "cycling_enabled", sa.Boolean(), nullable=False, server_default="true"
        ),
    )
    op.add_column(
        "user",
        sa.Column(
            "swimming_enabled", sa.Boolean(), nullable=False, server_default="true"
        ),
    )


def downgrade() -> None:
    op.drop_column("user", "swimming_enabled")
    op.drop_column("user", "cycling_enabled")
    op.drop_column("user", "running_enabled")
