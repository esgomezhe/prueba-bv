"""Validación de los parámetros de consulta del reporte."""
from __future__ import annotations

from rest_framework import serializers


class ReportQuerySerializer(serializers.Serializer):
    """Valida el rango de fechas del reporte."""

    date_from = serializers.DateTimeField(required=True)
    date_to = serializers.DateTimeField(required=True)

    def validate(self, attrs: dict) -> dict:
        if attrs["date_from"] > attrs["date_to"]:
            raise serializers.ValidationError(
                {"date_from": "'date_from' no puede ser posterior a 'date_to'."}
            )
        return attrs
