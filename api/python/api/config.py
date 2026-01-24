import os


def _get_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


DATABASE_URL = _get_env("DATABASE_URL")
JWT_SECRET_KEY = _get_env("JWT_SECRET_KEY")
OBJECT_STORAGE_ENDPOINT = _get_env("OBJECT_STORAGE_ENDPOINT")
OBJECT_STORAGE_REGION = _get_env("OBJECT_STORAGE_REGION")
SCW_ACCESS_KEY = _get_env("SCW_ACCESS_KEY")
SCW_SECRET_KEY = _get_env("SCW_SECRET_KEY")
BUCKET = _get_env("BUCKET")
