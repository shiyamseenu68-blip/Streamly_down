FROM python:3.11-slim

WORKDIR /app

# Install system dependencies: ffmpeg, git, curl, and Node.js 20.x for JS challenge solving & PO token generation
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Clone and build official bgutil PO Token Provider HTTP server
RUN git clone https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git /opt/bgutil-server && \
    cd /opt/bgutil-server/server && \
    npm install && \
    npx tsc

# Install Python dependencies including yt-dlp & bgutil-ytdlp-pot-provider plugin
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI application files and startup script
COPY . .
RUN chmod +x /app/start.sh

EXPOSE 10000

ENTRYPOINT ["/app/start.sh"]
