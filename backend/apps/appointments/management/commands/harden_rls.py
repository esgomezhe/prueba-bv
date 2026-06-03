"""
Endurece la seguridad en Supabase/PostgreSQL habilitando Row Level Security
(RLS) en todas las tablas del esquema `public`.

Contexto: Supabase expone el esquema `public` por su Data API (PostgREST).
Las tablas que Django crea ahí (incluida `auth_user` con los hashes de
contraseñas) quedarían accesibles con la anon key si RLS está deshabilitado.

Al habilitar RLS SIN policies, los roles `anon`/`authenticated` quedan en
deny-all, mientras Django —que conecta como dueño de las tablas— bypassa RLS
y sigue operando con normalidad.

Idempotente y seguro: solo actúa sobre PostgreSQL (se omite en SQLite para no
romper los tests).

Uso:
    python manage.py harden_rls
"""
from __future__ import annotations

from django.core.management.base import BaseCommand
from django.db import connection

_ENABLE_RLS_SQL = """
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;',
                   r.tablename);
  END LOOP;
END $$;
"""


class Command(BaseCommand):
    help = "Habilita RLS (deny-all) en todas las tablas de `public`."

    def handle(self, *args, **options) -> None:
        if connection.vendor != "postgresql":
            self.stdout.write(
                self.style.WARNING(
                    f"Motor '{connection.vendor}' no es PostgreSQL; se omite RLS."
                )
            )
            return

        with connection.cursor() as cursor:
            cursor.execute(_ENABLE_RLS_SQL)
            cursor.execute(
                "SELECT count(*) FROM pg_tables "
                "WHERE schemaname='public' AND rowsecurity = true;"
            )
            count = cursor.fetchone()[0]

        self.stdout.write(
            self.style.SUCCESS(f"RLS habilitado en {count} tablas de 'public'.")
        )
