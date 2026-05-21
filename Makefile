# SOC Copilot Workbench — common development commands
# Requires GNU Make. On Windows, use Git Bash, WSL, or 'make' via Chocolatey.

.PHONY: dev-backend dev-frontend demo test lint docker-up docker-down help

help:
	@echo ""
	@echo "SOC Copilot Workbench"
	@echo "─────────────────────────────────────────────────"
	@echo "  make dev-backend   Start FastAPI backend (port 8000)"
	@echo "  make dev-frontend  Start Vite frontend  (port 5173)"
	@echo "  make demo          Seed the demo case (backend must be running)"
	@echo "  make test          Run parser unit tests"
	@echo "  make lint          Run Python linter (ruff)"
	@echo "  make docker-up     Start all services via Docker Compose"
	@echo "  make docker-down   Stop Docker Compose services"
	@echo ""

dev-backend:
	cd services/api && uvicorn main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd apps/web && npm run dev

demo:
	pip install requests --quiet
	python scripts/seed_demo.py

test:
	pip install pytest --quiet
	pytest tests/ -v

lint:
	pip install ruff --quiet
	ruff check integrations/ services/api/

docker-up:
	docker compose up --build

docker-down:
	docker compose down
