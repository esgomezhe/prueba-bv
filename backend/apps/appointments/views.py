"""Capa de presentación: ViewSet CRUD y endpoint del reporte."""
from __future__ import annotations

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import AppointmentFilter
from .models import Appointment
from .reports import delivery_time_report
from .serializers import AppointmentSerializer
from .services import AppointmentService


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    CRUD de citas de entrega.

    list:   GET    /api/appointments/        filtros + paginación
    create: POST   /api/appointments/
    detail: GET    /api/appointments/{id}/
    update: PATCH  /api/appointments/{id}/
    cancel: POST   /api/appointments/{id}/cancel/
    """

    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = AppointmentFilter
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        # select_related evita el problema N+1 al listar.
        return Appointment.objects.select_related("created_by").all()

    def perform_create(self, serializer) -> None:
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None) -> Response:
        """Cancela la cita (cambio de estado, no borrado)."""
        appointment = self.get_object()
        AppointmentService.cancel(appointment)
        serializer = self.get_serializer(appointment)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DeliveryTimeReportView(APIView):
    """Reporte de tiempo promedio de entrega por sublínea (SQL nativo)."""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                "date_from",
                str,
                required=True,
                description="Inicio del rango (ISO 8601).",
            ),
            OpenApiParameter(
                "date_to",
                str,
                required=True,
                description="Fin del rango (ISO 8601).",
            ),
        ],
        responses={200: dict},
    )
    def get(self, request) -> Response:
        from .serializers_report import ReportQuerySerializer

        query = ReportQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        rows = delivery_time_report(
            query.validated_data["date_from"],
            query.validated_data["date_to"],
        )
        return Response({"results": rows}, status=status.HTTP_200_OK)
