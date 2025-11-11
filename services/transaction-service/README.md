# Transaction Service

Transaction Service for FX Platform - Handles exchange orders, order events, and quote locks for cross-border currency exchange transactions.

## Overview

The Transaction Service is responsible for:
- Managing exchange order lifecycle (creation, execution, completion)
- Tracking order events for audit trail and saga orchestration
- Handling quote locks with 30-second TTL
- Publishing events to RabbitMQ for downstream processing
- Implementing Saga pattern for distributed transaction management

## Architecture

### Database Tables
1. **exchange_orders** - Exchange order records
2. **order_events** - Immutable event log for order state changes
3. **quote_locks** - Rate locks with 30-second expiration

### Saga Pattern Implementation
The service implements the Saga pattern for distributed transactions:
- Event-driven architecture using RabbitMQ
- Each step publishes events for next steps
- Compensation mechanisms for failure handling
- Idempotent operations for retry safety

### Event Flow
```
OrderCreated → FxInquiry → FxExecution → Settlement → OrderCompleted
     ↓              ↓            ↓            ↓             ↓
  Events       Events       Events       Events        Events
```

## Technology Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL (via TypeORM)
- **Message Queue**: RabbitMQ
- **Container**: Docker

## Prerequisites

- Node.js 20.x or higher
- PostgreSQL 14.x or higher
- RabbitMQ 3.x or higher
- npm or yarn

## Installation

### 1. Clone and Install Dependencies

```bash
cd services/transaction-service
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Application
NODE_ENV=development
PORT=3002

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=fx_platform

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
```

### 3. Run Database Migrations

```bash
# Apply migrations
npm run migration:run

# Or manually run the SQL file
psql -U postgres -d fx_platform -f ../../database/migrations/002_create_transaction_tables.sql
```

## Running the Service

### Development Mode

```bash
npm run start:dev
```

The service will start at `http://localhost:3002`

### Production Mode

```bash
npm run build
npm run start:prod
```

### Docker Mode

```bash
# Build image
docker build -t fx-platform/transaction-service .

# Run container
docker run -p 3002:3002 \
  -e DB_HOST=host.docker.internal \
  -e RABBITMQ_URL=amqp://host.docker.internal:5672 \
  fx-platform/transaction-service
```

## API Endpoints

### Health Check

```bash
# Basic health check
GET /health

Response:
{
  "status": "ok",
  "service": "transaction-service",
  "timestamp": "2025-11-12T00:00:00.000Z"
}

# Detailed health check
GET /health/detailed

Response:
{
  "service": "transaction-service",
  "status": "ok",
  "checks": {
    "database": { "status": "ok", "message": "Database connection healthy" },
    "memory": { "status": "ok", "heapUsed": "45MB", "heapTotal": "80MB" },
    "uptime": { "status": "ok", "uptime": "120 minutes" }
  }
}
```

### Orders (Placeholder - Phase 2)

```bash
# List orders
GET /api/v1/orders

# Get order detail
GET /api/v1/orders/:id

# Create order
POST /api/v1/orders
```

### Quote Locks (Placeholder - Phase 2)

```bash
# Lock a quote
POST /api/v1/quote-locks
```

## Database Schema

### exchange_orders

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| merchant_id | VARCHAR(100) | Merchant identifier |
| quote_id | VARCHAR(100) | Locked quote reference |
| planned_sell_currency | VARCHAR(10) | Currency to sell |
| planned_sell_amount | DECIMAL(18,2) | Amount to sell |
| planned_buy_currency | VARCHAR(10) | Currency to buy |
| planned_buy_amount | DECIMAL(18,2) | Amount to buy |
| customer_rate | DECIMAL(18,8) | Rate shown to customer |
| order_status | VARCHAR(50) | Current order status |
| channel_id | VARCHAR(50) | Channel identifier |
| actual_executed_amount | DECIMAL(18,2) | Actual amount executed |
| profit_amount | DECIMAL(18,2) | Platform profit |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### order_events

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| order_id | VARCHAR(100) | Related order ID |
| event_type | VARCHAR(50) | Event type |
| event_data | JSONB | Event payload |
| created_at | TIMESTAMP | Event timestamp |

### quote_locks

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| merchant_id | VARCHAR(100) | Merchant identifier |
| currency_pair | VARCHAR(20) | Currency pair |
| locked_rate | DECIMAL(18,8) | Locked exchange rate |
| lock_expires_at | TIMESTAMP | Expiration time |
| is_used | BOOLEAN | Whether quote was used |
| created_at | TIMESTAMP | Creation timestamp |

## Event Publishing

The service publishes events to RabbitMQ for saga orchestration:

### Event Types

- `order.created` - Order created event
- `order.updated` - Order status updated
- `order.fx.success` - FX execution succeeded
- `order.fx.failed` - FX execution failed
- `order.settlement.completed` - Settlement completed

### Event Message Format

```typescript
{
  eventType: string,
  eventData: any,
  timestamp: Date,
  orderId?: string,
  merchantId?: string,
  metadata?: Record<string, any>
}
```

## Development

### Project Structure

```
src/
├── config/              # Configuration files
│   └── typeorm.config.ts
├── entities/            # TypeORM entities
│   ├── exchange-order.entity.ts
│   ├── order-event.entity.ts
│   └── quote-lock.entity.ts
├── modules/             # Feature modules
│   ├── health/          # Health check module
│   ├── order/           # Order management
│   ├── quote-lock/      # Quote lock management
│   └── events/          # Event publisher
├── common/              # Shared code
│   ├── enums/           # Enums
│   ├── interfaces/      # Interfaces
│   └── dto/             # Data transfer objects
├── app.module.ts        # Root module
└── main.ts              # Application entry point
```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment | development |
| PORT | Service port | 3002 |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_USERNAME | Database user | postgres |
| DB_PASSWORD | Database password | postgres |
| DB_NAME | Database name | fx_platform |
| RABBITMQ_URL | RabbitMQ connection URL | amqp://localhost:5672 |
| CORS_ORIGINS | Allowed CORS origins | * |

## Monitoring

### Health Checks

The service exposes health check endpoints for monitoring:

- `/health` - Basic health status
- `/health/detailed` - Detailed health with database, memory, uptime

### Logging

The service uses NestJS built-in logger with configurable log levels.

### Metrics

Event publishing metrics are logged for monitoring:
- Events published successfully
- Event publishing failures
- RabbitMQ connection status

## Production Deployment

### Docker Deployment

```bash
# Build
docker build -t fx-platform/transaction-service:latest .

# Run
docker run -d \
  --name transaction-service \
  -p 3002:3002 \
  --env-file .env.production \
  fx-platform/transaction-service:latest
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: transaction-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: transaction-service
  template:
    metadata:
      labels:
        app: transaction-service
    spec:
      containers:
      - name: transaction-service
        image: fx-platform/transaction-service:latest
        ports:
        - containerPort: 3002
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
        readinessProbe:
          httpGet:
            path: /health
            port: 3002
```

## Troubleshooting

### Database Connection Issues

```bash
# Test database connection
psql -h localhost -U postgres -d fx_platform

# Check migrations
npm run migration:show
```

### RabbitMQ Connection Issues

```bash
# Check RabbitMQ status
rabbitmqctl status

# Test connection
curl http://localhost:15672/api/overview
```

### Service Not Starting

1. Check environment variables are set correctly
2. Verify database is running and migrations are applied
3. Check RabbitMQ is accessible
4. Review logs for error messages

## Next Steps (Phase 2)

- [ ] Implement order creation API
- [ ] Implement quote lock API
- [ ] Add order query and filtering
- [ ] Implement saga event handlers
- [ ] Add integration with Rate Service
- [ ] Add integration with Channel Service
- [ ] Implement compensation logic
- [ ] Add comprehensive test coverage

## Support

For issues and questions:
- Check the logs: `docker logs transaction-service`
- Review health check: `curl http://localhost:3002/health/detailed`
- Contact: FX Platform Team

## License

UNLICENSED - Internal use only
