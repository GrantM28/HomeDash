import { Router } from "express";
import { fetchJellyfinStats } from "../utils/jellyfin.js";
import { fetchImmichStats } from "../utils/immich.js";
import { fetchTransmissionStats } from "../utils/transmission.js";
import { fetchSyncthingStats } from "../utils/syncthing.js";

const router = Router();

router.get("/", async (req, res) => {
  const activity = {
    jellyfin: { sessions: null, playing: null },
    immich: { version: null, photos: null, videos: null },
    transmission: { downKbps: null, upKbps: null, activeTorrents: null, totalTorrents: null },
    syncthing: { connectedPeers: null, totalPeers: null, inSyncBytes: null }
  };

  const jellyfinBase = process.env.JELLYFIN_URL;
  if (jellyfinBase) {
    const r = await fetchJellyfinStats(jellyfinBase, process.env.JELLYFIN_API_KEY, 2500);
    if (r.ok) {
      activity.jellyfin = r.stats;
    }
  }

  const immichBase = process.env.IMMICH_URL;
  if (immichBase) {
    const r = await fetchImmichStats(immichBase, process.env.IMMICH_API_KEY, 2500);
    if (r.ok) {
      activity.immich = r.stats;
    }
  }

  const transmissionBase = process.env.TRANSMISSION_URL;
  if (transmissionBase) {
    const r = await fetchTransmissionStats(transmissionBase, 2500);
    if (r.ok) {
      activity.transmission = r.stats;
    }
  }

  const syncthingBase = process.env.SYNCTHING_URL;
  if (syncthingBase) {
    const r = await fetchSyncthingStats(syncthingBase, process.env.SYNCTHING_API_KEY, 2500);
    if (r.ok) {
      activity.syncthing = r.stats;
    }
  }

  res.json({ ok: true, activity, updatedAt: new Date().toISOString() });
});

export default router;
