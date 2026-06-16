# JSON Token Analyzer

# ── Docker (prod) ──────────────────────────────────────────
# Build and start all services (optional port, default 3000)
up port="3000":
    PORT={{port}} docker compose up --build -d
    @echo "→ http://localhost:{{port}}"

# Stop all services
down:
    docker compose down

# Tail logs
logs:
    docker compose logs -f

# Rebuild images without cache
rebuild:
    docker compose build --no-cache

# ── Local dev ──────────────────────────────────────────────
# Start backend locally with uv (hot-reload)
dev-backend:
    cd backend && uv run uvicorn main:app --reload --port 8000

# Start frontend dev server (proxies /analyze → localhost:8000)
dev-frontend:
    cd frontend && npm install && npm run dev

# Install frontend deps
install:
    cd frontend && npm install

# Build frontend for production
build-frontend:
    cd frontend && npm run build

# ── Misc ───────────────────────────────────────────────────
# Quick health check
health:
    curl -s http://localhost:8000/health | python3 -m json.tool
