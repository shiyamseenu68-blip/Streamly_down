FROM python:3.11-slim

WORKDIR /app

# Install system dependencies: Node.js 20+, ffmpeg, curl, build-essential, git, ca-certificates
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    ffmpeg \
    build-essential \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Clone bgutil-ytdlp-pot-provider repository tag 1.3.2 into /root/bgutil-ytdlp-pot-provider
RUN git clone --branch 1.3.2 --depth 1 https://github.com/Brainicism/bgutil-ytdlp-pot-provider.git /root/bgutil-ytdlp-pot-provider && \
    cd /root/bgutil-ytdlp-pot-provider/server && \
    npm ci && \
    npx tsc && \
    test -f build/main.js && \
    test -f build/generate_once.js

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files into /app
COPY . .

# Make startup script executable
RUN chmod +x /app/start.sh

EXPOSE 10000

ENTRYPOINT ["/app/start.sh"]
