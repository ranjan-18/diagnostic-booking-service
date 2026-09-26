"""
Vercel Serverless WSGI Entry Point
"""
import os
import sys
import traceback
from pathlib import Path

# Set up project path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Use production settings on Vercel
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

try:
    import django
    django.setup()

    from django.core.management import call_command
    from django.core.wsgi import get_wsgi_application

    # Auto-migrate and seed in /tmp when running on Vercel with SQLite fallback
    is_vercel = bool(os.environ.get("VERCEL"))
    db_host = os.environ.get("DB_HOST", "").strip()

    if is_vercel and not db_host:
        db_file = Path("/tmp/db.sqlite3")
        if not db_file.exists():
            try:
                call_command("migrate", interactive=False)
                call_command("seed_data")
            except Exception as e:
                print(f"[Vercel Initialization Error]: {e}")
                traceback.print_exc()

    _django_app = get_wsgi_application()

    def app(environ, start_response):
        try:
            return _django_app(environ, start_response)
        except Exception as e:
            traceback.print_exc()
            status = "500 Internal Server Error"
            headers = [("Content-Type", "application/json")]
            start_response(status, headers)
            return [b'{"error": "Internal Server Error", "detail": "' + str(e).encode() + b'"}']

    application = app

except Exception as err:
    traceback.print_exc()
    error_msg = str(err)
    error_tb = traceback.format_exc()

    def app(environ, start_response):
        traceback.print_exc()
        status = "500 Internal Server Error"
        headers = [("Content-Type", "application/json")]
        start_response(status, headers)
        return [
            b'{"error": "Application initialization failed", "detail": "'
            + error_msg.encode()
            + b'"}'
        ]

    application = app
