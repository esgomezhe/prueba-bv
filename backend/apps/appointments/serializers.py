"""Capa de presentación: serialización y validación de entrada/salida."""
from __future__ import annotations

from rest_framework import serializers

from .models import Appointment, AppointmentStatus
from .services import AppointmentService


class AppointmentSerializer(serializers.ModelSerializer):
    """Serializa citas y aplica validaciones de negocio en la entrada."""

    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True
    )

    class Meta:
        model = Appointment
        fields = [
            "id",
            "scheduled_at",
            "supplier",
            "product_line",
            "status",
            "delivered_at",
            "observations",
            "created_by",
            "created_by_username",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def validate(self, attrs: dict) -> dict:
        """Valida reglas que dependen de varios campos a la vez."""
        instance = self.instance

        # Estado objetivo (en update puede no venir en el payload).
        new_status = attrs.get(
            "status", instance.status if instance else AppointmentStatus.PROGRAMADA
        )
        delivered_at = attrs.get(
            "delivered_at", instance.delivered_at if instance else None
        )

        # 'Entregada' requiere fecha real de entrega.
        if new_status == AppointmentStatus.ENTREGADA and not delivered_at:
            raise serializers.ValidationError(
                {"delivered_at": "Requerido cuando el estado es 'Entregada'."}
            )

        # Al crear: la fecha programada no puede ser pasada.
        if instance is None and "scheduled_at" in attrs:
            AppointmentService.validate_scheduled_at(attrs["scheduled_at"])

        # Al actualizar el estado: validar la transición permitida.
        if instance is not None and "status" in attrs:
            AppointmentService.validate_transition(
                instance.status, attrs["status"]
            )

        return attrs
