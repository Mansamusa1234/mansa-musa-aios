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

# Public frontend. The optional command-center dashboard is mounted by the
# backend only when a dashboard directory is present, so do not make the
# production image fail when that optional directory is absent from the repo.
COPY site ./site

EXPOSE 8000

# Default command runs the API. The scheduler service can override this.
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
