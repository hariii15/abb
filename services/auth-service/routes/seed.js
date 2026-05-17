import { Router } from "express";

const router = Router();

/* ── POST /seed ─────────────────────────────────────────────────────── */
router.post("/seed", (_req, res) => {
  // Since we are using in-memory arrays and pre-seeding them in their respective 
  // route files on startup, we no longer need a complex seed script.
  console.log("[auth] Seed requested — using in-memory data.");
  res.json({ ok: true, message: "In-memory data is ready." });
});

export { router as seedRouter };
