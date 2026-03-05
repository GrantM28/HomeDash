import { Router } from "express";
import { fetchGlancesAll } from "../utils/glances.js";

const router = Router();

router.get("/", async (req, res) => {
  const services = {
    glances: { ok: false, note: "GLANCES_URL not set" },
    jellyfin: { ok: false, note: "not wired yet" },
    immich: { ok: false, note: "not wired yet" },
    transmission: { ok: false, note: "not wired yet" },
    syncthing: { ok: false, note: "not wired yet" },
    ollama: { ok: false, note: "not wired yet" }
  };

  const glancesBase = process.env.GLANCES_URL;
  if (glancesBase) {
    const r = await fetchGlancesAll(glancesBase, 2000);
    services.glances = r.ok
      ? { ok: true, note: "connected" }
      : { ok: false, note: `offline (${r.status || "no response"})` };
  }

  res.json({ ok: true, services });
});

export default router;
