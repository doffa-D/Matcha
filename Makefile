.PHONY: build up down stop logs shell db-shell restart clean rebuild db-migrate db-seed fresh \
        frontend-install frontend-dev frontend-build frontend-logs

# Build Docker images
build:
	docker-compose build

# Start all containers in detached mode
up:
	docker-compose up --build -d

# Start only backend and database (no frontend)
up-backend:
	docker-compose up --build -d postgres backend

# Stop, rebuild, and start containers
rebuild:
	docker-compose down
	docker-compose build
	docker-compose up -d

# Stop and remove containers
down:
	docker-compose down

# Stop containers without removing
stop:
	docker-compose stop

# View all container logs
logs:
	docker-compose logs -f

# View backend logs only
logs-backend:
	docker-compose logs -f backend

# View frontend logs only
logs-frontend:
	docker-compose logs -f frontend

# View postgres logs only
logs-db:
	docker-compose logs -f postgres

# Access backend container shell
shell:
	docker-compose exec backend /bin/bash

# Access frontend container shell
shell-frontend:
	docker-compose exec frontend /bin/sh

# Access PostgreSQL shell
db-shell:
	docker-compose exec postgres psql -U $$(docker-compose exec -T postgres printenv POSTGRES_USER | tr -d '\r') -d $$(docker-compose exec -T postgres printenv POSTGRES_DB | tr -d '\r')

# Restart all containers
restart:
	docker-compose restart

# Restart frontend only
restart-frontend:
	docker-compose restart frontend

# Clean up containers, volumes, and images
clean:
	docker-compose down -v --rmi all

# Start containers and show logs
start:
	docker-compose up

# Run database migrations
db-migrate:
	python backend/scripts/migrate.py

# Seed the database with fake data
db-seed:
	python backend/scripts/seed.py --count 100 --clear

# Fresh start: clean everything, rebuild, migrate, and seed
fresh: clean
	docker-compose up --build -d
	@echo "Waiting for database to be ready..."
	@powershell -Command "Start-Sleep -Seconds 5"
	python backend/scripts/migrate.py
	python backend/scripts/seed.py --count 100 --clear
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