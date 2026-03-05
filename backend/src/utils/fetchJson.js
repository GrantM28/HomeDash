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
  } catch (error) {
    const causeCode = error?.cause?.code ? String(error.cause.code) : null;
    const detail =
      error?.name === "AbortError"
        ? "timeout"
        : causeCode
          ? `${String(error)} (${causeCode})`
          : String(error);

    return {
      ok: false,
      status: 0,
      data: null,
      error: detail
    };
  } finally {
    clearTimeout(t);
  }
}
