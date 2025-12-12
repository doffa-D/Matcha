.PHONY: build up down stop logs shell db-shell restart clean rebuild sync-env db-migrate

# Sync backend/.env to root .env for docker-compose variable substitution only
# Note: The actual .env file is backend/.env, root .env is temporary for docker-compose
sync-env:
	@powershell -Command "if (Test-Path 'backend\.env') { Copy-Item -Path 'backend\.env' -Destination '.env' -Force; Write-Host 'Synced backend/.env to root .env for docker-compose' } else { Write-Host 'ERROR: backend/.env not found!' ; exit 1 }"

# Build Docker images
build: sync-env
	docker-compose build

# Start containers in detached mode
up: sync-env
	docker compose up --build -d

# Stop, rebuild, and start containers
rebuild: sync-env
	docker-compose down
	docker-compose build
	docker-compose up -d

# Stop and remove containers
down: sync-env
	docker-compose down

# Stop containers without removing
stop: sync-env
	docker-compose stop

# View container logs
logs:
	docker-compose logs -f

# View backend logs only
logs-backend:
	docker-compose logs -f backend

# View postgres logs only
logs-db:
	docker-compose logs -f postgres

# Access backend container shell
shell:
	docker-compose exec backend /bin/bash

# Access PostgreSQL shell
db-shell:
	docker-compose exec postgres psql -U $$(docker-compose exec -T postgres printenv POSTGRES_USER | tr -d '\r') -d $$(docker-compose exec -T postgres printenv POSTGRES_DB | tr -d '\r')

# Restart containers
restart: sync-env
	docker-compose restart

# Clean up containers, volumes, and images
clean: sync-env
	docker-compose down -v --rmi all

# Start containers and show logs
start: sync-env
	docker-compose up

# Run database migrations
db-migrate: sync-env
	.\venv\Scripts\python.exe backend\scripts\migrate.py