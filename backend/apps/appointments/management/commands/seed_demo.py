"""
Comando de seeding: puebla la base con datos de ejemplo.

Crea 3 usuarios y 20 citas distribuidas entre estados y proveedores, con
varias citas 'Entregada' con delivered_at realista para que el reporte tenga
datos. Idempotente: no duplica si se ejecuta más de una vez.

Credenciales (documentadas también en el README):
    admin / admin12345
    operador1 / operador12345
    operador2 / operador12345
"""
from __future__ import annotations

import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.appointments.models import (
    Appointment,
    AppointmentStatus,
    ProductLine,
    Supplier,
)

User = get_user_model()

DEMO_USERS = [
    {"username": "admin", "password": "admin12345", "is_staff": True,
     "is_superuser": True, "email": "admin@demo.local"},
    {"username": "operador1", "password": "operador12345",
     "email": "operador1@demo.local"},
    {"username": "operador2", "password": "operador12345",
     "email": "operador2@demo.local"},
]


class Command(BaseCommand):
    help = "Puebla la base de datos con 3 usuarios y 20 citas de ejemplo."

    @transaction.atomic
    def handle(self, *args, **options) -> None:
        users = self._create_users()

        if Appointment.objects.exists():
            self.stdout.write(
                self.style.WARNING("Ya existen citas; no se vuelven a crear.")
            )
            return

        self._create_appointments(users)
        self.stdout.write(
            self.style.SUCCESS("Seed completado: 3 usuarios y 20 citas.")
        )

    def _create_users(self) -> list:
        users = []
        for data in DEMO_USERS:
            password = data.pop("password")
            user, created = User.objects.get_or_create(
                username=data["username"], defaults=data
            )
            if created:
                user.set_password(password)
                user.save()
            data["password"] = password  # restaura para idempotencia
            users.append(user)
        return users

    def _create_appointments(self, users: list) -> None:
        now = timezone.now()
        suppliers = [Supplier.A, Supplier.B, Supplier.C]
        lines = list(ProductLine.values)

        # 10 citas 'Entregada' (pasadas, con delivered_at) para el reporte.
        for i in range(10):
            scheduled = now - timedelta(days=random.randint(5, 40),
                                        hours=random.randint(0, 12))
            delivered = scheduled + timedelta(hours=random.randint(2, 72))
            Appointment.objects.create(
                scheduled_at=scheduled,
                supplier=random.choice(suppliers),
                product_line=lines[i % len(lines)],
                status=AppointmentStatus.ENTREGADA,
                delivered_at=delivered,
                observations="Entrega completada.",
                created_by=random.choice(users),
            )

        # 4 'Programada' (futuras), 3 'En proceso', 3 'Cancelada'.
        future_states = (
            [AppointmentStatus.PROGRAMADA] * 4
            + [AppointmentStatus.EN_PROCESO] * 3
            + [AppointmentStatus.CANCELADA] * 3
        )
        for i, state in enumerate(future_states):
            scheduled = now + timedelta(days=random.randint(1, 30),
                                        hours=random.randint(0, 12))
            Appointment.objects.create(
                scheduled_at=scheduled,
                supplier=random.choice(suppliers),
                product_line=lines[i % len(lines)],
                status=state,
                created_by=random.choice(users),
            )
