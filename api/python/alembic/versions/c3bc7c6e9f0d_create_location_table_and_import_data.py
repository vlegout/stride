"""Create location table and import data

Revision ID: c3bc7c6e9f0d
Revises: c7872b2cf926
Create Date: 2025-06-22 10:23:35.043804

"""

import json
import uuid
from pathlib import Path
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3bc7c6e9f0d"
down_revision: Union[str, Sequence[str], None] = "c7872b2cf926"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def parse_location(location_str: str) -> tuple[str | None, str | None, str | None]:
    """Parse location string into city, subdivision, country."""
    if not location_str:
        return None, None, None

    parts = [part.strip() for part in location_str.split(",")]

    if len(parts) == 1:
        # Only one part, assume it's a city
        return parts[0], None, None
    elif len(parts) == 2:
        # Two parts, assume city, country
        return parts[0], None, parts[1]
    elif len(parts) == 3:
        # Three parts, assume city, subdivision, country
        return parts[0], parts[1], parts[2]
    else:
        # More than 3 parts, take first as city, last as country, middle as subdivision
        return parts[0], " ".join(parts[1:-1]), parts[-1]


def upgrade() -> None:
    """Upgrade schema."""
    # Check if locations.json file exists first
    data_file = (
        Path(__file__).parent.parent.parent.parent.parent / "data" / "locations.json"
    )

    if not data_file.exists():
        raise FileNotFoundError(f"Required data file not found: {data_file}")

    # Create location table
    op.create_table(
        "location",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("subdivision", sa.String(), nullable=True),
        sa.Column("country", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # Load and import data from locations.json
    with open(data_file, "r") as f:
        data = json.load(f)

    connection = op.get_bind()
    location_table = sa.table(
        "location",
        sa.column("id", sa.UUID()),
        sa.column("lat", sa.Float()),
        sa.column("lon", sa.Float()),
        sa.column("city", sa.String()),
        sa.column("subdivision", sa.String()),
        sa.column("country", sa.String()),
    )

    for location_data in data["locations"]:
        city, subdivision, country = parse_location(location_data["location"])

        connection.execute(
            location_table.insert().values(
                id=str(uuid.uuid4()),
                lat=location_data["lat"],
                lon=location_data["lon"],
                city=city,
                subdivision=subdivision,
                country=country,
            )
        )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("location")
