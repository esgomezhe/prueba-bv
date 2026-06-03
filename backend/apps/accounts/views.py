"""
Vistas de autenticación con JWT.

- login:   credenciales -> {access, refresh, user}
- refresh: refresh -> {access}
- logout:  invalida (blacklist) el refresh token
"""
from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import LoginSerializer


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — devuelve tokens en el cuerpo (JSON)."""

    permission_classes = [AllowAny]
    serializer_class = LoginSerializer


class LogoutView(APIView):
    """POST /api/auth/logout/ — invalida el refresh token (blacklist)."""

    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"error": {"code": "validation_error",
                           "message": "El campo 'refresh' es requerido."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            RefreshToken(refresh).blacklist()
        except TokenError:
            return Response(
                {"error": {"code": "validation_error",
                           "message": "Token de refresco inválido o expirado."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(status=status.HTTP_205_RESET_CONTENT)
