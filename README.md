# Calculator

Full-stack calculator application built with a React + TypeScript frontend and a Java 21 + Spring Boot REST API.

## Features

- **Basic operations**: Addition (`+`), Subtraction (`-`), Multiplication (`*`), Division (`/`)
- **Advanced operations**: Exponentiation (`x^y`), Square Root (`sqrt`), Percentage (`%` or `% of`)
- **Frontend UI**:
  - **Keypad mode** with keyboard support (`0-9`, `.`, `+`, `-`, `*`, `/`, `^`, `%`, `Enter`/`=`, `Backspace`, `Esc`), operator chaining, and contextual percentages
  - **Manual Input mode** for explicit operand entry and validation testing
  - **History list** to view recent results and click any entry to reuse its value
- **Validation & error handling**:
  - Client-side syntax validation for empty, non-numeric, or non-finite inputs
  - Server-side validation and structured JSON error responses (`400 Bad Request`) for division by zero, negative square roots, invalid exponents, missing fields, and malformed JSON

## Project Structure

```text
.
├── .github/workflows/ci.yml  # GitHub Actions CI/CD pipeline
├── backend/                  # Java 21 + Spring Boot 3.4 REST service
│   ├── src/main/java/com/calculator/
│   │   ├── config/           # CORS configuration
│   │   ├── controller/       # REST endpoints (/api/v1/calculator/*)
│   │   ├── exception/        # Domain exceptions & global error handler
│   │   ├── model/            # Request, response, and error records
│   │   └── service/          # BigDecimal arithmetic & domain validation
│   ├── src/test/java/        # JUnit 5 service and MockMvc tests
│   └── pom.xml
├── frontend/                 # React 19 + TypeScript + Vite app
│   ├── src/
│   │   ├── components/       # CalculatorKeypad, OperationForm, HistoryList
│   │   ├── services/         # Fetch client & CalculatorApiError
│   │   ├── types/            # TypeScript contracts
│   │   └── utils/            # Input parsing & validation helpers
│   ├── package.json
│   └── vite.config.ts
├── Dockerfile                # Multi-stage full-stack container build
└── docker-compose.yml
```

## Prerequisites

- Java 21+ (Maven Wrapper `./mvnw` is included)
- Node.js 20+ and npm 10+
- Docker (optional, for containerized deployment)

## Running Locally

### Backend

```bash
cd backend
./mvnw spring-boot:run      # Windows: .\mvnw.cmd spring-boot:run
```

Starts on `http://localhost:8080`. Health check: `http://localhost:8080/actuator/health`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Starts on `http://localhost:5173`. Requests to `/api/*` are proxied to `http://localhost:8080` via `frontend/vite.config.ts`.

To point the frontend to a different backend URL, set `VITE_API_BASE_URL` before building and configure `app.cors.allowed-origins` in `backend/src/main/resources/application.yml`.

## Running with Docker

The root `Dockerfile` builds the React app, bundles the static output into Spring Boot (`classpath:/static`), and runs a single container on port `8080`:

```bash
docker compose up --build
```

Or directly with Docker:

```bash
docker build -t calculator-app .
docker run -p 8080:8080 calculator-app
```

Open `http://localhost:8080`.

## Running Tests & Coverage

### Backend (JUnit 5 + MockMvc + JaCoCo)

```bash
cd backend
./mvnw clean verify         # Windows: .\mvnw.cmd clean verify
```

JaCoCo requires at least 80% line coverage and generates reports at `backend/target/site/jacoco/index.html`.

### Frontend (Vitest + React Testing Library + v8)

```bash
cd frontend
npm run test:coverage
```

Generates coverage reports at `frontend/coverage/index.html`.

## API Reference

Base URL: `/api/v1/calculator` (`Content-Type: application/json`)

| Operation      | Endpoint                              | Payload                                                |
| -------------- | ------------------------------------- | ------------------------------------------------------ |
| Addition       | `POST /api/v1/calculator/add`         | `{ "a": 12.5, "b": 7.5 }`                              |
| Subtraction    | `POST /api/v1/calculator/subtract`    | `{ "a": 50, "b": 18 }`                                 |
| Multiplication | `POST /api/v1/calculator/multiply`    | `{ "a": 7, "b": 6 }`                                   |
| Division       | `POST /api/v1/calculator/divide`      | `{ "a": 100, "b": 4 }`                                 |
| Exponentiation | `POST /api/v1/calculator/power`       | `{ "base": 2, "exponent": 10 }`                        |
| Square Root    | `POST /api/v1/calculator/sqrt`        | `{ "value": 81 }`                                      |
| Percentage     | `POST /api/v1/calculator/percentage`  | `{ "percent": 25 }` or `{ "percent": 15, "of": 200 }`  |

### Examples

```bash
curl -s -X POST http://localhost:8080/api/v1/calculator/add \
  -H "Content-Type: application/json" \
  -d '{"a": 0.1, "b": 0.2}'
```

```json
{
  "operation": "ADDITION",
  "inputs": { "a": 0.1, "b": 0.2 },
  "result": 0.3,
  "expression": "0.1 + 0.2",
  "timestamp": "2026-11-13T14:20:00Z"
}
```

```bash
curl -s -X POST http://localhost:8080/api/v1/calculator/power \
  -H "Content-Type: application/json" \
  -d '{"base": 2, "exponent": 10}'
```

```bash
curl -s -X POST http://localhost:8080/api/v1/calculator/sqrt \
  -H "Content-Type: application/json" \
  -d '{"value": 144}'
```

```bash
curl -s -X POST http://localhost:8080/api/v1/calculator/percentage \
  -H "Content-Type: application/json" \
  -d '{"percent": 15, "of": 200}'
```

Division by zero (`400 Bad Request`):

```bash
curl -s -X POST http://localhost:8080/api/v1/calculator/divide \
  -H "Content-Type: application/json" \
  -d '{"a": 10, "b": 0}'
```

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

Validation error (`400 Bad Request`):

```bash
curl -s -X POST http://localhost:8080/api/v1/calculator/add \
  -H "Content-Type: application/json" \
  -d '{"a": 5}'
```

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

## Design Decisions & Assumptions

- **Decimal precision**: The backend uses `BigDecimal` (`MathContext` precision 16, `RoundingMode.HALF_UP`) for arithmetic and `BigDecimal.sqrt` for square roots instead of `double`, avoiding IEEE-754 rounding artifacts like `0.1 + 0.2 = 0.30000000000000004`. Results are stripped of trailing zeros and serialized as plain numbers.
- **Exponentiation**: Integer exponents use `BigDecimal.pow(int, MathContext)`. Fractional exponents on positive bases use `Math.pow` with finiteness checks; negative bases with fractional exponents are rejected (`400`), `0^0` evaluates to `1`, and exponents are bounded to `[-10000, 10000]`.
- **Percentage**: Accepts a required `percent` and optional `of` field (`25% -> 0.25`, `15% of 200 -> 30`). On the keypad, pressing `%` after an operator and left operand computes `percent` of that base.
- **Validation split**: The frontend catches empty or non-numeric inputs before sending requests; domain rules (division by zero, negative square root, invalid exponent) are enforced by the backend and displayed in the UI.
- **Packaging**: Docker builds serve the compiled Vite assets from Spring Boot's static resource path on a single port, removing the need for a separate web server container.

## CI/CD

Pushes and pull requests to `main` run `.github/workflows/ci.yml`, which executes backend tests (JaCoCo), frontend build and tests (Vitest), and a Docker build + container smoke test, publishing the image to `ghcr.io/irvanlei/calculator:latest` on `main`.
