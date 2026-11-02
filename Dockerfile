# Multi-stage Dockerfile for FastAPI Backend & Ingestion Worker on Railway / Container Hosts
FROM python:3.12-slim AS builder

WORKDIR /build
COPY apps/api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt --target /build/deps

FROM python:3.12-slim AS runtime

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app:/app/deps

# Create non-root user
RUN groupadd -g 1000 appgroup && \
    useradd -u 1000 -g appgroup -s /bin/bash -m appuser && \
    mkdir -p /app/data/storage && \
    chown -R appuser:appgroup /app

COPY --from=builder /build/deps /app/deps
COPY apps/api /app

USER appuser

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
