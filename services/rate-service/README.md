# Rate Service

Rate Service is a microservice responsible for managing exchange rates, rate configurations, and quote locks in the FX Exchange Platform.

## Overview

The Rate Service handles:

- **Channel Rate Fetching**: Retrieves real-time exchange rates from external channels (PHP, BOCHK, Leptage)
- **Rate Caching**: Caches rates in Redis for fast access with 5-minute TTL
- **Platform Rate Configuration**: Manages platform markup on top of channel rates
- **Merchant Rate Configuration**: Handles merchant-specific pricing and custom rates
- **Quote Locking**: Creates 30-second rate locks for order placement

## Architecture

### Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Container**: Docker

### Database Tables

1. **channel_rates**: Real-time exchange rates from channels
2. **platform_rate_config**: Platform markup configuration
3. **merchant_rate_config**: Merchant-specific rate configuration
4. **rate_quote_locks**: Audit log of rate quote locks

### Key Features

- Health check endpoints for monitoring
- Redis caching for high-performance rate lookups
- TypeORM entities with proper indexing
- Configuration-driven architecture
- Docker containerization with multi-stage build

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 14 or higher
- Redis 7 or higher
- npm or yarn

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Application
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=fx_platform

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Setup Database

Run the database migration:

```bash
psql -U postgres -d fx_platform -f ../../database/migrations/001_create_rate_tables.sql
```

Or use the TypeORM CLI:

```bash
npm run migration:run
```

## Running the Service

### Development Mode

```bash
npm run start:dev
```

The service will start on port 3001 with hot-reload enabled.

### Production Mode

```bash
npm run build
npm run start:prod
```

### Docker

Build and run with Docker:

```bash
# Build image
docker build -t rate-service:latest .

# Run container
docker run -p 3001:3001 \
  -e DB_HOST=host.docker.internal \
  -e REDIS_HOST=host.docker.internal \
  rate-service:latest
```

## Health Checks

The service provides three health check endpoints:

### 1. Full Health Check

```bash
curl http://localhost:3001/health
```

Returns:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" }
  }
}
```

### 2. Readiness Check

```bash
curl http://localhost:3001/health/ready
```

Checks if the service is ready to accept traffic (DB and Redis connected).

### 3. Liveness Check

```bash
curl http://localhost:3001/health/live
```

Simple check to verify the service is running.

## API Endpoints

### Base URL

```
http://localhost:3001/api/v1
```

### Health Endpoints

- `GET /health` - Full health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

### Future Endpoints (To Be Implemented)

- `GET /rates/channel/:channelId/latest` - Get latest channel rates
- `POST /rates/platform/config` - Configure platform markup
- `POST /rates/merchant/config` - Configure merchant pricing
- `GET /rates/merchant/:merchantId/quote` - Get merchant quote
- `POST /rates/quote/lock` - Lock a quote for 30 seconds

## Project Structure

```
rate-service/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── redis.config.ts
│   ├── entities/               # TypeORM entities
│   │   ├── channel-rate.entity.ts
│   │   ├── platform-rate-config.entity.ts
│   │   ├── merchant-rate-config.entity.ts
│   │   └── rate-quote-lock.entity.ts
│   ├── modules/
│   │   ├── health/            # Health check module
│   │   │   ├── health.controller.ts
│   │   │   ├── health.module.ts
│   │   │   └── redis.health.ts
│   │   ├── cache/             # Redis cache module
│   │   │   └── cache.module.ts
│   │   └── rate/              # Rate management (to be implemented)
│   ├── common/                # Shared utilities
│   │   ├── dto/
│   │   ├── interfaces/
│   │   └── constants/
│   ├── app.module.ts          # Root module
│   └── main.ts                # Application entry point
├── test/                      # Test files
├── package.json
├── tsconfig.json
├── nest-cli.json
├── Dockerfile
└── README.md
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Service port | `3001` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `DB_DATABASE` | Database name | `fx_platform` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_TTL` | Default cache TTL (seconds) | `300` |
| `RATE_FETCH_INTERVAL` | Rate fetch interval (ms) | `60000` |
| `QUOTE_LOCK_DURATION` | Quote lock duration (seconds) | `30` |

## Testing

### Run Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Development

### Generate Migration

```bash
npm run migration:generate -- src/migrations/MigrationName
```

### Run Migration

```bash
npm run migration:run
```

### Revert Migration

```bash
npm run migration:revert
```

### Linting

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

## Database Schema

### channel_rates

Stores real-time exchange rates fetched from channels.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| channel_id | VARCHAR(50) | Channel identifier (PHP/BOCHK/LEPTAGE) |
| currency_pair | VARCHAR(10) | Currency pair (e.g., USD/HKD) |
| bid_rate | DECIMAL(18,8) | Buy price |
| ask_rate | DECIMAL(18,8) | Sell price |
| mid_rate | DECIMAL(18,8) | Mid price |
| fetch_time | TIMESTAMP | When the rate was fetched |
| valid_until | TIMESTAMP | Rate expiration time |
| created_at | TIMESTAMP | Record creation time |

### platform_rate_config

Platform markup configuration on top of channel rates.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| channel_id | VARCHAR(50) | Channel identifier |
| currency_pair | VARCHAR(10) | Currency pair |
| markup_type | VARCHAR(20) | 'pips' or 'percentage' |
| markup_value | DECIMAL(10,6) | Markup amount |
| effective_from | TIMESTAMP | Start time |
| effective_to | TIMESTAMP | End time (nullable) |
| is_active | BOOLEAN | Active status |
| created_by | VARCHAR(100) | Creator ID |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### merchant_rate_config

Merchant-specific rate configuration.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| merchant_id | VARCHAR(100) | Merchant identifier |
| currency_pair | VARCHAR(10) | Currency pair |
| pricing_type | VARCHAR(20) | 'platform', 'custom', or 'markup' |
| custom_rate | DECIMAL(18,8) | Fixed custom rate (nullable) |
| markup_value | DECIMAL(10,6) | Additional markup (nullable) |
| approval_status | VARCHAR(20) | 'pending', 'approved', 'rejected' |
| effective_from | TIMESTAMP | Start time |
| effective_to | TIMESTAMP | End time (nullable) |
| is_active | BOOLEAN | Active status |
| created_by | VARCHAR(100) | Creator ID |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

### rate_quote_locks

Audit log of rate quote locks (actual locks stored in Redis).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| quote_id | VARCHAR(100) | Unique quote identifier |
| merchant_id | VARCHAR(100) | Merchant identifier |
| currency_pair | VARCHAR(10) | Currency pair |
| rate | DECIMAL(18,8) | Locked rate |
| sell_currency | VARCHAR(3) | Source currency |
| sell_amount | DECIMAL(18,2) | Sell amount |
| buy_currency | VARCHAR(3) | Target currency |
| buy_amount | DECIMAL(18,2) | Buy amount |
| locked_at | TIMESTAMP | Lock creation time |
| expires_at | TIMESTAMP | Lock expiration time |
| status | VARCHAR(20) | 'locked', 'used', 'expired', 'cancelled' |
| created_at | TIMESTAMP | Record creation time |

## Monitoring

### Metrics to Monitor

- Health check status
- Database connection pool usage
- Redis connection status
- Memory usage (heap and RSS)
- Response times for rate queries
- Cache hit/miss ratio

### Logging

The service uses NestJS built-in logger with structured logging:

```typescript
logger.log('Rate fetched successfully', { channelId, currencyPair });
logger.error('Failed to fetch rate', { error, channelId });
```

## Security

- No secrets in code or environment files
- Use environment variables for sensitive configuration
- Database credentials should be rotated regularly
- Redis should be protected with password in production
- API endpoints should be behind authentication (to be implemented)

## Performance

### Optimization Strategies

1. **Redis Caching**: All rate lookups use Redis cache first
2. **Database Indexing**: Proper indexes on frequently queried columns
3. **Connection Pooling**: Configured for optimal DB connections
4. **Rate Limiting**: To be implemented for API endpoints

### Expected Performance

- Rate lookup latency: < 50ms (from cache)
- Database query latency: < 100ms
- Health check response: < 100ms

## Troubleshooting

### Cannot Connect to Database

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify credentials
psql -U postgres -d fx_platform
```

### Cannot Connect to Redis

```bash
# Check Redis is running
redis-cli ping

# Should return: PONG
```

### Health Check Failing

```bash
# Check service logs
npm run start:dev

# Test database connection
psql -U postgres -d fx_platform -c "SELECT 1"

# Test Redis connection
redis-cli ping
```

## Contributing

1. Create a feature branch from `epic/fx-v1`
2. Make your changes
3. Write tests for new functionality
4. Run linting and tests
5. Commit with format: `Issue #3 Stream A: [description]`
6. Create pull request

## License

UNLICENSED - Internal use only

## Contact

FX Platform Team
