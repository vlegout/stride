import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test_db")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing")
os.environ.setdefault("OBJECT_STORAGE_ENDPOINT", "https://s3.test.example.com")
os.environ.setdefault("OBJECT_STORAGE_REGION", "test-region")
os.environ.setdefault("SCW_ACCESS_KEY", "test-access-key")
os.environ.setdefault("SCW_SECRET_KEY", "test-secret-key")
os.environ.setdefault("BUCKET", "test-bucket")
