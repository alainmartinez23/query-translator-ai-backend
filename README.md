# Query Translator AI — Backend

Backend que traduce lenguaje natural a consultas SQL sobre PostgreSQL utilizando IA, con foco en **seguridad, resiliencia y arquitectura limpia**.

## Qué hace

Un usuario envía un prompt en lenguaje natural:
> "empleados con salario mayor a 3000"

El sistema:

1. Genera una query SQL usando OpenAI  
2. Valida la query (solo SELECT, sin operaciones peligrosas)  
3. Ejecuta la query en PostgreSQL  
4. Devuelve resultados estructurados  

---

## Arquitectura

El sistema sigue una separación clara de responsabilidades:
Controller → Service → OpenAI → Validator → DB


### Componentes:

- **Controller** → expone endpoint `/query`
- **Service** → orquesta el flujo completo
- **OpenAI Client** → generación de SQL
- **SQL Validator** → seguridad (solo SELECT)
- **DB Client** → ejecución en PostgreSQL
- **Resilience Layer** → timeouts + circuit breaker

---

## ⚙️ Stack

- Node.js + Express
- PostgreSQL (`pg`)
- OpenAI API (`gpt-4o-mini`)
- `opossum` (circuit breaker)
- `express-rate-limit`

---

## 🔐 Seguridad

- Solo se permiten consultas `SELECT`
- Bloqueo de palabras peligrosas (INSERT, DELETE, etc.)
- Usuario de base de datos **read-only**
- Límite de resultados (`LIMIT 50`)

---

## 🛡️ Resiliencia

El sistema está diseñado para fallar bien:

- **Timeouts** en OpenAI y base de datos  
- **Circuit breaker**:
  - evita saturar OpenAI en fallos
  - recuperación automática (HALF-OPEN)
- **Rate limiting agresivo**:
  - 5 requests/min por IP

---

## Base de datos

Modelo simple pero suficiente para queries reales:

- `employees`
- `departments`
- `absences`

Permite:
- JOINs
- agregaciones
- queries analíticas

---

## 📡 Endpoint

### POST `/query`

#### Request:
Ejemplo:
{
  "prompt": "empleados con salario mayor a 3000"
}

#### Response:
Ejemplo:
{
  "sql": "SELECT ...",
  "rows": [...]
}

## Cómo ejecutar
npm install
node app.js

Servidor en: http://localhost:3000