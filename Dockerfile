# Dockerfile
FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install UV for Python dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy pyproject.toml and uv.lock
COPY pyproject.toml uv.lock ./

# Install Python dependencies using UV
RUN uv sync --frozen --no-cache

# Copy the rest of the application
COPY . .

# Create media directory and set permissions
RUN mkdir -p media staticfiles && \
    chmod -R 755 media staticfiles

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]