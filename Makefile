.PHONY: build up down stop logs shell db-shell restart clean rebuild db-migrate db-seed fresh \
        frontend-install frontend-dev frontend-build frontend-logs

# Docker compose with env file
DC = docker-compose --env-file ./backend/.env

# Build Docker images
build:
	$(DC) build

# Start all containers in detached mode
up:
	$(DC) up --build -d

# Start only backend and database (no frontend)
up-backend:
	$(DC) up --build -d postgres backend

# Stop, rebuild, and start containers
rebuild:
	$(DC) down
	$(DC) build
	$(DC) up -d

# Stop and remove containers
down:
	$(DC) down

# Stop containers without removing
stop:
	$(DC) stop

# View all container logs
logs:
	$(DC) logs -f

# View backend logs only
logs-backend:
	$(DC) logs -f backend

# View frontend logs only
logs-frontend:
	$(DC) logs -f frontend

# View postgres logs only
logs-db:
	$(DC) logs -f postgres

# Access backend container shell
shell:
	$(DC) exec backend /bin/bash

# Access frontend container shell
shell-frontend:
	$(DC) exec frontend /bin/sh

# Access PostgreSQL shell
db-shell:
	$(DC) exec postgres psql -U $$($(DC) exec -T postgres printenv POSTGRES_USER | tr -d '\r') -d $$($(DC) exec -T postgres printenv POSTGRES_DB | tr -d '\r')

# Restart all containers
restart:
	$(DC) restart

# Restart frontend only
restart-frontend:
	$(DC) restart frontend

# Clean up containers, volumes, and images
clean:
	$(DC) down -v --rmi all

# Start containers and show logs
start:
	$(DC) up

# Run database migrations
db-migrate:
	python backend/scripts/migrate.py

# Seed the database with fake data
db-seed:
	python backend/scripts/seed.py --count 100 --clear

# Fresh start: remove containers and volumes, rebuild, migrate, and seed
fresh:
	$(DC) down -v --remove-orphans
	docker volume rm matcha_postgres_data 2>/dev/null || echo "Volume already removed"
	$(DC) up --build -d
	@echo "Waiting for database to be ready..."
	@sleep 5
	docker exec matcha_backend python scripts/migrate.py
	docker exec matcha_backend python scripts/seed.py --count 500 --clear
	@echo "Fresh start complete!"

# --- Frontend local development (without Docker) ---

# Install frontend dependencies locally
frontend-install:
	cd frontend && pnpm install

# Run frontend dev server locally
frontend-dev:
	cd frontend && pnpm dev

# Build frontend for production locally
frontend-build:
	cd frontend && pnpm build

# Format frontend code
frontend-format:
	cd frontend && pnpm format