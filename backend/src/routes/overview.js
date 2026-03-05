import { Router } from "express";
import { fetchGlancesAll } from "../utils/glances.js";
import { fetchJellyfinHealth } from "../utils/jellyfin.js";

const router = Router();

router.get("/", async (req, res) => {
  const services = {
    glances: { ok: false, note: "GLANCES_URL not set" },
    jellyfin: { ok: false, note: "JELLYFIN_URL not set" },
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

  const jellyfinBase = process.env.JELLYFIN_URL;
  const jellyfinApiKey = process.env.JELLYFIN_API_KEY;
  if (jellyfinBase) {
    const r = await fetchJellyfinHealth(jellyfinBase, jellyfinApiKey, 2000);
    services.jellyfin = r.ok
      ? { ok: true, note: r.note }
      : { ok: false, note: `offline (${r.status || "no response"})` };
  }

  res.json({ ok: true, services });
});

export default router;
