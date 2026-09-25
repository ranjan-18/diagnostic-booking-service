"""
Production settings.
"""
from .base import *  # noqa: F401, F403

DEBUG = env_bool("DJANGO_DEBUG", False)

# Allow all Vercel domains and configured hosts
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", ["*", ".vercel.app", "localhost", "127.0.0.1"])

# Vercel SSL Reverse Proxy Support
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Optional Strict Security
if env_bool("ENABLE_STRICT_SSL", False):
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
