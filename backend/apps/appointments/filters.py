"""Filtros de la lista de citas (fecha, proveedor, sublínea, estado)."""
from __future__ import annotations

from django_filters import rest_framework as filters

from .models import Appointment


class AppointmentFilter(filters.FilterSet):
    """Filtros soportados en GET /api/appointments/."""

    date_from = filters.IsoDateTimeFilter(
        field_name="scheduled_at", lookup_expr="gte"
    )
    date_to = filters.IsoDateTimeFilter(
        field_name="scheduled_at", lookup_expr="lte"
    )

    class Meta:
        model = Appointment
        fields = ["supplier", "product_line", "status", "date_from", "date_to"]
