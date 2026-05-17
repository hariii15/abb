import { Router } from "express";

const router = Router();

// In-memory data store
let users = [
  { id: "1", name: "Aarav Sharma", role: "student", email: "aarav@campus.edu", created_at: new Date().toISOString() },
  { id: "2", name: "Priya Patel", role: "student", email: "priya@campus.edu", created_at: new Date().toISOString() },
  { id: "3", name: "Rahul Gupta", role: "student", email: "rahul@campus.edu", created_at: new Date().toISOString() },
  { id: "4", name: "Admin User", role: "admin", email: "admin@campus.edu", created_at: new Date().toISOString() },
];

/* ── GET /users ─────────────────────────────────────────────────────── */
router.get("/users", (_req, res) => {
  res.json({ items: users.sort((a, b) => a.name.localeCompare(b.name)) });
});

/* ── POST /users/sync ───────────────────────────────────────────────── */
router.post("/users/sync", (req, res) => {
  const uid = req.headers["x-user-uid"] || req.body?.uid || "anonymous";
  const email = req.headers["x-user-email"] || req.body?.email || "";

  let user = users.find(u => u.id === uid);

  if (!user) {
    user = {
      id: uid,
      name: email.split("@")[0] || "User",
      role: "student",
      email,
      created_at: new Date().toISOString(),
    };
    users.push(user);
  } else {
    user.email = email;
  }

  res.json({ ok: true });
});

export { router as usersRouter, users };
