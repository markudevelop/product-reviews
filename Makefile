.PHONY: help up down build logs test lint format seed migrate studio clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# === Docker Commands ===

up: ## Start all services
	docker compose up -d
	@echo "\n✅ Services running:"
	@echo "   Frontend:  http://localhost:4200"
	@echo "   API:       http://localhost:3000/api"
	@echo "   Swagger:   http://localhost:3000/api/docs"

down: ## Stop all services
	docker compose down

build: ## Rebuild all containers
	docker compose up --build -d

logs: ## Tail all service logs
	docker compose logs -f

logs-api: ## Tail backend logs
	docker compose logs -f backend

logs-ui: ## Tail frontend logs
	docker compose logs -f frontend

# === Development ===

test: ## Run backend unit tests
	cd backend && npm test

test-e2e: ## Run backend e2e tests
	cd backend && npm run test:e2e

test-cov: ## Run tests with coverage
	cd backend && npm run test:cov

lint: ## Lint backend code
	cd backend && npm run lint

format: ## Format all code with Prettier
	cd backend && npm run format

# === Database ===

migrate: ## Run Prisma migrations
	cd backend && npx prisma migrate dev

seed: ## Seed the database
	cd backend && npx prisma db seed

studio: ## Open Prisma Studio
	cd backend && npx prisma studio

# === Cleanup ===

clean: ## Remove all containers, volumes, and node_modules
	docker compose down -v --remove-orphans
	rm -rf backend/node_modules backend/dist
	rm -rf frontend/node_modules frontend/dist frontend/.angular
	@echo "🧹 Cleaned!"
