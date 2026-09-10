# Mansa Musa AI OS — production image (API + scheduler share this image)
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1

WORKDIR /app

# Free local video rendering engine + font used by the Video Studio.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Install deps first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY backend ./backend
COPY config ./config
COPY scheduler ./scheduler
COPY db ./db

# Public frontend and command-center dashboard
COPY site ./site
COPY dashboard ./dashboard

EXPOSE 8000

# Default command runs the API. The scheduler service can override this.
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
