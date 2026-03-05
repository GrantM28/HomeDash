import { fetchJson } from "./fetchJson.js";

function buildImmichPingUrl(base) {
  if (!base) return null;

  const clean = base.replace(/\/$/, "");

  if (/\/api\/server-info\/ping$/i.test(clean)) {
    return clean;
  }

  return `${clean}/api/server-info/ping`;
}

function buildImmichBase(base) {
  if (!base) return null;
  return base.replace(/\/$/, "");
}

function authHeaders(apiKey) {
  return apiKey ? { "x-api-key": apiKey } : undefined;
}

export async function fetchImmichHealth(base, apiKey, timeoutMs = 2000) {
  const url = buildImmichPingUrl(base);
  if (!url) {
    return { ok: false, status: 0, data: null, url: null, note: "IMMICH_URL not set" };
  }

  const r = await fetchJson(url, { timeoutMs, headers: authHeaders(apiKey) });

  if (!r.ok) {
    return { ...r, url };
  }

  return { ...r, url, note: "connected" };
}

export async function fetchImmichStats(base, apiKey, timeoutMs = 2000) {
  const clean = buildImmichBase(base);
  if (!clean) {
    return {
      ok: false,
      status: 0,
      url: null,
      stats: { version: null, photos: null, videos: null }
    };
  }

  const headers = authHeaders(apiKey);

  const versionUrl = `${clean}/api/server-info/version`;
  const versionRes = await fetchJson(versionUrl, { timeoutMs, headers });

  let version = null;
  if (versionRes.ok) {
    version =
      versionRes.data?.version ||
      [versionRes.data?.major, versionRes.data?.minor, versionRes.data?.patch]
        .filter((v) => typeof v !== "undefined" && v !== null)
        .join(".") ||
      null;
  }

  const statsUrl = `${clean}/api/server-info/statistics`;
  const statsRes = await fetchJson(statsUrl, { timeoutMs, headers });

  const photos = statsRes.ok ? (statsRes.data?.photos ?? statsRes.data?.images ?? null) : null;
  const videos = statsRes.ok ? (statsRes.data?.videos ?? null) : null;

  return {
    ok: versionRes.ok || statsRes.ok,
    status: versionRes.ok ? versionRes.status : statsRes.status,
    url: versionRes.ok ? versionUrl : statsUrl,
    stats: {
      version,
      photos,
      videos
    }
  };
}
