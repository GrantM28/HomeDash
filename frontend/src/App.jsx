import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export default function App() {
  const [health, setHealth] = useState({ loading: true });
  const [overview, setOverview] = useState({ loading: true });

  async function load() {
    setHealth({ loading: true });
    setOverview({ loading: true });

    try {
      const h = await fetch(`${API_BASE}/api/health`).then(r => r.json());
      setHealth({ loading: false, data: h, ok: !!h.ok });
    } catch (e) {
      setHealth({ loading: false, ok: false, error: String(e) });
    }

    try {
      const o = await fetch(`${API_BASE}/api/overview`).then(r => r.json());
      setOverview({ loading: false, data: o, ok: !!o.ok });
    } catch (e) {
      setOverview({ loading: false, ok: false, error: String(e) });
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="brand">Homelab Dashboard</div>

        <div className="nav">
          <div className="navItem active">Dashboard</div>
          <div className="navItem">Media</div>
          <div className="navItem">Photos</div>
          <div className="navItem">AI</div>
          <div className="navItem">Downloads</div>
          <div className="navItem">Sync</div>
          <div className="navItem">Settings</div>
        </div>

        <div style={{ marginTop: 16 }} className="small">
          API Base: <span style={{ color: "#cfe0ff" }}>{API_BASE}</span>
        </div>
      </aside>

      <main className="main">
        <div className="header">
          <h1 className="h1">Dashboard</h1>
          <div className="small">Auto-refresh: 10s</div>
        </div>

        <div className="grid">
          <Card title="Backend Health" ok={health.ok} loading={health.loading}>
            <pre>{JSON.stringify(health.data ?? health.error ?? null, null, 2)}</pre>
          </Card>

          <Card title="Overview (placeholder)" ok={overview.ok} loading={overview.loading}>
            <pre>{JSON.stringify(overview.data ?? overview.error ?? null, null, 2)}</pre>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Card({ title, ok, loading, children }) {
  const pillClass = loading ? "" : ok ? "good" : "bad";
  const pillText = loading ? "loading" : ok ? "ok" : "down";

  return (
    <section className="card">
      <div className="cardTitle">
        <div>{title}</div>
        <div className={`pill ${pillClass}`}>{pillText}</div>
      </div>
      {children}
    </section>
  );
}