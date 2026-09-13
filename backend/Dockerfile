FROM python:3.11-slim

LABEL org.opencontainers.image.source="https://github.com/kefe3/nexus"
LABEL org.opencontainers.image.description="Nexus AI Studio Backend API Container"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    procps \
    curl \
    ca-certificates \
    wget \
    && curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared \
    && chmod +x /usr/local/bin/cloudflared \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8500

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port 8500 --reload --reload-dir /app"]


