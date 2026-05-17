FROM node:22-alpine
WORKDIR /app

# Copy workspace dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy shared library
COPY services/shared ./services/shared

# Copy the service code
COPY services/notification-service ./services/notification-service

WORKDIR /app/services/notification-service
EXPOSE 4040

CMD ["node", "index.js"]
