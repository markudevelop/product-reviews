# Product Reviews System

A full-stack product review platform built with **NestJS**, **Angular 17**, **PostgreSQL**, and **Redis**, fully containerized with Docker Compose.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![NestJS](https://img.shields.io/badge/NestJS-10-red)
![Angular](https://img.shields.io/badge/Angular-17-purple)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)
![Redis](https://img.shields.io/badge/Redis-7-red)

---

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose

### Run the application

```bash
git clone <repo-url>
cd product-reviews
docker compose up --build
```

That's it. The system starts with:

| Service    | URL                            |
|------------|--------------------------------|
| Frontend   | http://localhost:4200           |
| API        | http://localhost:3000/api       |
| Swagger    | http://localhost:3000/api/docs  |

The database is automatically migrated and seeded with 8 sample products, 4 users, and 20 reviews.

A `Makefile` is provided for convenience: run `make help` to see all available commands, or `make up` to start the stack.

### Demo accounts

All demo accounts use password: `password123`

| Username | Email              |
|----------|--------------------|
| alice    | alice@example.com  |
| bob      | bob@example.com    |
| charlie  | charlie@example.com|
| diana    | diana@example.com  |

---

## Features

### Core
- **Product catalog** with search, category filtering, and sorting (newest, price, rating, review count)
- **Review system** with 1-5 star ratings, create/edit/delete (owner only)
- **Rating aggregation** including per-product average, count, and star distribution histogram
- **User authentication** via JWT (register, login, protected routes)
- **Pagination** for product listings

### Power-up Modules

Three optional feature modules are included, inspired by a plugin architecture pattern:

- **Admin Notifications** — Fires a notification to a configurable admin email whenever a new review is submitted. Ships with a console transport for development; swap in SendGrid, AWS SES, or a message queue for production. The service is fully decoupled from review logic via dependency injection.

- **AI Review Insights** — Generates a summary of all reviews for a product, highlighting common pros, cons, and overall sentiment. When an OpenAI API key is configured (`OPENAI_API_KEY`), it calls GPT-3.5 for rich summaries. Without a key, it falls back to a heuristic keyword extraction engine that works out of the box. Results are cached in Redis for 5 minutes. The frontend includes a "Generate Insights" button on the product detail page that loads analysis on demand.

- **Product Image Storage** — Upload and serve product images via a `/api/uploads` endpoint. Files are validated (type, size), hashed for deduplication, and served via Express static files. The architecture is provider-agnostic: the local filesystem backend can be swapped for S3, GCS, or a CDN by implementing the same interface.

### Technical
- **Redis caching** on product listings and detail pages with automatic invalidation on review changes
- **Swagger/OpenAPI** documentation at `/api/docs`
- **Input validation** with class-validator DTOs on every endpoint
- **Unique review constraint**: one review per user per product (enforced at DB level)
- **Denormalized aggregates** (`avg_rating`, `review_count` on products table) for fast sorting without JOINs
- **Global exception filter** for consistent JSON error responses across all endpoints
- **Request logging interceptor** for HTTP method/path/status/duration on every request
- **ESLint + Prettier** configured for consistent code style
- **GitHub Actions CI** pipeline with lint, unit tests, e2e tests, and Docker smoke test

---

## Architecture

```
product-reviews/
├── docker-compose.yml            # Orchestrates all services
├── Makefile                      # Developer convenience commands
├── .prettierrc                   # Shared formatting config
├── .github/workflows/ci.yml     # CI pipeline
├── init-repo.sh                  # Git history generator (run once)
├── backend/
│   ├── Dockerfile
│   ├── .eslintrc.js
│   ├── prisma/
│   │   ├── schema.prisma         # Data model
│   │   ├── migrations/           # Version-controlled migrations
│   │   └── seed.ts               # Sample data
│   ├── src/
│   │   ├── main.ts               # Bootstrap, validation, CORS, Swagger
│   │   ├── app.module.ts         # Root module wiring
│   │   ├── prisma/               # Prisma service (global)
│   │   ├── auth/                 # JWT auth (register, login, guards)
│   │   ├── products/             # Product listing + caching
│   │   ├── reviews/              # Review CRUD + aggregate updates
│   │   ├── notifications/        # Admin notification service
│   │   ├── insights/             # AI review insights (LLM + heuristic)
│   │   ├── storage/              # Product image upload
│   │   └── common/               # Exception filter, logging interceptor
│   └── test/
│       └── app.e2e-spec.ts       # End-to-end API tests
├── frontend/
│   ├── Dockerfile
│   ├── proxy.conf.json           # Dev proxy (localhost)
│   ├── proxy.conf.docker.json    # Docker proxy (container network)
│   └── src/
│       ├── app/
│       │   ├── components/
│       │   │   ├── header/
│       │   │   ├── login/
│       │   │   ├── register/
│       │   │   ├── product-list/
│       │   │   ├── product-detail/
│       │   │   ├── review-form/
│       │   │   ├── review-list/
│       │   │   ├── review-insights/   # AI insights UI
│       │   │   └── star-rating/
│       │   ├── services/
│       │   ├── models/
│       │   └── interceptors/
│       └── styles.css            # Design system
└── README.md
```

---

## Design Decisions & Trade-offs

### 1. NestJS + Prisma (Backend)

**Why NestJS:** The assignment suggested Node.js. NestJS provides a structured, opinionated framework with built-in support for dependency injection, modules, guards, pipes, and interceptors. This makes the codebase easy to navigate and extend for other developers. The modular architecture means each feature (auth, products, reviews, notifications, insights, storage) lives in its own module with clear boundaries.

**Why Prisma:** Type-safe database access with auto-generated TypeScript types, declarative schema, and built-in migration system. The schema file serves as living documentation of the data model. Trade-off: slightly less flexible than raw SQL for complex queries, but for this domain the simplicity wins.

### 2. Denormalized Rating Aggregates

Products store `avg_rating` and `review_count` directly rather than computing them on every query. This is updated transactionally whenever a review is created, updated, or deleted. The trade-off is a small write overhead vs. significantly faster reads and simpler sorting. This is the same pattern used by Amazon, Yelp, and similar platforms.

### 3. Redis Caching Strategy

Product listings and detail pages are cached in Redis with a 30-second TTL. Cache is proactively invalidated when reviews change. AI insights are cached for 5 minutes (longer TTL since they're expensive to compute). This provides fast reads for the common case (browsing) while ensuring review changes are reflected promptly.

**Trade-off:** For a small dataset, caching adds complexity without huge performance gains. But it demonstrates the pattern and would be essential at scale.

### 4. Angular 17 Standalone Components

The frontend uses Angular 17's standalone component architecture (no NgModules). Every component is self-contained with its imports declared inline. Routes use lazy loading via `loadComponent`. This is the modern Angular approach and makes each component independently testable and reusable.

**Signals** are used for reactive state instead of BehaviorSubject/Observable patterns where appropriate, as they provide simpler, more readable code.

### 5. One Review Per User Per Product

Enforced at both the database level (unique composite index on `product_id + user_id`) and application level (check before insert). The UI hides the review form if the user has already reviewed the product. This prevents spam and matches real-world review platforms.

### 6. JWT Authentication

Stateless JWT tokens stored in localStorage. Simple, works well for SPAs, and doesn't require server-side session storage. The trade-off is that tokens can't be individually revoked without additional infrastructure (blacklist). For this scope, the simplicity is appropriate.

### 7. AI Insights: Dual-mode Architecture

The insights service implements a strategy pattern: it checks for an `OPENAI_API_KEY` at startup and routes to either the LLM path (rich, natural language summaries) or the heuristic path (keyword extraction + template-based summaries). Both paths produce the same `ReviewInsight` interface, so the frontend and cache layer are agnostic to the generation method. This means the feature works immediately without any API key configuration, while offering a clear upgrade path.

### 8. Plugin-style Module Architecture

The three power-up modules (notifications, insights, storage) are designed as loosely-coupled NestJS modules. They can be enabled/disabled by simply adding or removing them from `app.module.ts` imports. This mirrors a real-world plugin architecture where features can be toggled per deployment.

### 9. Docker Compose for Development

Everything runs in containers with health checks and proper dependency ordering. The backend waits for PostgreSQL and Redis to be healthy before starting. Source volumes are mounted for hot-reload during development. Separate proxy configs exist for local (`proxy.conf.json` → localhost:3000) and Docker (`proxy.conf.docker.json` → backend:3000) environments.

---

## API Endpoints

### Auth
| Method | Endpoint           | Auth | Description          |
|--------|--------------------|------|----------------------|
| POST   | /api/auth/register | No   | Register new user    |
| POST   | /api/auth/login    | No   | Login, get JWT token |
| GET    | /api/auth/profile  | Yes  | Get current user     |

### Products
| Method | Endpoint                | Auth | Description                |
|--------|-------------------------|------|----------------------------|
| GET    | /api/products           | No   | List products (paginated)  |
| GET    | /api/products/categories| No   | Get all categories         |
| GET    | /api/products/:id       | No   | Product detail + reviews   |

**Query params for listing:** `page`, `limit`, `category`, `sort` (newest/price_asc/price_desc/rating/reviews), `search`

### Reviews
| Method | Endpoint                                    | Auth | Description        |
|--------|---------------------------------------------|------|--------------------|
| POST   | /api/products/:productId/reviews            | Yes  | Create review      |
| PUT    | /api/products/:productId/reviews/:reviewId  | Yes  | Update own review  |
| DELETE | /api/products/:productId/reviews/:reviewId  | Yes  | Delete own review  |

### Insights
| Method | Endpoint                             | Auth | Description                        |
|--------|--------------------------------------|------|------------------------------------|
| GET    | /api/products/:productId/insights    | No   | AI-powered review summary + themes |

### Storage
| Method | Endpoint                   | Auth | Description           |
|--------|----------------------------|------|-----------------------|
| POST   | /api/uploads               | Yes  | Upload product image  |
| DELETE | /api/uploads/:filename     | Yes  | Delete uploaded image  |

---

## Running Without Docker

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL and Redis connection details
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npx ng serve
# proxy.conf.json already points to localhost:3000
```

---

## Testing

```bash
# Unit tests
cd backend && npm test

# Unit tests with coverage
cd backend && npm run test:cov

# End-to-end tests (requires running DB + Redis)
cd backend && npm run test:e2e

# Or via Makefile
make test        # unit tests
make test-e2e    # e2e tests
make test-cov    # coverage report
```

The test suite includes:
- **Unit tests** for AuthService, ProductsService, ReviewsService, NotificationsService (with mocked dependencies)
- **E2E tests** covering the full auth flow, product listing/filtering/sorting, review CRUD lifecycle, input validation, and error cases

---

## CI/CD

GitHub Actions runs on every push/PR to `main`:

1. **Backend Lint & Test** — ESLint, unit tests with coverage, e2e tests against real PostgreSQL + Redis services
2. **Frontend Build** — Production Angular build to catch compilation errors
3. **Docker Smoke Test** — Builds all containers, starts the stack, and verifies the API responds with HTTP 200

---

## Extending the Project

The modular architecture makes it straightforward to add:

- **Product CRUD** (admin role + guards)
- **Review voting** (helpful/not helpful) as a new `ReviewVote` model
- **Rate limiting** with NestJS throttler
- **WebSocket notifications** for real-time review updates via NestJS gateways
- **Full-text search** by adding a `tsvector` column in PostgreSQL
- **S3 storage backend** by implementing the storage provider interface
- **Email delivery** by swapping the notification transport to SendGrid/SES

Each of these would be a new NestJS module with its own controller, service, and DTOs, following the established patterns.
