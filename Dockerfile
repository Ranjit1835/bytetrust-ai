# ByteTrust AI — Node.js + Python runtime
FROM node:20-slim

# Install Python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && ln -sf /usr/bin/python3 /usr/bin/python \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
