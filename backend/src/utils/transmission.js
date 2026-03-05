function buildTransmissionRpcUrl(base) {
  if (!base) return null;

  const clean = base.replace(/\/$/, "");

  if (/\/transmission\/rpc$/i.test(clean)) {
    return clean;
  }

  return `${clean}/transmission/rpc`;
}

export async function fetchTransmissionHealth(base, timeoutMs = 2000) {
  const url = buildTransmissionRpcUrl(base);
  if (!url) {
    return { ok: false, status: 0, data: null, url: null, note: "TRANSMISSION_URL not set" };
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "session-get" }),
      signal: controller.signal
    });

    const reachable = [200, 401, 403, 409].includes(res.status);

    return {
      ok: reachable,
      status: res.status,
      data: null,
      url,
      note: reachable ? "connected" : `offline (${res.status})`
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      url,
      error: error?.name === "AbortError" ? "timeout" : String(error)
    };
  } finally {
    clearTimeout(t);
  }
}
