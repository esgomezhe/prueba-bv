"""
Reporte de tiempo promedio de entrega — implementado con SQL NATIVO.

Calcula, por sublínea de producto, el tiempo promedio entre la fecha
programada y la fecha real de entrega, considerando solo citas 'Entregada'
dentro de un rango de fechas.

La consulta es parametrizada (sin interpolación de strings) para prevenir
inyección SQL.
"""
from __future__ import annotations

from datetime import datetime

from django.db import connection

_REPORT_SQL = """
    SELECT
        product_line,
        COUNT(*) AS total_deliveries,
        AVG(EXTRACT(EPOCH FROM (delivered_at - scheduled_at)) / 3600)
            AS avg_hours,
        AVG(EXTRACT(EPOCH FROM (delivered_at - scheduled_at)) / 60)
            AS avg_minutes
    FROM appointments
    WHERE status = 'Entregada'
      AND delivered_at IS NOT NULL
      AND scheduled_at BETWEEN %(date_from)s AND %(date_to)s
    GROUP BY product_line
    ORDER BY product_line;
"""


def delivery_time_report(
    date_from: datetime, date_to: datetime
) -> list[dict]:
    """Ejecuta el reporte y devuelve filas como diccionarios."""
    with connection.cursor() as cursor:
        cursor.execute(
            _REPORT_SQL, {"date_from": date_from, "date_to": date_to}
        )
        columns = [col[0] for col in cursor.description]
        rows = cursor.fetchall()

    result: list[dict] = []
    for row in rows:
        record = dict(zip(columns, row))
        # Redondea para presentación; los promedios pueden venir como Decimal.
        record["avg_hours"] = round(float(record["avg_hours"]), 2)
        record["avg_minutes"] = round(float(record["avg_minutes"]), 2)
        record["total_deliveries"] = int(record["total_deliveries"])
        result.append(record)
    return result
