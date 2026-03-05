import { fetchJson } from "./fetchJson.js";

function buildJellyfinInfoUrl(base) {
  if (!base) return null;

  const clean = base.replace(/\/$/, "");

  if (/\/System\/Info\/Public$/i.test(clean)) {
    return clean;
  }

  return `${clean}/System/Info/Public`;
}

export async function fetchJellyfinHealth(base, apiKey, timeoutMs = 2000) {
  const url = buildJellyfinInfoUrl(base);
  if (!url) {
    return { ok: false, status: 0, data: null, url: null, note: "JELLYFIN_URL not set" };
  }

  const headers = apiKey ? { "X-Emby-Token": apiKey } : undefined;
  const r = await fetchJson(url, { timeoutMs, headers });

  if (!r.ok) {
    return { ...r, url };
  }

  const name = r.data?.ServerName || r.data?.Name || "Jellyfin";
  const version = r.data?.Version || null;
  const note = version ? `${name} ${version}` : name;

  return { ...r, url, note };
}
