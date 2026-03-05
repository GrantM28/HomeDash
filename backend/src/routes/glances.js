import { Router } from "express";
import { fetchGlancesAll } from "../utils/glances.js";

const router = Router();

function round(n, d = 0) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  const m = 10 ** d;
  return Math.round(x * m) / m;
}

router.get("/summary", async (req, res) => {
  const base = process.env.GLANCES_URL;
  if (!base) {
    return res.json({ ok: false, note: "GLANCES_URL not set" });
  }

  const r = await fetchGlancesAll(base, 3000);

  if (!r.ok) {
    return res.json({
      ok: false,
      note: `Failed to reach Glances (${r.status || "no response"})`,
      error: r.error,
      url: r.url
    });
  }

  const all = r.data || {};

  const cpuTotal =
    all.cpu?.total ??
    all.cpu?.total_usage ??
    all.cpu?.percent ??
    null;

  const memPercent =
    all.mem?.percent ??
    (all.mem?.used && all.mem?.total ? (all.mem.used / all.mem.total) * 100 : null);

  const load = all.load
    ? {
        "1m": all.load.min1 ?? all.load["1min"] ?? all.load["1m"] ?? null,
        "5m": all.load.min5 ?? all.load["5min"] ?? all.load["5m"] ?? null,
        "15m": all.load.min15 ?? all.load["15min"] ?? all.load["15m"] ?? null
      }
    : null;

  const uptimeSeconds = all.uptime?.seconds ?? all.uptime ?? null;

  let netRx = 0;
  let netTx = 0;
  let netFound = false;
  const nets = all.network;
  if (Array.isArray(nets)) {
    for (const i of nets) {
      const rx = Number(i?.rx ?? i?.rx_rate ?? i?.bytes_recv_rate ?? 0);
      const tx = Number(i?.tx ?? i?.tx_rate ?? i?.bytes_sent_rate ?? 0);
      if (Number.isFinite(rx) || Number.isFinite(tx)) {
        netRx += rx || 0;
        netTx += tx || 0;
        netFound = true;
      }
    }
  } else if (nets && typeof nets === "object") {
    for (const k of Object.keys(nets)) {
      const i = nets[k];
      const rx = Number(i?.rx ?? i?.rx_rate ?? i?.bytes_recv_rate ?? 0);
      const tx = Number(i?.tx ?? i?.tx_rate ?? i?.bytes_sent_rate ?? 0);
      if (Number.isFinite(rx) || Number.isFinite(tx)) {
        netRx += rx || 0;
        netTx += tx || 0;
        netFound = true;
      }
    }
  }

  let diskBest = null;
  const fsList = all.fs;
  if (Array.isArray(fsList) && fsList.length) {
    for (const fs of fsList) {
      const p = Number(fs?.percent ?? fs?.used_percent ?? null);
      if (!Number.isFinite(p)) continue;
      if (!diskBest || p > diskBest.percent) {
        diskBest = {
          mount: fs?.mnt_point ?? fs?.mountpoint ?? fs?.mount ?? fs?.device ?? "disk",
          percent: p
        };
      }
    }
  }

  res.json({
    ok: true,
    url: r.url,
    cpu: { percent: round(cpuTotal, 1) },
    mem: { percent: round(memPercent, 1) },
    load: load
      ? {
          "1m": round(load["1m"], 2),
          "5m": round(load["5m"], 2),
          "15m": round(load["15m"], 2)
        }
      : null,
    uptime: { seconds: uptimeSeconds },
    net: netFound ? { rx: round(netRx, 2), tx: round(netTx, 2) } : null,
    disk: diskBest ? { mount: diskBest.mount, percent: round(diskBest.percent, 1) } : null
  });
});

export default router;
