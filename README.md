# Precision Calculator — Full-Stack Application

A full-stack calculator application built with a **React + TypeScript** frontend and a **Java 21 + Spring Boot** REST microservice. Designed with clean separation of concerns, strict input validation, high-precision decimal arithmetic, comprehensive unit/integration tests, and single-container Docker deployment.

---

## Features

- **Basic Operations**: Addition (`+`), Subtraction (`−`), Multiplication (`×`), Division (`÷`)
- **Advanced Operations**: Exponentiation (`xʸ`), Square Root (`√x`), Percentage (`%` standalone ratio or `% of` a base value)
- **Interactive UI**:
  - **Keypad Mode**: Classic responsive calculator grid with full keyboard support (`0–9`, `.`, `+`, `-`, `*`, `/`, `^`, `%`, `Enter`/`=`, `Backspace`, `Esc`), operator chaining, and contextual percentage calculation
  - **Operation Form Mode**: Explicit labeled inputs for direct testing, optional percentage base (`% of`), and immediate client-side validation feedback
  - **Calculation History**: Keeps recent API results and lets you click any entry to reuse its result
- **Robust Validation & Error Handling**:
  - Client-side syntax/range validation prevents empty or non-numeric payloads
  - Backend Bean Validation + domain guards return structured JSON error responses (`400 Bad Request`) for division by zero, negative square roots, invalid exponents, missing fields, and malformed JSON

---

## Project Structure

```text
.
├── backend/                  # Java 21 + Spring Boot 3.4 REST microservice
│   ├── src/main/java/com/calculator/
│   │   ├── config/           # CORS configuration
│   │   ├── controller/       # REST endpoints (/api/v1/calculator/*)
│   │   ├── exception/        # Custom domain exceptions & @RestControllerAdvice
│   │   ├── model/            # Java records for requests, responses, errors
│   │   └── service/          # BigDecimal arithmetic & domain validation
│   ├── src/test/java/        # JUnit 5 service unit tests & MockMvc tests
│   └── pom.xml               # Maven + JaCoCo coverage configuration
├── frontend/                 # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/       # CalculatorKeypad, OperationForm, HistoryList
│   │   ├── services/         # Fetch API client & typed CalculatorApiError
│   │   ├── types/            # TypeScript API/UI contracts
│   │   └── utils/            # Input parsing & validation helpers
│   ├── package.json
│   └── vite.config.ts        # Vite dev proxy (/api -> localhost:8080) + Vitest
├── Dockerfile                # Multi-stage full-stack build (frontend + backend)
├── docker-compose.yml        # Local full-stack container orchestration
└── README.md
```

---

## Prerequisites

- **Local Development**:
  - **Java 21+** (JDK 21 recommended; Maven Wrapper `./mvnw` is included)
  - **Node.js 20+** and **npm 10+**
- **Containerized Run (optional)**:
  - **Docker** (and Docker Compose)

---

## Setup & Running Locally

### 1. Run the Backend (Spring Boot)

From the repository root:

```bash
cd backend
```

On macOS / Linux:
```bash
./mvnw spring-boot:run
```

On Windows (PowerShell / CMD):
```powershell
.\mvnw.cmd spring-boot:run
```

The backend API starts on `http://localhost:8080`.
Health check endpoint: `http://localhost:8080/actuator/health`.

### 2. Run the Frontend (React + TypeScript)

In a separate terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173` and automatically proxies `/api/*` requests to `http://localhost:8080` (configured in `frontend/vite.config.ts`).

> If you host the backend on a different origin, set `VITE_API_BASE_URL` (for example `VITE_API_BASE_URL=http://localhost:8080`) before building or running the frontend, and configure `app.cors.allowed-origins` in `backend/src/main/resources/application.yml`.

---

## Full-Stack Deployment with Docker

The root `Dockerfile` builds the React production bundle, packages it into the Spring Boot JAR (`classpath:/static`), and runs the full-stack application on a single `eclipse-temurin:21-jre-alpine` container listening on port `8080`:

```bash
docker compose up --build
```

Or with plain Docker:

```bash
docker build -t precision-calculator .
docker run -p 8080:8080 precision-calculator
```

Then open `http://localhost:8080` in your browser.

---

## Tests & Coverage Reports

### Backend (JUnit 5 + MockMvc + JaCoCo)

```bash
cd backend
./mvnw clean verify      # Windows: .\mvnw.cmd clean verify
```

- Runs all service unit tests (`CalculatorServiceTest`) and Spring WebMvc tests (`CalculatorControllerTest`)
- Enforces minimum 80% line coverage via JaCoCo
- Generates HTML/CSV/XML coverage reports at `backend/target/site/jacoco/index.html`

### Frontend (Vitest + React Testing Library + v8 Coverage)

```bash
cd frontend
npm run test:coverage
```

- Runs unit tests for validation (`validation.test.ts`), API client (`calculatorApi.test.ts`), and UI integration (`App.test.tsx`)
- Generates HTML/LCOV coverage reports at `frontend/coverage/index.html`

---

## API Reference & Examples

Base path: `/api/v1/calculator` (`Content-Type: application/json`)

| Operation      | Method & Path                         | Request Body                                  |
| -------------- | ------------------------------------- | --------------------------------------------- |
| Addition       | `POST /api/v1/calculator/add`         | `{ "a": 12.5, "b": 7.5 }`                     |
| Subtraction    | `POST /api/v1/calculator/subtract`    | `{ "a": 50, "b": 18 }`                        |
| Multiplication | `POST /api/v1/calculator/multiply`    | `{ "a": 7, "b": 6 }`                          |
| Division       | `POST /api/v1/calculator/divide`      | `{ "a": 100, "b": 4 }`                        |
| Exponentiation | `POST /api/v1/calculator/power`       | `{ "base": 2, "exponent": 10 }`               |
| Square Root    | `POST /api/v1/calculator/sqrt`        | `{ "value": 81 }`                             |
| Percentage     | `POST /api/v1/calculator/percentage`  | `{ "percent": 25 }` or `{ "percent": 15, "of": 200 }` |

### Example Requests (`curl`)

#### Addition
```bash
curl -s -X POST http://localhost:8080/api/v1/calculator/add \
  -H "Content-Type: application/json" \
  -d '{"a": 0.1, "b": 0.2}'
```
Response (`200 OK`):
```json
{
  "operation": "ADDITION",
  "inputs": { "a": 0.1, "b": 0.2 },
  "result": 0.3,
  "expression": "0.1 + 0.2",
  "timestamp": "2026-11-13T14:20:00Z"
}
```

#### Exponentiation
```bash
curl -s -X POST http://localhost:8080/api/v1/calculator/power \
  -H "Content-Type: application/json" \
  -d '{"base": 2, "exponent": 10}'
```
Response (`200 OK`):
```json
{
  "operation": "EXPONENTIATION",
  "inputs": { "base": 2, "exponent": 10 },
  "result": 1024,
  "expression": "2 ^ 10",
  "timestamp": "2026-11-13T14:20:05Z"
}
```

#### Square Root
```bash
curl -s -X POST http://localhost:8080/api/v1/calculator/sqrt \
  -H "Content-Type: application/json" \
  -d '{"value": 144}'
```

#### Percentage (`15% of 200`)
```bash
curl -s -X POST http://localhost:8080/api/v1/calculator/percentage \
  -H "Content-Type: application/json" \
  -d '{"percent": 15, "of": 200}'
```

#### Error Example — Division by Zero (`400 Bad Request`)
```bash
curl -s -X POST http://localhost:8080/api/v1/calculator/divide \
  -H "Content-Type: application/json" \
  -d '{"a": 10, "b": 0}'
```
Response (`400 Bad Request`):
```json
{
  "timestamp": "2026-11-13T14:20:10Z",
  "status": 400,
  "error": "Bad Request",
  "code": "DIVISION_BY_ZERO",
  "message": "Division by zero is not allowed.",
  "path": "/api/v1/calculator/divide"
}
```

#### Error Example — Validation Failure (`400 Bad Request`)
```bash
curl -s -X POST http://localhost:8080/api/v1/calculator/add \
  -H "Content-Type: application/json" \
  -d '{"a": 5}'
```
Response (`400 Bad Request`):
```json
{
  "timestamp": "2026-11-13T14:20:12Z",
  "status": 400,
  "error": "Bad Request",
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed. Please check the provided fields.",
  "path": "/api/v1/calculator/add",
  "fieldErrors": {
    "b": "Operand 'b' is required."
  }
}
```

---

## Design Decisions & Assumptions

1. **`BigDecimal` Precision in Backend Arithmetic**:
   - Standard IEEE-754 floating-point math produces artifacts such as `0.1 + 0.2 = 0.30000000000000004`. The backend uses `BigDecimal` with a 16-digit `MathContext` (`RoundingMode.HALF_UP`) for `+`, `-`, `*`, `/`, `%`, integer powers, and `BigDecimal.sqrt` (Java 9+). Results are normalized (`stripTrailingZeros` with plain-string serialization) so `2.00` returns cleanly as `2`.
2. **Exponentiation Edge Cases**:
   - Integer exponents use `BigDecimal.pow(int, MathContext)` for exactness (including negative integer exponents such as `2^-2 = 0.25`).
   - Non-integer exponents on positive bases delegate to `Math.pow` with overflow/NaN checks (`Double.isFinite`).
   - Negative bases with fractional exponents are rejected (`400`) because complex numbers are outside real-number calculator scope.
   - `0^0` evaluates to `1` (consistent with `BigDecimal.pow(0)` and IEEE-754 `Math.pow(0, 0)`).
   - Exponent magnitude is bounded to `[-10000, 10000]` to prevent excessive computation on pathological inputs.
3. **Percentage Semantics**:
   - `POST /api/v1/calculator/percentage` accepts a required `percent` and an optional `of` field:
     - When `of` is omitted, it returns `percent / 100` (e.g., `25% -> 0.25`).
     - When `of` is supplied, it computes `(percent / 100) * of` (e.g., `15% of 200 -> 30`).
   - In the keypad UI, pressing `%` after entering a base and operator (e.g., `200 + 15 %`) resolves `15% of 200` (`30`) via the API so pressing `=` yields `230`.
4. **Validation Boundary**:
   - The frontend validates syntactic correctness (empty fields, non-numeric text, non-finite values) before making network requests, while mathematical domain checks (division by zero, negative square root, invalid exponent) are enforced authoritatively by the backend and surfaced cleanly in the UI.
5. **Single-Container Packaging**:
   - In production Docker builds, Spring Boot serves the compiled Vite static assets directly from `classpath:/static`, avoiding extra reverse-proxy containers and eliminating cross-origin overhead in deployment while keeping Vite's dev proxy for local DX.
