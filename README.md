# Execution Service - Work Execution and Production

Microservice responsible for managing the execution queue of work orders, including diagnosis, repairs, and production workflow.

## Architecture

| Component | Technology |
|-----------|-----------|
| Framework | NestJS (TypeScript) |
| Database | PostgreSQL 15 (Relational) |
| Messaging | RabbitMQ 3.12 |
| Auth | JWT (global guard) |
| Containers | Docker (multi-stage) |
| Orchestration | Kubernetes |
| CI/CD | GitHub Actions |
| Quality | ESLint + SonarQube |

### Saga Pattern - Choreographed

**Justification:**
1. **Lower coupling** - No centralized orchestrator as single point of failure.
2. **Independent scalability** - Each service scales without orchestrator bottleneck.
3. **Higher resilience** - Events queued in RabbitMQ survive temporary service downtime.
4. **Simplicity** - Event-driven approach aligns with RabbitMQ infrastructure.

**Flow (Execution perspective):**
```
Receives [payment.approved]    -> creates execution in queue
Publishes [execution.completed]-> OS Service marks work order completed
```

**Compensation/Rollback:**
```
On [work-order.cancelled] -> cancels execution (FAILED) + publishes [execution.failed]
On [execution.failed]     -> Billing Service processes refund
```

## Related Repositories

| Service | Repository | Database |
|---------|-----------|----------|
| OS Service (entrypoint, hosts docs) | `garage-os-service` | PostgreSQL |
| Billing Service | `garage-billing-service` | MongoDB |
| **Execution Service** (this) | `garage-execution-service` | PostgreSQL |

Architecture documentation: see `docs/` in `garage-os-service`.

## Features

- Execution CRUD with priority-based queue
- Diagnosis workflow (start/complete with notes)
- Repair workflow (start/complete with notes)
- Parts used and services performed tracking
- Queue management with statistics
- Event publishing/consumption via RabbitMQ
- JWT authentication

### Execution Status Flow

`QUEUED` -> `DIAGNOSING` -> `DIAGNOSIS_COMPLETE` -> `REPAIRING` -> `REPAIR_COMPLETE` -> `COMPLETED`

On cancellation: -> `FAILED` (triggers saga compensation)

## Quick Start

```bash
# 1. Start local infrastructure (PostgreSQL + dedicated RabbitMQ for Execution)
cd ../garage-execution-service
docker compose up -d

# 2. Clone and install
git clone <repo-url>
cd garage-execution-service
npm install

# 3. Start service (starts Execution service and its infrastructure)
docker compose up -d

# 4. Configure environment
cp .env.example .env

# 5. Run in development
npm run start:dev
```

### Docker Compose (full stack)

```bash
docker compose up -d
```

This starts PostgreSQL, RabbitMQ (dedicated to Execution) and the Execution service.

## API

### Swagger

Interactive documentation: `http://localhost:3003/api`

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /executions | Create execution |
| GET | /executions | List all |
| GET | /executions/queue | Execution queue |
| GET | /executions/:id | Get by ID |
| GET | /executions/work-order/:id | Get by work order |
| PATCH | /executions/:id | Update |
| POST | /executions/:id/start-diagnosis | Start diagnosis |
| POST | /executions/:id/complete-diagnosis | Complete diagnosis |
| POST | /executions/:id/start-repair | Start repair |
| POST | /executions/:id/complete-repair | Complete repair |
| POST | /executions/:id/complete | Finalize execution |
| GET | /queue | Queue view |
| GET | /queue/statistics | Queue statistics |
| GET | /health | Health check (no auth) |

### Postman

Collection: `postman_collection.json`

## Testing

```bash
npm run test          # unit tests
npm run test:cov      # coverage report
npm run test:e2e      # BDD/E2E tests
```

### Coverage

Minimum threshold: **80%** (enforced in `jest.config.js` and CI pipeline).

```
All files            |    100% Stmts |    100% Branch |    100% Funcs |    100% Lines
Test Suites: 6 passed | Tests: 40 passed
```

### BDD Tests

```bash
npx jest --config test/jest-e2e.json test/bdd/
# 12 passing (execution flow + saga compensation)
```

## CI/CD Pipeline

`.github/workflows/ci-cd.yaml` executes:

1. `npm ci` - Install
2. `npm run lint` - ESLint
3. `npm run test:cov` - Tests + coverage
4. Coverage check (>= 80%)
5. SonarQube scan
6. Docker build + push to ECR (main only)
7. Kubernetes deployment (main only)

### Branch Protection

- `main` branch protected
- PR required with CI checks passing

## Deployment

```bash
# Docker
docker build -t garage-execution-service .
docker run -p 3003:3003 --env-file .env garage-execution-service

# Kubernetes
kubectl apply -f k8s/deployment.yaml
kubectl rollout status deployment/execution-service
```

## Environment Variables

See `.env.example` for all required variables.

## License

MIT
