FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

# install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# copy project files
COPY pyproject.toml .

# install deps with uv (no venv, install to system)
RUN uv pip install --system -r pyproject.toml

COPY main.py models.py ./
COPY use_cases/ ./use_cases/

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
