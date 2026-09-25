"""
Local development settings.
"""
import os

# Set sensible defaults so tests work without a .env file.
# In production these MUST be overridden via real environment variables.
os.environ.setdefault("DJANGO_SECRET_KEY", "local-dev-insecure-key-replace-me")
os.environ.setdefault("DJANGO_DEBUG", "True")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_NAME", "eve_healthcare")
os.environ.setdefault("DB_USER", "postgres")
os.environ.setdefault("DB_PASSWORD", "postgres")
os.environ.setdefault("DB_PORT", "5432")

from .base import *  # noqa: F401, F403

DEBUG = True

# Allow all hosts locally
ALLOWED_HOSTS = ["*"]
CORS_ALLOW_ALL_ORIGINS = True

# Use SQLite for tests when USE_SQLITE=1 env var is set
if os.environ.get("USE_SQLITE"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }
