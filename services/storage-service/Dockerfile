FROM node:22-alpine
WORKDIR /app

# Copy workspace dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy shared library
COPY services/shared ./services/shared

# Copy the service code
COPY services/storage-service ./services/storage-service

WORKDIR /app/services/storage-service
EXPOSE 4050

CMD ["node", "index.js"]
