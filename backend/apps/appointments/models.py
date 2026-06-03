"""Modelo de dominio: Cita de Entrega (capa de datos)."""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class Supplier(models.TextChoices):
    A = "A", "Proveedor A"
    B = "B", "Proveedor B"
    C = "C", "Proveedor C"


class ProductLine(models.TextChoices):
    CAMISETAS = "Camisetas", "Camisetas"
    PANTALONES = "Pantalones", "Pantalones"
    ZAPATOS = "Zapatos", "Zapatos"
    ACCESORIOS = "Accesorios", "Accesorios"


class AppointmentStatus(models.TextChoices):
    PROGRAMADA = "Programada", "Programada"
    EN_PROCESO = "En proceso", "En proceso"
    ENTREGADA = "Entregada", "Entregada"
    CANCELADA = "Cancelada", "Cancelada"


class Appointment(models.Model):
    """Una cita de entrega de mercancía de un proveedor."""

    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False
    )
    scheduled_at = models.DateTimeField(
        help_text="Fecha y hora programada de entrega (aware datetime)."
    )
    supplier = models.CharField(max_length=1, choices=Supplier.choices)
    product_line = models.CharField(
        max_length=20, choices=ProductLine.choices
    )
    status = models.CharField(
        max_length=15,
        choices=AppointmentStatus.choices,
        default=AppointmentStatus.PROGRAMADA,
    )
    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha y hora real de entrega; requerida si 'Entregada'.",
    )
    observations = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="appointments",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "appointments"
        ordering = ["-scheduled_at"]
        indexes = [
            models.Index(fields=["scheduled_at"], name="idx_appt_sched"),
            models.Index(fields=["supplier"], name="idx_appt_supplier"),
            models.Index(fields=["product_line"], name="idx_appt_prodline"),
            models.Index(fields=["status"], name="idx_appt_status"),
            models.Index(
                fields=["status", "product_line"], name="idx_appt_status_pl"
            ),
        ]
        constraints = [
            # La fecha real de entrega solo puede existir si el estado es
            # 'Entregada'. Última línea de defensa a nivel de base de datos.
            models.CheckConstraint(
                condition=models.Q(delivered_at__isnull=True)
                | models.Q(status="Entregada"),
                name="delivered_at_only_when_entregada",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.supplier} · {self.product_line} · {self.status}"
