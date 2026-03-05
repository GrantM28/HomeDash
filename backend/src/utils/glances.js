import { fetchJson } from "./fetchJson.js";

function buildGlancesCandidateUrls(base) {
  if (!base) return [];

  const clean = base.replace(/\/$/, "");

  if (/\/api\/\d+\/all$/i.test(clean)) {
    return [clean];
  }

  if (/\/api\/\d+$/i.test(clean)) {
    return [`${clean}/all`];
  }

  if (/\/api$/i.test(clean)) {
    return [`${clean}/4/all`, `${clean}/3/all`];
  }

  return [`${clean}/api/4/all`, `${clean}/api/3/all`];
}

export async function fetchGlancesAll(base, timeoutMs = 3000) {
  const candidates = buildGlancesCandidateUrls(base);
  let last = { ok: false, status: 0, data: null, url: candidates[0] ?? null };

  for (const url of candidates) {
    const result = await fetchJson(url, { timeoutMs });
    if (result.ok) {
      return { ...result, url };
    }

    last = { ...result, url };
  }

  return last;
}
