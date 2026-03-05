import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://192.168.1.4:3040";

const SERVICE_URLS = {
  jellyfin: "http://192.168.1.4:8096",
  immich: "http://192.168.1.4:2283",
  glances: "http://192.168.1.4:61208",
  transmission: "http://192.168.1.4:9091",
  syncthing: "http://192.168.1.4:8384",
  ollama: "http://192.168.1.4:11434"
};

const [glances, setGlances] = useState({ loading: true });

function StatTile({ label, value, small }) {
  return (
    <div className="stat">
      <div className="statLabel">{label}</div>
      <div className={`statValue ${small ? "small" : ""}`}>{value}</div>
    </div>
  );
}

function ServiceCard({ name, info }) {
  const ok = info && info.ok;
  const url = SERVICE_URLS[name] || "#";
  return (
    <section className="serviceCard">
      <div className="serviceHead">
        <div className="serviceName">{name}</div>
        <div className={`badge ${ok ? "good" : "bad"}`}>{ok ? "UP" : "DOWN"}</div>
      </div>
      <div className="serviceBody">
        <div className="note">{info && info.note ? info.note : "No details"}</div>
        <div className="links">
          <a href={url} target="_blank" rel="noreferrer">Open</a>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [health, setHealth] = useState({ loading: true });
  const [overview, setOverview] = useState({ loading: true });
  const [now, setNow] = useState(new Date());

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

    try {
        const g = await fetch(`${API_BASE}/api/glances/summary`).then(r => r.json());
        setGlances({ loading: false, data: g, ok: !!g.ok });
    } catch (e) {
        setGlances({ loading: false, ok: false, error: String(e) });
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const services = overview.data?.services || {};
  const total = Object.keys(services).length;
  const up = Object.values(services).filter(s => s.ok).length;
  const down = total - up;

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
          <div>
            <h1 className="h1">Dashboard</h1>
            <div className="small">Auto-refresh: 10s</div>
          </div>
          <div className="headerRight">
            <div className="clock">{now.toLocaleString()}</div>
          </div>
        </div>

        <div className="summaryRow">
          <StatTile label="Services" value={total} />
          <StatTile label="Up" value={up} />
          <StatTile label="Down" value={down} />
          <StatTile label="Backend" value={health.ok ? "OK" : health.loading ? "..." : "DOWN"} small />
          <StatTile label="Last Update" value={health.data?.time ? new Date(health.data.time).toLocaleTimeString() : "-"} small />
          
          <StatTile label="CPU" value={glances.ok ? `${glances.data?.cpu?.percent ?? "?"}%` : glances.loading ? "..." : "—"} />
          <StatTile label="RAM" value={glances.ok ? `${glances.data?.mem?.percent ?? "?"}%` : glances.loading ? "..." : "—"} />
          <StatTile label="Disk" value={glances.ok ? `${glances.data?.disk?.percent ?? "?"}%` : glances.loading ? "..." : "—"} />
        </div>

        <div className="grid">
          <section className="bigCard">
            <div className="cardTitle">
              <div>Overview</div>
              <div className={`pill ${overview.loading ? "" : overview.ok ? "good" : "bad"}`}>
                {overview.loading ? "loading" : overview.ok ? "ok" : "down"}
              </div>
            </div>
            <div className="services">
              {Object.keys(services).length === 0 && (
                <div className="muted">No services discovered</div>
              )}
              {Object.entries(services).map(([k, v]) => (
                <ServiceCard key={k} name={k} info={v} />
              ))}
            </div>
          </section>

          <section className="bigCard">
            <div className="cardTitle">
              <div>Backend Health</div>
              <div className={`pill ${health.loading ? "" : health.ok ? "good" : "bad"}`}>
                {health.loading ? "loading" : health.ok ? "ok" : "down"}
              </div>
            </div>
            <div className="healthBody">
              <div>Status: <strong>{health.ok ? "OK" : "Unavailable"}</strong></div>
              <div className="muted">{health.data?.status ?? health.error ?? "No details"}</div>
              <div className="muted">Updated: {health.data?.time ? new Date(health.data.time).toLocaleString() : "-"}</div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}