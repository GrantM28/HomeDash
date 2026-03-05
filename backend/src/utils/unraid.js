function buildUnraidGraphqlUrl(base) {
  if (!base) return null;
  const clean = base.replace(/\/$/, "");
  if (/\/graphql$/i.test(clean)) {
    return clean;
  }
  return `${clean}/graphql`;
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function fetchUnraidGraphQL(base, apiKey, query, timeoutMs = 2500) {
  const url = buildUnraidGraphqlUrl(base);
  if (!url) {
    return { ok: false, status: 0, url: null, data: null, errors: null, error: "UNRAID_URL not set" };
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers = {
      "Content-Type": "application/json",
      ...(apiKey ? { "x-api-key": apiKey } : {})
    };

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
      signal: controller.signal
    });

    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text };
    }

    if (!res.ok) {
      return { ok: false, status: res.status, url, data: null, errors: body?.errors ?? null };
    }

    const hasErrors = Array.isArray(body?.errors) && body.errors.length > 0;

    return {
      ok: !hasErrors,
      status: res.status,
      url,
      data: body?.data ?? null,
      errors: body?.errors ?? null
    };
  } catch (error) {
    const causeCode = error?.cause?.code ? String(error.cause.code) : null;
    return {
      ok: false,
      status: 0,
      url,
      data: null,
      errors: null,
      error: error?.name === "AbortError" ? "timeout" : causeCode ? `${String(error)} (${causeCode})` : String(error)
    };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchUnraidHealth(base, apiKey, timeoutMs = 2500) {
  const query = `query { info { os { distro release } } }`;
  const r = await fetchUnraidGraphQL(base, apiKey, query, timeoutMs);

  if (r.ok) {
    const distro = r.data?.info?.os?.distro;
    const release = r.data?.info?.os?.release;
    const note = distro && release ? `${distro} ${release}` : "connected";
    return { ...r, note };
  }

  if (r.status === 200 && r.errors) {
    const message = String(r.errors[0]?.message || "auth required");
    return { ...r, ok: true, note: `connected (${message})` };
  }

  return r;
}

export async function fetchUnraidStats(base, apiKey, timeoutMs = 3000) {
  const query = `
    query {
      info {
        os {
          distro
          release
          uptime
        }
      }
      array {
        state
        capacity {
          disks {
            free
            used
            total
          }
        }
      }
      dockerContainers {
        id
        state
      }
    }
  `;

  const r = await fetchUnraidGraphQL(base, apiKey, query, timeoutMs);

  const disks = r.data?.array?.capacity?.disks;
  const used = numberOrNull(disks?.used);
  const total = numberOrNull(disks?.total);
  const arrayUsedPercent = used !== null && total ? Math.round((used / total) * 1000) / 10 : null;

  const containers = Array.isArray(r.data?.dockerContainers) ? r.data.dockerContainers : [];
  const dockerTotal = containers.length;
  const dockerRunning = containers.filter((c) => String(c?.state || "").toLowerCase() === "running").length;

  const stats = {
    version: r.data?.info?.os?.release ?? null,
    uptime: numberOrNull(r.data?.info?.os?.uptime),
    arrayState: r.data?.array?.state ?? null,
    arrayUsedPercent,
    dockerRunning: Number.isFinite(dockerRunning) ? dockerRunning : null,
    dockerTotal: Number.isFinite(dockerTotal) ? dockerTotal : null
  };

  return {
    ...r,
    ok: r.ok || (r.status === 200 && Array.isArray(r.errors) && r.errors.length > 0),
    stats
  };
}
