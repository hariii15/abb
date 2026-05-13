# Smart Campus — Node microservices

The **browser and Next.js UI only talk to the API gateway** (`services/api-gateway/src/gateway.js`). The gateway forwards or aggregates calls to the services below.

| Service | Port (dev) | Upstream env (gateway) |
|---------|------------|-------------------------|
| **api-gateway** | **4000** | — |
| `auth-service` | 4010 | `AUTH_SERVICE_URL` |
| `energy-service` | 4020 | `ENERGY_SERVICE_URL` |
| `cctv-service` | 4030 | `CCTV_SERVICE_URL` |
| `notification-service` | 4040 | `NOTIFICATION_SERVICE_URL` |
| `storage-service` | 4050 | `STORAGE_SERVICE_URL` |

## Firestore + service account

Place your Firebase **service account JSON** at the repository root with the default name:

`abb-kube-firebase-adminsdk-fbsvc-6a827ed228.json`

(or set `FIREBASE_SERVICE_ACCOUNT_PATH` / `GOOGLE_APPLICATION_CREDENTIALS` to an absolute path).

**Never commit** that JSON file. It is listed in the root `.gitignore`.

When the file is present, each microservice uses **Firestore** collections:

| Collection | Service |
|------------|---------|
| `rooms`, `devices`, `alerts` | storage |
| `attendance_logs` | auth |
| `energy_readings` | energy |
| `cctv_events` | cctv |
| `notifications` | notifications |

If no valid service account is found, services fall back to **in-memory** storage (`persistence: memory` in `/health`).

## Firebase Authentication (web + gateway)

1. In Firebase Console → **Authentication** → Sign-in method: enable **Email/Password** (required for the `/login` page).
2. In Project settings → **Your apps** → add a **Web** app and copy the config into `apps/campus-web/.env.local` as the `NEXT_PUBLIC_FIREBASE_*` variables (see `apps/campus-web/.env.example`). Restart `npm run dev` after editing.
3. The UI redirects unauthenticated users to **`/login`**. After sign-in or registration, the client calls **`POST /users/sync`** on the gateway, which upserts the **`users`** collection in Firestore (`email`, `created_at`, `last_seen_at`, etc.) using the Admin SDK.
4. The **API gateway** verifies `Authorization: Bearer <Firebase ID token>` on all routes except `GET /health` when Admin SDK loads successfully. For local testing without Firebase web config, set **`GATEWAY_SKIP_AUTH=true`** where you start the gateway (not for production).

## Run everything

**Important:** `services/common/firebase-admin.js` is shared by all Node services. Node resolves the `firebase-admin` package from **`e:\abb\node_modules`**, so you must run **`npm install` at the repository root** (not only inside each service). Root `package.json` includes `firebase-admin` and `"type": "module"` so resolution and ESM warnings are correct.

From repo root, install dependencies (root + each app/service), then start:

```bash
npm install
npm install --prefix services/api-gateway
npm install --prefix services/auth-service
npm install --prefix services/energy-service
npm install --prefix services/cctv-service
npm install --prefix services/notification-service
npm install --prefix services/storage-service
npm install --prefix apps/campus-web
npm run dev:campus
```

`dev:campus` uses `npx concurrently` so the `concurrently` CLI resolves from the root `node_modules` after `npm install` at the repo root.

- UI: `http://localhost:3000` → `/api/backend/*` rewrites to `http://127.0.0.1:4000/*` (gateway).
- Gateway health: `http://127.0.0.1:4000/health`

## AI platform (later)

Python services will sit behind their own gateway routes or a separate edge entry; they will not replace these Node campus services.
