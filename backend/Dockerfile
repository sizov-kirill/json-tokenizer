FROM python:3.12-slim

WORKDIR /app

# install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# copy project files
COPY pyproject.toml .

# install deps with uv (no venv, install to system)
RUN uv pip install --system -r pyproject.toml

COPY main.py .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
