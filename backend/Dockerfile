# Build context is the repo root (see docker-compose.yml: build.context: .) so this can
# COPY both backend/app and the repo's seed/ directory into the image.
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/app backend/app
COPY seed seed

# Matches the local-dev default (parents[2]/seed relative to backend/app/seed.py) since
# /app/backend/app/seed.py's parents[2] is /app, and seed/ is copied to /app/seed — set
# explicitly here for clarity and so it keeps working if the image layout ever changes.
ENV SEED_DIR=/app/seed

WORKDIR /app/backend
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
