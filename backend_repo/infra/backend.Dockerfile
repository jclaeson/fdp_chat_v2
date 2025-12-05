FROM python:3.11-slim

WORKDIR /app
COPY apps/backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/backend /app
COPY apps/ingest /app/ingest
COPY vector_store /app/vector_store

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
