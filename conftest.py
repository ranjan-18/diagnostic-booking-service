"""
Root pytest conftest.

Sets environment variables needed for Django to start without a .env file
so tests can run with SQLite out of the box:
    pytest

Against PostgreSQL (CI / production parity):
    DB_HOST=localhost DB_NAME=... pytest
"""
import os

# Must be set before Django is imported
os.environ.setdefault("DJANGO_SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("DJANGO_DEBUG", "True")
os.environ.setdefault("USE_SQLITE", "1")  # triggers SQLite fallback in local.py
