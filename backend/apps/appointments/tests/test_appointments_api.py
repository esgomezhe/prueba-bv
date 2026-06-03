"""Pruebas de la API de citas (casos límite del enunciado)."""
from __future__ import annotations

from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.appointments.models import (
    Appointment,
    AppointmentStatus,
    ProductLine,
    Supplier,
)

pytestmark = pytest.mark.django_db


def _payload(**overrides) -> dict:
    data = {
        "scheduled_at": (timezone.now() + timedelta(days=2)).isoformat(),
        "supplier": Supplier.A,
        "product_line": ProductLine.CAMISETAS,
        "status": AppointmentStatus.PROGRAMADA,
    }
    data.update(overrides)
    return data


def test_endpoint_protegido_sin_token_devuelve_401(api_client):
    url = reverse("appointment-list")
    response = api_client.get(url)
    assert response.status_code == 401
    assert response.data["error"]["code"] == "not_authenticated"


def test_crear_cita_exitosa(auth_client):
    url = reverse("appointment-list")
    response = auth_client.post(url, _payload(), format="json")
    assert response.status_code == 201
    assert Appointment.objects.count() == 1


def test_no_se_crea_cita_con_fecha_pasada(auth_client):
    url = reverse("appointment-list")
    past = (timezone.now() - timedelta(days=1)).isoformat()
    response = auth_client.post(url, _payload(scheduled_at=past), format="json")
    assert response.status_code == 400
    assert "scheduled_at" in response.data["error"]["details"]


def test_entregada_requiere_delivered_at(auth_client, user):
    appt = Appointment.objects.create(
        scheduled_at=timezone.now() + timedelta(days=1),
        supplier=Supplier.A,
        product_line=ProductLine.ZAPATOS,
        status=AppointmentStatus.EN_PROCESO,
        created_by=user,
    )
    url = reverse("appointment-detail", args=[appt.id])
    response = auth_client.patch(
        url, {"status": AppointmentStatus.ENTREGADA}, format="json"
    )
    assert response.status_code == 400
    assert "delivered_at" in response.data["error"]["details"]


def test_transicion_entregada_a_programada_prohibida(auth_client, user):
    appt = Appointment.objects.create(
        scheduled_at=timezone.now() - timedelta(days=1),
        supplier=Supplier.B,
        product_line=ProductLine.PANTALONES,
        status=AppointmentStatus.ENTREGADA,
        delivered_at=timezone.now(),
        created_by=user,
    )
    url = reverse("appointment-detail", args=[appt.id])
    response = auth_client.patch(
        url, {"status": AppointmentStatus.PROGRAMADA}, format="json"
    )
    assert response.status_code == 409
    assert response.data["error"]["code"] == "conflict"


def test_cancelar_cambia_estado_sin_borrar(auth_client, user):
    appt = Appointment.objects.create(
        scheduled_at=timezone.now() + timedelta(days=1),
        supplier=Supplier.C,
        product_line=ProductLine.ACCESORIOS,
        status=AppointmentStatus.PROGRAMADA,
        created_by=user,
    )
    url = reverse("appointment-cancel", args=[appt.id])
    response = auth_client.post(url)
    assert response.status_code == 200
    appt.refresh_from_db()
    assert appt.status == AppointmentStatus.CANCELADA
    assert Appointment.objects.filter(id=appt.id).exists()  # no borrado físico


def test_filtro_por_estado(auth_client, user):
    Appointment.objects.create(
        scheduled_at=timezone.now() + timedelta(days=1),
        supplier=Supplier.A, product_line=ProductLine.CAMISETAS,
        status=AppointmentStatus.PROGRAMADA, created_by=user,
    )
    Appointment.objects.create(
        scheduled_at=timezone.now() + timedelta(days=2),
        supplier=Supplier.B, product_line=ProductLine.ZAPATOS,
        status=AppointmentStatus.CANCELADA, created_by=user,
    )
    url = reverse("appointment-list")
    response = auth_client.get(url, {"status": AppointmentStatus.CANCELADA})
    assert response.status_code == 200
    assert response.data["count"] == 1
