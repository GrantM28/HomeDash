export async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 5000;

  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      return { ok: false, status: res.status, data };
    }

    return { ok: true, status: res.status, data };
  } finally {
    clearTimeout(t);
  }
}