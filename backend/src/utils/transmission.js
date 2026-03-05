function buildTransmissionRpcUrl(base) {
  if (!base) return null;

  const clean = base.replace(/\/$/, "");

  if (/\/transmission\/rpc$/i.test(clean)) {
    return clean;
  }

  return `${clean}/transmission/rpc`;
}

function buildAuthHeader(username, password) {
  if (!username && !password) return null;
  const raw = `${username || ""}:${password || ""}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

async function transmissionRpc(url, payload, timeoutMs = 2000, authHeader = null) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const baseHeaders = {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {})
    };

    let res = await fetch(url, {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (res.status === 409) {
      const sessionId = res.headers.get("X-Transmission-Session-Id");
      if (sessionId) {
        res = await fetch(url, {
          method: "POST",
          headers: { ...baseHeaders, "X-Transmission-Session-Id": sessionId },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
      }
    }

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    return {
      ok: res.ok,
      status: res.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: error?.name === "AbortError" ? "timeout" : String(error)
    };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchTransmissionHealth(base, options = {}) {
  const timeoutMs = options.timeoutMs ?? 2000;
  const authHeader = buildAuthHeader(options.username, options.password);
  const url = buildTransmissionRpcUrl(base);
  if (!url) {
    return { ok: false, status: 0, data: null, url: null, note: "TRANSMISSION_URL not set" };
  }

  const r = await transmissionRpc(url, { method: "session-get" }, timeoutMs, authHeader);

  const reachable = r.ok || [401, 403, 409].includes(r.status);
  const authRequired = [401, 403].includes(r.status);

  return {
    ...r,
    ok: reachable,
    url,
    note: authRequired ? "connected (auth required)" : reachable ? "connected" : `offline (${r.status || "no response"})`
  };
}

export async function fetchTransmissionStats(base, options = {}) {
  const timeoutMs = options.timeoutMs ?? 2000;
  const authHeader = buildAuthHeader(options.username, options.password);
  const url = buildTransmissionRpcUrl(base);
  if (!url) {
    return {
      ok: false,
      status: 0,
      url: null,
      stats: { downKbps: null, upKbps: null, activeTorrents: null, totalTorrents: null, note: "TRANSMISSION_URL not set" }
    };
  }

  const statsRes = await transmissionRpc(url, { method: "session-stats" }, timeoutMs, authHeader);

  if ([401, 403].includes(statsRes.status)) {
    return {
      ...statsRes,
      ok: true,
      url,
      stats: {
        downKbps: null,
        upKbps: null,
        activeTorrents: null,
        totalTorrents: null,
        note: "auth required (set TRANSMISSION_USERNAME/PASSWORD)"
      }
    };
  }

  if (!statsRes.ok) {
    return {
      ...statsRes,
      url,
      stats: {
        downKbps: null,
        upKbps: null,
        activeTorrents: null,
        totalTorrents: null,
        note: `unavailable (${statsRes.status || "no response"})`
      }
    };
  }

  const args = statsRes.data?.arguments || {};
  const downKbps = Number.isFinite(Number(args.downloadSpeed)) ? Math.round((Number(args.downloadSpeed) / 1024) * 10) / 10 : null;
  const upKbps = Number.isFinite(Number(args.uploadSpeed)) ? Math.round((Number(args.uploadSpeed) / 1024) * 10) / 10 : null;

  return {
    ...statsRes,
    url,
    stats: {
      downKbps,
      upKbps,
      activeTorrents: args.activeTorrentCount ?? null,
      totalTorrents: args.torrentCount ?? null,
      note: "ok"
    }
  };
}
