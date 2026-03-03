FROM node:22-slim

WORKDIR /app

# Install required system dependencies for Prisma and native modules
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm ci --prefer-offline

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the app
CMD [ "npm", "start" ]
