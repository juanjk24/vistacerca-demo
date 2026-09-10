# 👁️ VistaCerca — Ruta visual

**Prototipo académico** de arquitectura distribuida (microservicios) para orientar a personas hacia una
valoración visual. Captura síntomas, emite una clasificación **orientativa** (🟢 VERDE / 🟡 AMARILLO /
🔴 ROJO), muestra aliados cercanos, permite agendar citas y despliega métricas en tiempo real.

> ⚠️ **AVISO IMPORTANTE:** Este es un prototipo didáctico. Las reglas de clasificación son **simuladas**
> y **no constituyen diagnóstico médico**. Usa datos de ejemplo y credenciales de desarrollo.

---

## 🧱 Arquitectura

Sigue el patrón de **microservicios con API Gateway** y **eventos asíncronos**:

```
                    ┌────────────────────────────────────────────┐
                    │                    Frontend                │
                    │            React 19 + Vite 8 (SPA)         │
                    └─────────────────────┬──────────────────────┘
                                          │ HTTP (axios/fetch)
                                          ▼
                    ┌────────────────────────────────────────────┐
                    │                 API Gateway               │
                    │         Express 5 · patrón Proxy (3000)    │
                    └───┬──────────┬───────────┬──────────┬──────┘
                        │          │           │          │
                        ▼          ▼           ▼          ▼
                  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐
                  │  user-   │ │assessment│ │ partner  │ │appointment │
                  │ service  │ │service   │ │ service  │ │ service    │
                  │  (3001)  │ │ (3002)   │ │  (3003)  │ │  (3004)    │
                  └──────────┘ └──────────┘ └──────────┘ └────────────┘
                        │           │                        │
                        │           │ publican eventos       │ publica eventos
                        │           ▼                        ▼
                        │    ┌──────────────────────────────────┐
                        │    │   RabbitMQ · exchange topic       │
                        │    │      vistacerca.events            │
                        │    └───────┬──────────────────┬────────┘
                        │            │                  │
                        │            ▼                  ▼
                        │   ┌────────────────┐  ┌──────────────────┐
                        │   │ notification-  │  │  analytics-      │
                        │   │ worker         │  │  worker          │
                        │   │ (simula avisos)│  │ (contadores)     │
                        │   └────────────────┘  └─────────┬────────┘
                        │                                 ▼
                        ▼                    ┌──────────────────────┐
                 ┌─────────────┐             │      PostgreSQL 16   │
                 │  PostgreSQL │◄────────────│      (BD compartida) │
                 └─────────────┘             └──────────────────────┘
```

### Componentes

| Componente | Puerto | Rol |
|---|---|---|
| `frontend/` | 5173 | SPA React (Vite). Interfaz de la ruta visual. |
| `api-gateway/` | 3000 | Punto único de entrada. Reenvía peticiones a los servicios (patrón Proxy) y agrega el `/health`. |
| `user-service/` | 3001 | Registro y consulta de usuarios. |
| `assessment-service/` | 3002 | Clasifica síntomas (reglas simuladas), guarda la evaluación y publica `assessment.completed`. Expone `/metrics` leyendo la tabla `analytics`. |
| `partner-service/` | 3003 | Catálogo de aliados (clínicas/ópticas), filtrable por ciudad. |
| `appointment-service/` | 3004 | Creación, consulta y cambio de estado de citas. Publica `appointment.created` / `appointment.updated`. |
| `analytics-worker/` | — | Consume eventos y acumula contadores agregados en la tabla `analytics`. |
| `notification-worker/` | — | Consume eventos y **simula** el envío de notificaciones (solo log). |
| `postgres` | 5432 | Persistencia compartida. Esquema + datos semilla en `database/init.sql`. |
| `rabbitmq` | 5672 / 15672 | Broker de mensajes (exchange topic `vistacerca.events`). Management UI en `http://localhost:15672`. |

### Flujo de trabajo (end-to-end)

1. El usuario se registra (`user-service`).
2. Responde una **evaluación** en el frontend → `assessment-service` aplica las reglas simuladas de
   `src/rules/classification.ts` (score ≥ 5 → RED, ≥ 2 → YELLOW, resto → GREEN) y guarda el resultado.
3. `assessment-service` publica `assessment.completed`.
4. Ambos workers reaccionan:
   - `notification-worker` imprime una notificación simulada.
   - `analytics-worker` incrementa `assessments.<RESULTADO>` en PostgreSQL.
5. El usuario elige un **aliado** (`partner-service`) y agenda una **cita** (`appointment-service`),
   que publica `appointment.created` (reaccionan de nuevo los workers).
6. El panel del aliado permite cambiar el estado de la cita (`PATCH .../status`); cada cambio publica
   `appointment.updated` y actualiza `appointments.<ESTADO>`.

### Decisión de clasificación (simulada)

En `assessment-service/src/rules/classification.ts`:

```
blurVision (+2) · eyeBurning (+1) · persistentSymptoms (+2) · highScreenTime (+1)
score >= 5  → RED
score >= 2  → YELLOW
score >= 1  → GREEN (… en realidad >= 0)
```

No representa criterios médicos reales.

---

## 🚀 Cómo arrancar todo

Requisitos: **Docker + Docker Compose** (las imágenes de Node 24, PostgreSQL 16 y RabbitMQ se descargan solas).

```bash
# 1) Levanta TODA la plataforma (frontend, gateway, 4 servicios, 2 workers, BD y broker)
docker compose up --build

# 2) Abre la app
#    Frontend → http://localhost:5173
#    Gateway  → http://localhost:3000/api
#    RabbitMQ → http://localhost:15672  (usuario/contraseña: guest/guest)

# 3) Para detener todo
docker compose down

# (opcional) también elimina el volumen de datos de PostgreSQL
docker compose down -v
```

> Los servicios esperan a PostgreSQL y RabbitMQ (con reintentos), así que no importa si tardan un poco.

### Datos semilla

El esquema (`database/init.sql`) se carga automáticamente al primer arranque de PostgreSQL e incluye:

- 4 aliados en Mocoa / Villagarzón (Putumayo, Colombia).
- 1 usuario demo: **Juan Cuellar, 27 años, Mocoa**.

---

## 🧪 Cómo probarlo

### Ruta rápida desde el navegador

1. En **Inicio**, escribe tu nombre (o usa el demo) y pulsa **Comenzar evaluación**.
2. Marca síntomas (ej.: *Visión borrosa* + *Síntomas persistentes* → YELLOW; añade *Ardor* + *Pantallas* → RED) y **Continuar**.
3. Revisa el **resultado orientativo** y pulsa **Ver aliados**.
4. Elige un aliado y **Solicitar cita**.
5. En **Mis citas** verás la cita como *Pendiente*; en **Panel aliado** cámbiala a *Confirmada*, *Atendida*, etc.
6. Cada acción se refleja en **Métricas** (contadores en tiempo real, actualizan cada 3 s).
7. Consulta **Estado** para ver el health de cada servicio; apaga un contenedor (`docker compose stop user-service`) y observa cómo baja.

### Flujo asíncrono (RabbitMQ)

En las terminales de los workers verás la evidencia de los eventos:

```
[notification-1] procesando assessment.completed...
[notification-1] [NOTIFICATION] Evaluación 1 del usuario 1: resultado YELLOW. Te contactaremos...
[analytics-1][ANALYTICS] cuenta acumulada en memoria:
   assessments.YELLOW: 1
```

También puedes inspeccionar en la UI de RabbitMQ (`http://localhost:15672`): en la pestaña
**Exchanges → vistacerca.events** verás los mensajes publicados y las colas `analytics.queue` /
`notification.queue` con sus bindings (pestaña **Queues**).

### Probar los endpoints con curl

```bash
# Crear usuario
curl -s -X POST http://localhost:3000/api/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ana Torres","age":31,"city":"Mocoa"}'

# Crear evaluación (visión borrosa + síntomas persistentes → YELLOW)
curl -s -X POST http://localhost:3000/api/assessments \
  -H 'Content-Type: application/json' \
  -d '{"userId":1,"blurVision":true,"persistentSymptoms":true}'

# Listar aliados (filtro por ciudad)
curl -s "http://localhost:3000/api/partners?city=Mocoa"

# Crear cita
curl -s -X POST http://localhost:3000/api/appointments \
  -H 'Content-Type: application/json' \
  -d '{"userId":1,"partnerId":1,"date":"2026-09-15"}'

# Cambiar estado de la cita
curl -s -X PATCH http://localhost:3000/api/appointments/1/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"CONFIRMED"}'

# Métricas agregadas (las escribe analytics-worker)
curl -s http://localhost:3000/api/metrics

# Health de todos los servicios vía gateway
curl -s http://localhost:3000/health
```

---

## 🖥️ Ejecución local (sin Docker)

Cada servicio es **Node 24 + TypeScript ESM** que se ejecuta directamente con `node` (no requiere build).
Necesitas PostgreSQL y RabbitMQ corriendo de forma local.

```bash
# 1) PostgreSQL y RabbitMQ — o levanta solo la infraestructura:
docker compose up -d postgres rabbitmq

# 2) Dependencias e inicio de cada componente (en terminales separadas):
(cd api-gateway        && npm install && npm start)   # http://localhost:3000
(cd user-service       && npm install && npm start)   # 3001
(cd assessment-service && npm install && npm start)   # 3002
(cd partner-service    && npm install && npm start)   # 3003
(cd appointment-service && npm install && npm start)  # 3004
(cd analytics-worker   && npm install && npm start)   # workers sin puerto
(cd notification-worker && npm install && npm start)
(cd frontend           && npm install && npm run dev) # http://localhost:5173
```

Escenarios alternativos:
- **Variables de entorno** (opcionales, con valores por defecto para localhost): `PORT`,
  `DATABASE_URL`, `AMQP_URL`, `USER_SERVICE_URL`, `ASSESSMENT_SERVICE_URL`,
  `PARTNER_SERVICE_URL`, `APPOINTMENT_SERVICE_URL`, `WORKER_ID`, `VITE_API_URL`.
- **Typecheck:** `npm run typecheck` dentro de cualquier servicio backend.
- **Lint frontend:** `npm run lint` dentro de `frontend/`.

---

## 📁 Estructura del repositorio

```
vistacerca/
├── compose.yml              # Orquestación completa (Docker Compose)
├── .gitignore
├── README.md
├── database/
│   └── init.sql             # Esquema + datos semilla
├── frontend/                # SPA React (Vite)
├── api-gateway/             # Express 5 · proxy hacia los servicios
├── user-service/            # Microservicio de usuarios (3001)
├── assessment-service/      # Evaluación + clasificación + métricas (3002)
├── partner-service/         # Aliados (3003)
├── appointment-service/     # Citas (3004)
├── analytics-worker/        # Consumidor → contadores en analytics
└── notification-worker/     # Consumidor → notificaciones simuladas
```

---

## 🔑 Temas de seguridad (para extender el prototipo)

- Los datos de conexión a PostgreSQL y RabbitMQ son **credenciales de desarrollo** y deben moverse a
  variables de entorno / secretos en una implementación real.
- No hay autenticación ni control de acceso: cualquier cliente puede crear usuarios o cambiar estados.
- No limites errores ni valides payloads en profundidad (por ejemplo, `userId` como texto).