import os
from app.core.config import Settings


def test_database_url_configuration():
    """Verify Database configuration loads from DATABASE_URL."""
    custom_url = "postgresql+psycopg://user:pass@localhost:5432/testdb"
    os.environ["DATABASE_URL"] = custom_url
    try:
        settings = Settings()
        assert settings.DATABASE_URL == custom_url
    finally:
        os.environ.pop("DATABASE_URL", None)


def test_postgres_url_normalization():
    """Verify postgres:// is converted to postgresql+psycopg://."""
    legacy_url = "postgres://user:pass@dbhost:5432/dbname"
    os.environ["DATABASE_URL"] = legacy_url
    try:
        settings = Settings()
        assert settings.DATABASE_URL == "postgresql+psycopg://user:pass@dbhost:5432/dbname"
    finally:
        os.environ.pop("DATABASE_URL", None)
