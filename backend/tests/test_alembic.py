import pytest
import os
from alembic.config import Config
from alembic import command
from app.core.config import settings


def test_alembic_offline_migration(tmp_path):
    """Verify Alembic migration script can execute offline to produce SQL DDL."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    alembic_ini_path = os.path.join(backend_dir, "alembic.ini")
    
    alembic_cfg = Config(alembic_ini_path)
    alembic_cfg.set_main_option("script_location", os.path.join(backend_dir, "alembic"))
    alembic_cfg.set_main_option("sqlalchemy.url", "sqlite:///:memory:")

    # Execute offline upgrade to head
    try:
        command.upgrade(alembic_cfg, "head", sql=True)
    except Exception as exc:
        pytest.fail(f"Alembic offline migration failed with error: {exc}")
