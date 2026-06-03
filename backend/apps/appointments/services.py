"""
Capa de negocio: reglas de las citas de entrega.

Aquí viven las reglas de dominio (no en serializers ni vistas):
- Una cita no puede programarse en el pasado.
- Las transiciones de estado están restringidas.
- 'Entregada' exige fecha real de entrega.

Es código testeable sin HTTP y reutilizable desde comandos o tareas.
"""
from __future__ import annotations

from django.utils import timezone
from rest_framework import status as http_status
from rest_framework.exceptions import APIException

from .models import Appointment, AppointmentStatus

# Transiciones de estado permitidas. Los estados finales no transicionan.
ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    AppointmentStatus.PROGRAMADA: {
        AppointmentStatus.EN_PROCESO,
        AppointmentStatus.CANCELADA,
    },
    AppointmentStatus.EN_PROCESO: {
        AppointmentStatus.ENTREGADA,
        AppointmentStatus.CANCELADA,
    },
    AppointmentStatus.ENTREGADA: set(),
    AppointmentStatus.CANCELADA: set(),
}


class InvalidStateTransition(APIException):
    """Transición de estado no permitida -> 409 Conflict."""

    status_code = http_status.HTTP_409_CONFLICT
    default_detail = "Transición de estado no permitida."
    default_code = "conflict"


class AppointmentService:
    """Operaciones de negocio sobre citas de entrega."""

    @staticmethod
    def validate_scheduled_at(scheduled_at) -> None:
        """La fecha programada no puede estar en el pasado (compara aware)."""
        if scheduled_at and scheduled_at < timezone.now():
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                {"scheduled_at": "La fecha programada no puede estar en el "
                                 "pasado."}
            )

    @staticmethod
    def validate_transition(current: str, new: str) -> None:
        """Valida que el cambio de estado sea permitido."""
        if new == current:
            return
        if new not in ALLOWED_TRANSITIONS[current]:
            raise InvalidStateTransition(
                f"Transición inválida: '{current}' → '{new}'."
            )

    @staticmethod
    def cancel(appointment: Appointment) -> Appointment:
        """Cancela una cita (cambio de estado, nunca borrado físico)."""
        AppointmentService.validate_transition(
            appointment.status, AppointmentStatus.CANCELADA
        )
        appointment.status = AppointmentStatus.CANCELADA
        appointment.save(update_fields=["status", "updated_at"])
        return appointment
