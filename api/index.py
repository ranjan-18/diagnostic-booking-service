"""
Vercel Serverless WSGI Entry Point
"""
import os
import sys
from pathlib import Path

# Set up project path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Use production settings on Vercel
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

import django
django.setup()

from django.core.management import call_command
from django.core.wsgi import get_wsgi_application

# Auto-migrate and seed in /tmp when running on Vercel with SQLite fallback
if os.environ.get("VERCEL") and not os.environ.get("DB_HOST"):
    try:
        call_command("migrate", interactive=False)
        call_command("seed_data", interactive=False)
    except Exception as e:
        print(f"[Vercel Initialization]: {e}")

# Vercel looks for 'app'
application = get_wsgi_application()
app = application
