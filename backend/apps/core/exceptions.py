"""
Manejo centralizado de errores de la API.

Normaliza TODAS las respuestas de error a un contrato único y predecible:

    {
        "error": {
            "code": "validation_error",
            "message": "Mensaje legible para el usuario.",
            "details": { ... }   # opcional, por campo
        }
    }

Esto permite que el frontend maneje errores de forma uniforme.
"""
from __future__ import annotations

from typing import Any

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

# Mapea el status HTTP a un código de error estable y legible por máquina.
_CODE_BY_STATUS: dict[int, str] = {
    status.HTTP_400_BAD_REQUEST: "validation_error",
    status.HTTP_401_UNAUTHORIZED: "not_authenticated",
    status.HTTP_403_FORBIDDEN: "permission_denied",
    status.HTTP_404_NOT_FOUND: "not_found",
    status.HTTP_405_METHOD_NOT_ALLOWED: "method_not_allowed",
    status.HTTP_409_CONFLICT: "conflict",
    status.HTTP_429_TOO_MANY_REQUESTS: "throttled",
}


def _build_message(detail: Any) -> str:
    """Extrae un mensaje legible del detalle de la excepción de DRF."""
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list) and detail:
        return _build_message(detail[0])
    if isinstance(detail, dict) and detail:
        first_key = next(iter(detail))
        return _build_message(detail[first_key])
    return "Ocurrió un error procesando la solicitud."


def custom_exception_handler(exc: Exception, context: dict) -> Response | None:
    """Envuelve el handler de DRF en el contrato de error de la aplicación."""
    response = drf_exception_handler(exc, context)

    if response is None:
        # Excepción no controlada por DRF: respuesta 500 genérica sin filtrar
        # el stacktrace al cliente.
        return Response(
            {
                "error": {
                    "code": "server_error",
                    "message": "Error interno del servidor.",
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    detail = response.data
    code = _CODE_BY_STATUS.get(response.status_code, "error")

    payload: dict[str, Any] = {
        "error": {
            "code": code,
            "message": _build_message(detail),
        }
    }

    # Si el detalle es un dict por campo (errores de validación), se expone
    # como `details` para que el frontend lo mapee a cada input.
    if isinstance(detail, dict) and "detail" not in detail:
        payload["error"]["details"] = detail

    response.data = payload
    return response
