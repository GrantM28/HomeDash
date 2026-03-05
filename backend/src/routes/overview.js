import { Router } from "express";

const router = Router();

// This is your future "one endpoint to rule them all".
// For now it returns placeholders so the frontend has a stable shape.
router.get("/", async (req, res) => {
  res.json({
    ok: true,
    services: {
      glances: { ok: false, note: "not wired yet" },
      jellyfin: { ok: false, note: "not wired yet" },
      immich: { ok: false, note: "not wired yet" },
      transmission: { ok: false, note: "not wired yet" },
      syncthing: { ok: false, note: "not wired yet" },
      ollama: { ok: false, note: "not wired yet" }
    }
  });
});

export default router;