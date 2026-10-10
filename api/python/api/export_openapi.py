import json
import os
import sys

for name in (
    "DATABASE_URL",
    "JWT_SECRET_KEY",
    "OBJECT_STORAGE_ENDPOINT",
    "OBJECT_STORAGE_REGION",
    "SCW_ACCESS_KEY",
    "SCW_SECRET_KEY",
    "BUCKET",
):
    os.environ.setdefault(
        name,
        "postgresql://u:p@localhost/db" if name == "DATABASE_URL" else "openapi-export",
    )


def main() -> None:
    from api.app import app

    json.dump(app.openapi(), sys.stdout, indent=2, sort_keys=True)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
