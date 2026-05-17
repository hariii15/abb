import { admin } from "../../shared/firebase.js";

/**
 * Firebase Admin JWT verification middleware.
 *
 * - Reads `Authorization: Bearer <token>` or the `x-firebase-token` header.
 * - Verifies the token with Firebase Admin SDK.
 * - Attaches decoded claims as `req.uid`, `req.userEmail`.
 * - Forwards `x-user-uid` and `x-user-email` headers to downstream services.
 *
 * When `GATEWAY_SKIP_AUTH=true`, the middleware passes through without verification
 * (useful for local development without Firebase credentials).
 */
export function authMiddleware(req, res, next) {
  const skipAuth = process.env.GATEWAY_SKIP_AUTH === "true";

  if (skipAuth) {
    req.uid = "dev-user";
    req.userEmail = "dev@localhost";
    req.headers["x-user-uid"] = req.uid;
    req.headers["x-user-email"] = req.userEmail;
    return next();
  }

  const authHeader = req.headers.authorization || req.headers["x-firebase-token"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader || null;

  if (!token) {
    return res.status(401).json({ error: "Missing authentication token" });
  }

  admin
    .auth()
    .verifyIdToken(token)
    .then((decoded) => {
      req.uid = decoded.uid;
      req.userEmail = decoded.email || "";
      // Forward identity to downstream services
      req.headers["x-user-uid"] = decoded.uid;
      req.headers["x-user-email"] = decoded.email || "";
      next();
    })
    .catch((err) => {
      console.error("[gateway] Token verification failed:", err.message);
      res.status(401).json({ error: "Invalid or expired token" });
    });
}
