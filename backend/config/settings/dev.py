"""Configuración de desarrollo."""
from .base import *  # noqa: F401,F403
from .base import env

DEBUG = True

ALLOWED_HOSTS = ["*"]

# Permite SQLite como fallback local si no hay PostgreSQL a mano.
# DATABASE_URL sigue teniendo prioridad cuando está definido.
if env("USE_SQLITE", default=False):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",  # noqa: F405
        }
    }
