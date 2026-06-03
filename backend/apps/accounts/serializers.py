"""Serializers de autenticación."""
from __future__ import annotations

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class LoginSerializer(TokenObtainPairSerializer):
    """
    Extiende el login para incluir datos básicos del usuario en la respuesta,
    útil para el frontend (mostrar nombre sin decodificar el token).
    """

    def validate(self, attrs: dict) -> dict:
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
        }
        return data
