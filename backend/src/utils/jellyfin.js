import { fetchJson } from "./fetchJson.js";

function buildJellyfinInfoUrl(base) {
  if (!base) return null;

  const clean = base.replace(/\/$/, "");

  if (/\/System\/Info\/Public$/i.test(clean)) {
    return clean;
  }

  return `${clean}/System/Info/Public`;
}

function buildJellyfinSessionsUrl(base) {
  if (!base) return null;

  const clean = base.replace(/\/$/, "");

  if (/\/Sessions$/i.test(clean)) {
    return clean;
  }

  return `${clean}/Sessions`;
}

function authHeaders(apiKey) {
  return apiKey ? { "X-Emby-Token": apiKey } : undefined;
}

export async function fetchJellyfinHealth(base, apiKey, timeoutMs = 2000) {
  const url = buildJellyfinInfoUrl(base);
  if (!url) {
    return { ok: false, status: 0, data: null, url: null, note: "JELLYFIN_URL not set" };
  }

  const r = await fetchJson(url, { timeoutMs, headers: authHeaders(apiKey) });

  if (!r.ok) {
    return { ...r, url };
  }

  const name = r.data?.ServerName || r.data?.Name || "Jellyfin";
  const version = r.data?.Version || null;
  const note = version ? `${name} ${version}` : name;

  return { ...r, url, note };
}

export async function fetchJellyfinStats(base, apiKey, timeoutMs = 2000) {
  const url = buildJellyfinSessionsUrl(base);
  if (!url) {
    return {
      ok: false,
      status: 0,
      url: null,
      stats: { sessions: null, playing: null }
    };
  }

  const r = await fetchJson(url, {
    timeoutMs,
    headers: authHeaders(apiKey)
  });

  if (!r.ok) {
    return {
      ...r,
      url,
      stats: { sessions: null, playing: null }
    };
  }

  const sessions = Array.isArray(r.data) ? r.data : [];
  const playing = sessions.filter((s) => !!s?.NowPlayingItem).length;

  return {
    ...r,
    url,
    stats: {
      sessions: sessions.length,
      playing
    }
  };
}
