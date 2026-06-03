"""Rutas del dominio de citas y del reporte."""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AppointmentViewSet, DeliveryTimeReportView

router = DefaultRouter()
router.register(r"appointments", AppointmentViewSet, basename="appointment")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "reports/delivery-time/",
        DeliveryTimeReportView.as_view(),
        name="delivery-time-report",
    ),
]
