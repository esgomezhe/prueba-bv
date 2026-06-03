"""Prueba del endpoint del reporte (SQL nativo)."""
from __future__ import annotations

from datetime import timedelta

import pytest
from django.db import connection
from django.urls import reverse
from django.utils import timezone

from apps.appointments.models import (
    Appointment,
    AppointmentStatus,
    ProductLine,
    Supplier,
)

pytestmark = pytest.mark.django_db

# El reporte usa EXTRACT(EPOCH ...), específico de PostgreSQL.
postgres_only = pytest.mark.skipif(
    connection.vendor != "postgresql",
    reason="El reporte usa SQL nativo de PostgreSQL.",
)


@postgres_only
def test_reporte_devuelve_campos_esperados(auth_client, user):
    base = timezone.now() - timedelta(days=10)
    # Dos entregas de Camisetas: 2h y 4h -> promedio 3h.
    Appointment.objects.create(
        scheduled_at=base, delivered_at=base + timedelta(hours=2),
        supplier=Supplier.A, product_line=ProductLine.CAMISETAS,
        status=AppointmentStatus.ENTREGADA, created_by=user,
    )
    Appointment.objects.create(
        scheduled_at=base, delivered_at=base + timedelta(hours=4),
        supplier=Supplier.B, product_line=ProductLine.CAMISETAS,
        status=AppointmentStatus.ENTREGADA, created_by=user,
    )

    url = reverse("delivery-time-report")
    response = auth_client.get(url, {
        "date_from": (base - timedelta(days=1)).isoformat(),
        "date_to": (base + timedelta(days=1)).isoformat(),
    })

    assert response.status_code == 200
    rows = response.data["results"]
    assert len(rows) == 1
    row = rows[0]
    assert row["product_line"] == ProductLine.CAMISETAS
    assert row["total_deliveries"] == 2
    assert {"avg_hours", "avg_minutes"} <= row.keys()
    assert row["avg_hours"] == pytest.approx(3.0, abs=0.01)


@postgres_only
def test_reporte_solo_cuenta_entregadas(auth_client, user):
    base = timezone.now() - timedelta(days=5)
    Appointment.objects.create(
        scheduled_at=base, supplier=Supplier.A,
        product_line=ProductLine.ZAPATOS,
        status=AppointmentStatus.PROGRAMADA, created_by=user,
    )
    url = reverse("delivery-time-report")
    response = auth_client.get(url, {
        "date_from": (base - timedelta(days=1)).isoformat(),
        "date_to": (base + timedelta(days=1)).isoformat(),
    })
    assert response.status_code == 200
    assert response.data["results"] == []
