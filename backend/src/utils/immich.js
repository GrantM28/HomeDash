import { fetchJson } from "./fetchJson.js";

function buildImmichPingUrl(base) {
  if (!base) return null;

  const clean = base.replace(/\/$/, "");

  if (/\/api\/server-info\/ping$/i.test(clean)) {
    return clean;
  }

  return `${clean}/api/server-info/ping`;
}

export async function fetchImmichHealth(base, apiKey, timeoutMs = 2000) {
  const url = buildImmichPingUrl(base);
  if (!url) {
    return { ok: false, status: 0, data: null, url: null, note: "IMMICH_URL not set" };
  }

  const headers = apiKey ? { "x-api-key": apiKey } : undefined;
  const r = await fetchJson(url, { timeoutMs, headers });

  if (!r.ok) {
    return { ...r, url };
  }

  return { ...r, url, note: "connected" };
}
