FROM node:22-alpine
WORKDIR /app

# Copy workspace dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy shared library
COPY services/shared ./services/shared

# Copy the service code
COPY services/auth-service ./services/auth-service

WORKDIR /app/services/auth-service
EXPOSE 4010

CMD ["node", "index.js"]
