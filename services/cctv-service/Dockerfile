FROM node:22-alpine
WORKDIR /app

# Copy workspace dependencies
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy shared library
COPY services/shared ./services/shared

# Copy the service code
COPY services/cctv-service ./services/cctv-service

WORKDIR /app/services/cctv-service
EXPOSE 4030

CMD ["node", "index.js"]
