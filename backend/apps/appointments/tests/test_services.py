"""Pruebas unitarias de la capa de negocio (sin HTTP)."""
from __future__ import annotations

import pytest
from rest_framework.exceptions import ValidationError

from apps.appointments.models import AppointmentStatus
from apps.appointments.services import (
    AppointmentService,
    InvalidStateTransition,
)


def test_transicion_valida_no_lanza():
    AppointmentService.validate_transition(
        AppointmentStatus.PROGRAMADA, AppointmentStatus.EN_PROCESO
    )


def test_transicion_invalida_lanza_conflict():
    with pytest.raises(InvalidStateTransition):
        AppointmentService.validate_transition(
            AppointmentStatus.ENTREGADA, AppointmentStatus.PROGRAMADA
        )


def test_mismo_estado_es_permitido():
    AppointmentService.validate_transition(
        AppointmentStatus.EN_PROCESO, AppointmentStatus.EN_PROCESO
    )


def test_fecha_pasada_lanza_validation_error():
    from datetime import timedelta

    from django.utils import timezone

    with pytest.raises(ValidationError):
        AppointmentService.validate_scheduled_at(
            timezone.now() - timedelta(hours=1)
        )
