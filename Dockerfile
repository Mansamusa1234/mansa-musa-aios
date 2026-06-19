# Mansa Musa AI OS — production image (API + scheduler share this image)
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install deps first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY backend ./backend
COPY config ./config
COPY scheduler ./scheduler
COPY db ./db
# Frontend (served by the backend at /app and /web — same origin, no CORS/DNS needed)
COPY dashboard ./dashboard
COPY site ./site

EXPOSE 8000

# Default command runs the API. The scheduler service overrides this (see compose/render).
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
