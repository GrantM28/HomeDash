import { fetchJson } from "./fetchJson.js";

function buildImmichBase(base) {
  if (!base) return null;
  return base.replace(/\/$/, "");
}

function buildImmichCandidates(base) {
  const clean = buildImmichBase(base);
  if (!clean) return [];

  const isFullPing =
    /\/api\/server\/ping$/i.test(clean) ||
    /\/api\/server-info\/ping$/i.test(clean) ||
    /\/server-info\/ping$/i.test(clean);
  if (isFullPing) {
    return [clean];
  }

  const hasApiSuffix = /\/api$/i.test(clean);
  if (hasApiSuffix) {
    return [`${clean}/server/ping`, `${clean}/server-info/ping`, `${clean}/server-info`, `${clean}/ping`];
  }

  return [`${clean}/api/server/ping`, `${clean}/api/server-info/ping`, `${clean}/server-info/ping`, `${clean}/api/ping`, `${clean}/ping`];
}

function authHeaders(apiKey) {
  return apiKey ? { "x-api-key": apiKey } : undefined;
}

function withApiKey(url, apiKey) {
  if (!apiKey) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}apiKey=${encodeURIComponent(apiKey)}`;
}

async function fetchWithApiKeyFallback(url, apiKey, timeoutMs) {
  let r = await fetchJson(url, { timeoutMs, headers: authHeaders(apiKey) });
  if (!r.ok && [401, 403].includes(r.status) && apiKey) {
    r = await fetchJson(withApiKey(url, apiKey), { timeoutMs });
  }
  return r;
}

export async function fetchImmichHealth(base, apiKey, timeoutMs = 3500) {
  const candidates = buildImmichCandidates(base);
  if (!candidates.length) {
    return { ok: false, status: 0, data: null, url: null, note: "IMMICH_URL not set" };
  }

  let last = { ok: false, status: 0, data: null, url: candidates[0], error: "no response" };
  for (const url of candidates) {
    const r = await fetchWithApiKeyFallback(url, apiKey, timeoutMs);
    if (r.ok) {
      return { ...r, url, note: "connected" };
    }
    last = { ...r, url };
    if ([401, 403].includes(r.status)) {
      return { ...r, url, ok: true, note: "connected (auth required)" };
    }
  }

  return last;
}

export async function fetchImmichStats(base, apiKey, timeoutMs = 2500) {
  const clean = buildImmichBase(base);
  if (!clean) {
    return {
      ok: false,
      status: 0,
      url: null,
      stats: { version: null, photos: null, videos: null }
    };
  }

  const apiRoot = /\/api$/i.test(clean) ? clean : `${clean}/api`;

  const versionCandidates = [`${apiRoot}/server/version`, `${apiRoot}/server-info/version`];
  let versionRes = { ok: false, status: 0, data: null };
  let versionUrl = versionCandidates[0];

  for (const candidate of versionCandidates) {
    versionUrl = candidate;
    versionRes = await fetchWithApiKeyFallback(candidate, apiKey, timeoutMs);
    if (versionRes.ok) break;
  }

  let version = null;
  if (versionRes.ok) {
    version =
      versionRes.data?.version ||
      [versionRes.data?.major, versionRes.data?.minor, versionRes.data?.patch]
        .filter((v) => typeof v !== "undefined" && v !== null)
        .join(".") ||
      null;
  }

  const statsCandidates = [`${apiRoot}/server/statistics`, `${apiRoot}/server-info/statistics`];
  let statsRes = { ok: false, status: 0, data: null };
  let statsUrl = statsCandidates[0];

  for (const candidate of statsCandidates) {
    statsUrl = candidate;
    statsRes = await fetchWithApiKeyFallback(candidate, apiKey, timeoutMs);
    if (statsRes.ok) break;
  }

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
