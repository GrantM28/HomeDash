import { fetchJson } from "./fetchJson.js";

function buildSyncthingBase(base) {
  if (!base) return null;
  return base.replace(/\/$/, "");
}

export async function fetchSyncthingHealth(base, apiKey, timeoutMs = 2000) {
  const clean = buildSyncthingBase(base);
  if (!clean) {
    return { ok: false, status: 0, data: null, url: null, note: "SYNCTHING_URL not set" };
  }

  const noAuthUrl = `${clean}/rest/noauth/health`;
  const noAuth = await fetchJson(noAuthUrl, { timeoutMs });
  if (noAuth.ok) {
    return { ...noAuth, url: noAuthUrl, note: "connected" };
  }

  const pingUrl = `${clean}/rest/system/ping`;
  const headers = apiKey ? { "X-API-Key": apiKey } : undefined;
  const ping = await fetchJson(pingUrl, { timeoutMs, headers });

  if (ping.ok) {
    return { ...ping, url: pingUrl, note: "connected" };
  }

  return { ...ping, url: pingUrl };
}
