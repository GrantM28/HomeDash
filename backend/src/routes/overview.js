import { Router } from "express";
import { fetchJson } from "../utils/fetchJson.js";

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
    const url = `${glancesBase.replace(/\/$/, "")}/api/3/all`;
    const r = await fetchJson(url, { timeoutMs: 2000 });
    services.glances = r.ok
      ? { ok: true, note: "connected" }
      : { ok: false, note: `offline (${r.status})` };
  }

  res.json({ ok: true, services });
});

export default router;