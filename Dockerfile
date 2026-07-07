# ---- build the frontend ----
FROM node:20-alpine AS frontend
WORKDIR /app
COPY frontend/package.json .
RUN npm install
COPY frontend/ .
RUN npm run build

# ---- runtime: python backend + nginx in one image ----
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg nginx supervisor \
    && rm -rf /var/lib/apt/lists/*

# install uv and backend deps (installed to system, no venv)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY backend/pyproject.toml .
RUN uv pip install --system -r pyproject.toml

# backend source
COPY backend/main.py backend/models.py ./
COPY backend/use_cases/ ./use_cases/

# frontend static build + nginx config
COPY --from=frontend /app/dist /usr/share/nginx/html
RUN rm -f /etc/nginx/sites-enabled/default
COPY nginx.conf /etc/nginx/conf.d/default.conf

# run both processes under supervisord
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
