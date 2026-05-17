FROM node:22-alpine
WORKDIR /app

# Copy workspace dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy shared library
COPY services/shared ./services/shared

# Copy the service code
COPY services/energy-service ./services/energy-service

WORKDIR /app/services/energy-service
EXPOSE 4020

CMD ["node", "index.js"]
