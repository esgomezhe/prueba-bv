# Sistema de Gestión de Citas de Entrega

Aplicación fullstack para gestionar citas de entrega de mercancía en una empresa
de retail textil: **backend** (Django REST Framework), **base de datos**
(Supabase/PostgreSQL) y **frontend** (Next.js).

> Estado actual: **Backend** ✅ · **Base de datos** ✅ · **Frontend** ✅ · **Docker Compose** ✅ · CI/CD ⏳

## Inicio rápido (Docker) — un solo comando

```bash
docker compose up --build
```

Levanta **base de datos (PostgreSQL) + backend + frontend**, aplica migraciones
y siembra datos de ejemplo automáticamente. Luego:

- Frontend: <http://localhost:3000> (entra con `admin` / `admin12345`)
- API / Swagger: <http://localhost:8000/api/docs/>

> **Si el puerto 8000 o 3000 está ocupado**, cámbialos sin editar archivos:
> `BACKEND_PORT=8001 FRONTEND_PORT=3001 docker compose up --build`.
>
> El stack es **auto-contenido**: usa un PostgreSQL local en contenedor (sin
> secretos). Para usar **Supabase** en su lugar, ver §10.4.

---

## 1. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Django 5.2 + Django REST Framework 3.17 |
| Autenticación | JWT (`djangorestframework-simplejwt`) con blacklist |
| Base de datos | **Supabase** (PostgreSQL 17) — ORM para modelos, **SQL nativo** para el reporte |
| Documentación API | OpenAPI 3 / Swagger (`drf-spectacular`) |
| Frontend | **Next.js 16** (App Router) + React 19 + **Tailwind CSS v4** + TypeScript |
| Frontend data/UI | SWR · Axios (vía proxy BFF) · Recharts (gráfico) · Zod (validación) |
| Calidad | Flake8 + pytest (backend) · ESLint + Vitest (frontend) |

---

## 2. Arquitectura

El backend separa responsabilidades en **tres capas** (criterio de mayor peso
en la evaluación):

```
┌──────────────────────────────────────────────────────────┐
│  PRESENTACIÓN  (HTTP / DRF)                                │
│  Views / ViewSets · Serializers · Routers · Permissions   │
│  Traduce HTTP <-> Python. Sin reglas de negocio.          │
└───────────────────────┬──────────────────────────────────┘
                        │ llama a
┌───────────────────────┴──────────────────────────────────┐
│  NEGOCIO  (services.py)                                    │
│  Validación de transiciones de estado, fecha no pasada,   │
│  reglas de cancelación. Testeable sin HTTP.               │
└───────────────────────┬──────────────────────────────────┘
                        │ usa
┌───────────────────────┴──────────────────────────────────┐
│  DATOS  (models.py + reports.py)                          │
│  Django ORM para CRUD · SQL nativo para el reporte.       │
└──────────────────────────────────────────────────────────┘
```

**Estructura por dominio** (feature-based) para escalar agregando carpetas
autocontenidas sin tocar las existentes:

```
backend/
├── config/                 # proyecto: settings (base/dev/prod), urls, wsgi
├── apps/
│   ├── core/               # manejo de errores centralizado
│   ├── accounts/           # autenticación (login/logout/refresh)
│   └── appointments/       # dominio de citas
│       ├── models.py       # capa datos
│       ├── serializers.py  # capa presentación
│       ├── services.py     # capa negocio
│       ├── reports.py      # SQL nativo del reporte
│       ├── views.py        # ViewSet + reporte
│       ├── filters.py      # filtros de la lista
│       ├── management/commands/seed_demo.py
│       └── tests/          # 13 pruebas
├── requirements.txt        # runtime
├── requirements-dev.txt    # test + lint
├── setup.cfg               # config Flake8
└── pytest.ini
```

---

## 3. Modelo de Datos (Diagrama Entidad-Relación)

```
┌─────────────────────┐         ┌──────────────────────────────────────┐
│        User          │  1   N  │            Appointment                │
├─────────────────────┤◄────────┤──────────────────────────────────────┤
│ id          PK       │  PROTECT│ id            UUID  PK                │
│ username    UNIQUE   │         │ scheduled_at  timestamptz  NOT NULL   │
│ password    (hash)   │         │ supplier      char(1)  A|B|C          │
│ email                │         │ product_line  varchar  (4 sublíneas)  │
└─────────────────────┘         │ status        varchar  (4 estados)    │
                                 │ delivered_at  timestamptz  NULL       │
                                 │ observations  text  NULL              │
                                 │ created_by    FK -> User              │
                                 │ created_at / updated_at  (auto)       │
                                 └──────────────────────────────────────┘
  Índices: scheduled_at, supplier, product_line, status, (status+product_line)
  CHECK: delivered_at solo puede existir cuando status = 'Entregada'
```

**Estados:** `Programada → En proceso → Entregada` · cualquiera → `Cancelada`
(transiciones validadas; `Entregada` y `Cancelada` son finales).

---

## 4. Instalación y Ejecución

> Requisitos: Python 3.12+ y una base de datos PostgreSQL. Este proyecto usa
> **Supabase** como Postgres gestionado.

### 4.1 Configurar la base de datos (Supabase)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Obtén el connection string del **Session Pooler** (botón *Connect* →
   *Session pooler*, puerto **5432**). Forma:
   ```
   postgres://postgres.<ref>:<DB-PASSWORD>@aws-1-<region>.pooler.supabase.com:5432/postgres
   ```
   > El password de la BD se obtiene/resetea en **Database → Settings →
   > Reset database password** (no es el password de tu cuenta Supabase).

### 4.2 Variables de entorno

Copia `.env.example` a `.env` en la raíz y completa `DATABASE_URL` con tu
connection string. Si el password tiene caracteres especiales, URL-encódealos
(ej. `!` → `%21`).

```bash
cp .env.example .env   # luego edita DATABASE_URL
```

### 4.3 Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt

python manage.py migrate        # Django monta el esquema en Supabase
python manage.py seed_demo      # 3 usuarios + 20 citas
python manage.py harden_rls     # habilita RLS (deny-all) en public — ver §8
python manage.py runserver
```

API en `http://localhost:8000/api/` · Swagger en `http://localhost:8000/api/docs/`.

> Para correr los tests de forma local sin depender de Supabase, puedes usar
> SQLite: `USE_SQLITE=True pytest` (las 2 pruebas del reporte se omiten porque
> usan SQL nativo de PostgreSQL).

---

## 5. Documentación de la API

| Método | Ruta | Descripción | Auth |
|---|---|---|:---:|
| `POST` | `/api/auth/login/` | Login → `{access, refresh, user}` | — |
| `POST` | `/api/auth/refresh/` | Renueva el access token | — |
| `POST` | `/api/auth/logout/` | Invalida el refresh (blacklist) | ✅ |
| `GET` | `/api/appointments/` | Lista (filtros + paginación) | ✅ |
| `POST` | `/api/appointments/` | Crea una cita | ✅ |
| `GET` | `/api/appointments/{id}/` | Detalle | ✅ |
| `PATCH` | `/api/appointments/{id}/` | Actualiza | ✅ |
| `POST` | `/api/appointments/{id}/cancel/` | Cancela (cambio de estado) | ✅ |
| `GET` | `/api/reports/delivery-time/` | Reporte SQL nativo | ✅ |
| `GET` | `/api/docs/` | Swagger UI interactivo | — |
| `GET` | `/api/schema/` | Esquema OpenAPI 3 | — |

**Filtros de la lista:** `supplier`, `product_line`, `status`, `date_from`,
`date_to`.
**Parámetros del reporte:** `date_from`, `date_to` (ISO 8601, requeridos).

Toda respuesta de error sigue un contrato único:
```json
{ "error": { "code": "validation_error", "message": "...", "details": {} } }
```

---

## 6. Credenciales de Prueba

Creadas por `python manage.py seed_demo`:

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `admin12345` | superusuario |
| `operador1` | `operador12345` | operador |
| `operador2` | `operador12345` | operador |

El seeder genera **20 citas** distribuidas entre los 4 estados y 3 proveedores
(10 `Entregada` con `delivered_at` para alimentar el reporte).

---

## 7. Pruebas

```bash
cd backend
source venv/bin/activate
export DATABASE_URL="postgres://app_user:changeme@localhost:5432/citas_entrega"
pytest          # 13 pruebas
flake8 .        # lint (sin problemas)
```

Cobertura de casos límite (los que pide el enunciado):
- Cita no se crea con fecha en el pasado → `400`.
- `Entregada` requiere `delivered_at` → `400`.
- Transición `Entregada → Programada` prohibida → `409`.
- Endpoint protegido sin token → `401`.
- Reporte devuelve los campos esperados con datos de prueba.

> El reporte usa `EXTRACT(EPOCH ...)`, específico de PostgreSQL. Las dos pruebas
> del reporte se omiten automáticamente si la BD de test no es PostgreSQL.

---

## 8. Decisiones Técnicas

- **JWT sobre sesiones:** el frontend (Next.js) vive en otro origen; JWT evita la
  complejidad de cookies cross-site/CSRF y mantiene la API *stateless*. El access
  token se devuelve en el body; el almacenamiento seguro en cookie `httpOnly` lo
  hará un *route handler* de Next (fase frontend) → protege contra XSS.
- **Capa de servicios:** las reglas de negocio NO viven en serializers ni vistas;
  son testeables sin HTTP y reutilizables.
- **SQL nativo parametrizado** para el reporte: cumple el requisito y previene
  inyección SQL (sin interpolación de strings).
- **UUID como PK:** evita enumeración secuencial de recursos.
- **`CHECK` constraint + validación en app:** doble capa de integridad.
- **`USE_TZ=True`:** almacenamiento en UTC, comparaciones con *aware datetimes*
  (evita el bug naive vs aware).
- **`ON DELETE PROTECT`** en `created_by`: no se borran usuarios con citas
  (preserva la auditoría).
- **Cancelar = cambio de estado**, nunca borrado físico.
- **RLS en Supabase (deny-all):** Supabase expone el esquema `public` por su
  Data API. Para que las tablas de Django (incl. `auth_user` con hashes) no
  sean accesibles con la anon key, se habilita Row Level Security en todas las
  tablas de `public` (`python manage.py harden_rls`). Sin policies = deny-all
  para `anon`/`authenticated`; Django conecta como dueño y bypassa RLS. El
  frontend NO usa la Data API de Supabase: habla solo con el backend Django.
- **Conexión vía Session Pooler (puerto 5432):** IPv4 + soporte de prepared
  statements, ideal para Django con `psycopg3`. La conexión directa de Supabase
  es IPv6-only; el Transaction Pooler (6543) no soporta prepared statements.

---

## 9. Supuestos

- Cualquier usuario autenticado puede gestionar cualquier cita (no se pidió
  control de acceso por roles/propietario; `created_by` queda como auditoría).
- "Tiempo promedio de entrega" = diferencia entre `scheduled_at` y `delivered_at`
  de las citas `Entregada`.
- El proyecto se desarrolla con Python 3.14 local, pero se fija 3.12 como
  versión objetivo para Docker (LTS estable de Django 5.2).

---

## 10. Frontend (Next.js)

Mobile-first, TypeScript estricto, con las 5 pantallas requeridas: **Login,
Dashboard, Lista de Citas, Crear/Editar y Reporte** (con gráfico de barras).

### 10.1 Arquitectura — patrón BFF (Backend-for-Frontend)

La decisión de seguridad central: el **access/refresh JWT vive en cookies
`httpOnly`** que el navegador nunca puede leer (inmune a XSS). El cliente solo
habla con Next.js; Next.js (server-side) adjunta el `Bearer` a Django.

```
Navegador  ──(cookie httpOnly, mismo origen)──►  Next.js
  axios → /api/django/*                            ├─ route handlers: /api/auth/login|logout
  (nunca ve el token)                              ├─ proxy: /api/django/[...path]  ─Bearer─► Django
                                                   │     · refresh transparente ante 401
                                                   └─ proxy.ts (guard de rutas en el edge)
```

- `src/app/api/auth/login` y `logout`: route handlers que setean/limpian las
  cookies httpOnly.
- `src/app/api/django/[...path]`: proxy que inyecta el `Bearer` server-side y
  refresca el token de forma transparente.
- `src/proxy.ts`: guard de rutas (Next 16 renombró `middleware` → `proxy`).

> Estructura: `components/` (UI atómica) · `features/` (api+types+schema por
> dominio) · `lib/` (http, cookies, hooks). Separa lo presentacional de lo
> funcional.

### 10.2 Variables de entorno del frontend

| Variable | Descripción |
|---|---|
| `DJANGO_API_URL` | URL de la API de Django, **solo servidor** (sin `NEXT_PUBLIC`). Local: `http://localhost:8000/api`. Docker: `http://backend:8000/api`. |

### 10.3 Ejecución

```bash
cd frontend
npm install
# Define DJANGO_API_URL si Django no está en localhost:8000
DJANGO_API_URL=http://localhost:8000/api npm run dev   # desarrollo
# o producción:
npm run build && npm run start

npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest (11 pruebas)
```

App en `http://localhost:3000`. Inicia sesión con las credenciales de la
sección 6.

> **Nota de puertos:** si el puerto 8000 está ocupado por otra app, levanta
> Django en otro puerto y ajusta `DJANGO_API_URL` en consecuencia.

---

### 10.4 Docker con Supabase (en vez del Postgres local)

El `docker-compose.yml` usa un PostgreSQL local por defecto para que **cualquiera
pueda levantar el stack sin secretos**. Para apuntar el backend a Supabase,
crea un `docker-compose.override.yml`:

```yaml
services:
  backend:
    environment:
      DATABASE_URL: postgres://postgres.<ref>:<PASSWORD>@aws-1-<region>.pooler.supabase.com:5432/postgres
    depends_on: !reset []   # ya no depende del Postgres local
  db:
    profiles: ["donotstart"]  # no levantar el contenedor de BD
```

Y recuerda ejecutar `python manage.py harden_rls` una vez sobre Supabase (ver §8).

---

## 11. Docker — Arquitectura del stack

```
                 docker compose up --build
       ┌──────────────┬───────────────────┬──────────────┐
       ▼              ▼                   ▼
┌────────────┐  ┌──────────────┐   ┌──────────────────┐
│ db          │  │ backend       │   │ frontend         │
│ postgres:16 │◄─│ Django+gunicorn│  │ Next.js standalone│
│ (volumen)   │  │ migra+siembra │   │ proxy BFF -> Django│
│ healthcheck │  │ :8000         │◄──│ http://backend:8000│
└────────────┘  └──────────────┘   │ :3000 (navegador) │
   backend espera a db "healthy"     └──────────────────┘
```

- El **navegador** solo habla con el frontend (`:3000`). El JWT viaja en cookies
  httpOnly; el proxy server-side de Next adjunta el `Bearer` a Django por la red
  interna (`http://backend:8000`). Django no se expone al navegador.
- Imágenes: backend en `python:3.12-slim`; frontend multi-stage con
  `output: "standalone"` (imagen mínima, usuario sin privilegios).

---

## 12. Próximos pasos

- [ ] CI/CD GitHub Actions (lint backend Flake8 + lint frontend ESLint) — BONUS.
