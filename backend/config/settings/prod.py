"""Configuración de producción."""
from .base import *  # noqa: F401,F403
from .base import MIDDLEWARE

DEBUG = False

# WhiteNoise sirve los archivos estáticos (admin, etc.) sin un servidor web
# aparte. Se inserta justo después del SecurityMiddleware.
MIDDLEWARE = MIDDLEWARE[:1] + [
    "whitenoise.middleware.WhiteNoiseMiddleware"
] + MIDDLEWARE[1:]

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Endurecimiento de seguridad para producción.
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"

# Cookies seguras solo bajo HTTPS. En el stack local de Docker (HTTP) se
# desactivan vía env para no romper el acceso; en HTTPS real, ponlas en True.
import environ  # noqa: E402

_env = environ.Env()
SESSION_COOKIE_SECURE = _env.bool("DJANGO_SECURE_COOKIES", default=False)
CSRF_COOKIE_SECURE = _env.bool("DJANGO_SECURE_COOKIES", default=False)
