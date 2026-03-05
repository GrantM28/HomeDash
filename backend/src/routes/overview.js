import { Router } from "express";
import { fetchJellyfinHealth } from "../utils/jellyfin.js";
import { fetchImmichHealth } from "../utils/immich.js";
import { fetchGlancesAll } from "../utils/glances.js";
import { fetchSyncthingHealth } from "../utils/syncthing.js";
import { fetchTransmissionHealth } from "../utils/transmission.js";
import { fetchUnraidHealth } from "../utils/unraid.js";

const router = Router();

function offlineNote(result) {
  if (result?.status) {
    return `offline (${result.status})`;
  }

  if (result?.error) {
    const e = String(result.error);
    if (e.toLowerCase().includes("timeout")) {
      return "offline (timeout)";
    }

    const codeMatch = e.match(/\(([A-Z_]+)\)$/);
    if (codeMatch && codeMatch[1]) {
      return `offline (${codeMatch[1]})`;
    }

    return "offline (unreachable)";
  }

  return "offline (no response)";
}

router.get("/", async (req, res) => {
  const services = {
    glances: { ok: false, note: "GLANCES_URL not set" },
    jellyfin: { ok: false, note: "JELLYFIN_URL not set" },
    immich: { ok: false, note: "IMMICH_URL not set" },
    transmission: { ok: false, note: "TRANSMISSION_URL not set" },
    syncthing: { ok: false, note: "SYNCTHING_URL not set" },
    unraid: { ok: false, note: "UNRAID_URL not set" }
  };

  const glancesBase = process.env.GLANCES_URL;
  if (glancesBase) {
    const r = await fetchGlancesAll(glancesBase, 2000);
    services.glances = r.ok
      ? { ok: true, note: "connected" }
      : { ok: false, note: offlineNote(r) };
  }

  const jellyfinBase = process.env.JELLYFIN_URL;
  const jellyfinApiKey = process.env.JELLYFIN_API_KEY;
  if (jellyfinBase) {
    const r = await fetchJellyfinHealth(jellyfinBase, jellyfinApiKey, 2000);
    services.jellyfin = r.ok
      ? { ok: true, note: r.note }
      : { ok: false, note: offlineNote(r) };
  }

  const immichBase = process.env.IMMICH_URL;
  const immichApiKey = process.env.IMMICH_API_KEY;
  if (immichBase) {
    const r = await fetchImmichHealth(immichBase, immichApiKey, 3500);
    services.immich = r.ok
      ? { ok: true, note: r.note }
      : { ok: false, note: offlineNote(r) };
  }

  const transmissionBase = process.env.TRANSMISSION_URL;
  if (transmissionBase) {
    const r = await fetchTransmissionHealth(transmissionBase, {
      timeoutMs: 2000,
      username: process.env.TRANSMISSION_USERNAME,
      password: process.env.TRANSMISSION_PASSWORD
    });
    services.transmission = r.ok
      ? { ok: true, note: r.note }
      : { ok: false, note: offlineNote(r) };
  }

  const syncthingBase = process.env.SYNCTHING_URL;
  const syncthingApiKey = process.env.SYNCTHING_API_KEY;
  if (syncthingBase) {
    const r = await fetchSyncthingHealth(syncthingBase, syncthingApiKey, 2000);
    services.syncthing = r.ok
      ? { ok: true, note: r.note }
      : { ok: false, note: offlineNote(r) };
  }

  const unraidBase = process.env.UNRAID_URL;
  const unraidApiKey = process.env.UNRAID_API_KEY;
  if (unraidBase) {
    const r = await fetchUnraidHealth(unraidBase, unraidApiKey, 2500);
    services.unraid = r.ok
      ? { ok: true, note: r.note ?? "connected" }
      : { ok: false, note: offlineNote(r) };
  }

  res.json({ ok: true, services });
});

export default router;
