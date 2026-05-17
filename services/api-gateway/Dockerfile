FROM node:22-alpine
WORKDIR /app

# Copy workspace dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy shared library
COPY services/shared ./services/shared

# Copy the service code
COPY services/api-gateway ./services/api-gateway

WORKDIR /app/services/api-gateway
EXPOSE 4000

CMD ["node", "index.js"]
