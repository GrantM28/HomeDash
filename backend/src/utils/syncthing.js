import { fetchJson } from "./fetchJson.js";

function buildSyncthingBase(base) {
  if (!base) return null;
  return base.replace(/\/$/, "");
}

function authHeaders(apiKey) {
  return apiKey ? { "X-API-Key": apiKey } : undefined;
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
  const ping = await fetchJson(pingUrl, { timeoutMs, headers: authHeaders(apiKey) });

  if (ping.ok) {
    return { ...ping, url: pingUrl, note: "connected" };
  }

  return { ...ping, url: pingUrl };
}

export async function fetchSyncthingStats(base, apiKey, timeoutMs = 2000) {
  const clean = buildSyncthingBase(base);
  if (!clean) {
    return {
      ok: false,
      status: 0,
      url: null,
      stats: { connectedPeers: null, totalPeers: null, inSyncBytes: null }
    };
  }

  const headers = authHeaders(apiKey);

  const connectionsUrl = `${clean}/rest/system/connections`;
  const connectionsRes = await fetchJson(connectionsUrl, { timeoutMs, headers });

  let connectedPeers = null;
  let totalPeers = null;
  let inSyncBytes = null;

  if (connectionsRes.ok) {
    const connections = connectionsRes.data?.connections || {};
    const ids = Object.keys(connections);
    totalPeers = ids.length;
    connectedPeers = ids.filter((id) => !!connections[id]?.connected).length;
    inSyncBytes = ids.reduce((sum, id) => {
      const value = Number(connections[id]?.inBytesTotal ?? 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);
  }

  return {
    ok: connectionsRes.ok,
    status: connectionsRes.status,
    url: connectionsUrl,
    stats: {
      connectedPeers,
      totalPeers,
      inSyncBytes
    }
  };
}
