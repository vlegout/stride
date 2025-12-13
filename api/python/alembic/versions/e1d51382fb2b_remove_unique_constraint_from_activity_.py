"""remove unique constraint from activity fit field

Revision ID: e1d51382fb2b
Revises: 24aba78c08c3
Create Date: 2025-12-13 17:35:23.778651

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "e1d51382fb2b"
down_revision: Union[str, Sequence[str], None] = "24aba78c08c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint("activity_fit_key", "activity", type_="unique")


def downgrade() -> None:
    """Downgrade schema."""
    pass
