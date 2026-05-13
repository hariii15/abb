FROM node:22-alpine AS build

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Used only when Next resolves rewrites on the server (Docker network DNS).
ARG CAMPUS_API_INTERNAL_URL=http://campus-api:8000
ENV CAMPUS_API_INTERNAL_URL=$CAMPUS_API_INTERNAL_URL

RUN npm run build \
  && npm prune --omit=dev

FROM node:22-alpine AS run

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]
