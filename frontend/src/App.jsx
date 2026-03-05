import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://192.168.1.4:3040";

const SERVICE_URLS = {
  jellyfin: "http://192.168.1.4:8096",
  immich: "http://192.168.1.4:2283",
  glances: "http://192.168.1.4:61208",
  transmission: "http://192.168.1.4:9091",
  syncthing: "http://192.168.1.4:8384",
  unraid: "http://192.168.1.4"
};

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", type: "scroll", target: "dashboard-top" },
  { id: "media", label: "Media", type: "link", url: SERVICE_URLS.jellyfin },
  { id: "photos", label: "Photos", type: "link", url: SERVICE_URLS.immich },
  { id: "downloads", label: "Downloads", type: "link", url: SERVICE_URLS.transmission },
  { id: "sync", label: "Sync", type: "link", url: SERVICE_URLS.syncthing },
  { id: "settings", label: "Settings", type: "scroll", target: "backend-health" }
];

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
    <section className={`serviceCard ${ok ? "isUp" : "isDown"}`}>
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

function hasStatusChange(prevServices = {}, nextServices = {}) {
  const keys = new Set([...Object.keys(prevServices), ...Object.keys(nextServices)]);
  for (const key of keys) {
    if (Boolean(prevServices[key]?.ok) !== Boolean(nextServices[key]?.ok)) {
      return true;
    }
  }
  return false;
}

function formatKbps(value) {
  if (!Number.isFinite(value)) return "-";
  if (value >= 1024) return `${(value / 1024).toFixed(2)} MB/s`;
  return `${value.toFixed(1)} KB/s`;
}

function formatCount(value) {
  return Number.isFinite(value) ? value.toLocaleString() : "-";
}

function formatUptime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "-";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function App() {
  const [health, setHealth] = useState({ loading: true });
  const [overview, setOverview] = useState({ loading: true, data: { services: {} }, ok: false });
  const [glances, setGlances] = useState({ loading: true });
  const [activity, setActivity] = useState({ loading: true, data: null, updatedAt: null });
  const [now, setNow] = useState(new Date());
  const [activeNav, setActiveNav] = useState("dashboard");

  async function refreshHealth(initial = false) {
    if (initial) {
      setHealth((prev) => ({ ...prev, loading: true }));
    }

    try {
      const h = await fetch(`${API_BASE}/api/health`).then((r) => r.json());
      setHealth({ loading: false, data: h, ok: !!h.ok });
    } catch (e) {
      setHealth({ loading: false, ok: false, error: String(e) });
    }
  }

  async function refreshOverview(initial = false) {
    if (initial) {
      setOverview((prev) => ({ ...prev, loading: true }));
    }

    try {
      const o = await fetch(`${API_BASE}/api/overview`).then((r) => r.json());
      setOverview((prev) => {
        if (prev.loading) {
          return { loading: false, data: o, ok: !!o.ok };
        }

        const changed = hasStatusChange(prev.data?.services, o?.services);
        if (!changed) {
          return prev;
        }

        return { loading: false, data: o, ok: !!o.ok };
      });
    } catch (e) {
      setOverview((prev) => {
        if (prev.loading) {
          return { loading: false, ok: false, error: String(e), data: { services: {} } };
        }
        return prev;
      });
    }
  }

  async function refreshGlances(initial = false) {
    if (initial) {
      setGlances((prev) => ({ ...prev, loading: true }));
    }

    try {
      const g = await fetch(`${API_BASE}/api/glances/summary`).then((r) => r.json());
      setGlances({ loading: false, data: g, ok: !!g.ok });
    } catch (e) {
      setGlances({ loading: false, ok: false, error: String(e) });
    }
  }

  async function refreshActivity(initial = false) {
    if (initial) {
      setActivity((prev) => ({ ...prev, loading: true }));
    }

    try {
      const a = await fetch(`${API_BASE}/api/activity`).then((r) => r.json());
      setActivity({ loading: false, data: a.activity, updatedAt: a.updatedAt, ok: !!a.ok });
    } catch (e) {
      setActivity({ loading: false, ok: false, error: String(e), data: null, updatedAt: null });
    }
  }

  function handleNav(item) {
    setActiveNav(item.id);

    if (item.type === "scroll") {
      const el = document.getElementById(item.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (item.type === "link" && item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  }

  useEffect(() => {
    refreshHealth(true);
    refreshOverview(true);
    refreshGlances(true);
    refreshActivity(true);

    const healthTimer = setInterval(() => refreshHealth(false), 30000);
    const overviewTimer = setInterval(() => refreshOverview(false), 5000);
    const glancesTimer = setInterval(() => refreshGlances(false), 1000);
    const activityTimer = setInterval(() => refreshActivity(false), 3000);

    return () => {
      clearInterval(healthTimer);
      clearInterval(overviewTimer);
      clearInterval(glancesTimer);
      clearInterval(activityTimer);
    };
  }, []);

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const services = overview.data?.services || {};
  const total = Object.keys(services).length;
  const up = Object.values(services).filter((s) => s.ok).length;
  const down = total - up;

  const jellyfinStats = activity.data?.jellyfin || {};
  const immichStats = activity.data?.immich || {};
  const transmissionStats = activity.data?.transmission || {};
  const syncthingStats = activity.data?.syncthing || {};
  const unraidStats = activity.data?.unraid || {};

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="brandWrap">
          <div className="brandDot" />
          <div className="brand">Homelab Command</div>
        </div>

        <div className="nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`navItem ${activeNav === item.id ? "active" : ""}`}
              onClick={() => handleNav(item)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 16 }} className="small sidebarMeta">
          API Base: <span className="apiValue">{API_BASE}</span>
        </div>
      </aside>

      <main className="main" id="dashboard-top">
        <div className="header">
          <div>
            <h1 className="h1">Operations Dashboard</h1>
            <div className="small">Live telemetry and event-based service status</div>
          </div>
          <div className="headerRight">
            <div className="liveBadge">
              <span className="liveDot" />
              LIVE
            </div>
            <div className="clock">{now.toLocaleString()}</div>
          </div>
        </div>

        <div className="summaryRow">
          <StatTile label="Services" value={total} />
          <StatTile label="Up" value={up} />
          <StatTile label="Down" value={down} />
          <StatTile label="Backend" value={health.ok ? "OK" : health.loading ? "..." : "DOWN"} small />
          <StatTile
            label="Last Update"
            value={health.data?.time ? new Date(health.data.time).toLocaleTimeString() : "-"}
            small
          />
          <StatTile
            label="CPU"
            value={glances.ok ? `${glances.data?.cpu?.percent ?? "?"}%` : glances.loading ? "..." : "-"}
          />
          <StatTile
            label="RAM"
            value={glances.ok ? `${glances.data?.mem?.percent ?? "?"}%` : glances.loading ? "..." : "-"}
          />
          <StatTile
            label="Disk"
            value={glances.ok ? `${glances.data?.disk?.percent ?? "?"}%` : glances.loading ? "..." : "-"}
          />
        </div>

        <section className="bigCard activityPanel" id="activity-panel">
          <div className="cardTitle">
            <div>Live Activity</div>
            <div className="muted">
              Updated: {activity.updatedAt ? new Date(activity.updatedAt).toLocaleTimeString() : "-"}
            </div>
          </div>
          <div className="activityGrid">
            <div className="activityItem">
              <div className="activityLabel">Jellyfin Streams</div>
              <div className="activityValue">{formatCount(jellyfinStats.playing)} / {formatCount(jellyfinStats.sessions)}</div>
              <div className="muted">playing / sessions</div>
            </div>
            <div className="activityItem">
              <div className="activityLabel">Transmission Speed</div>
              <div className="activityValue">{formatKbps(transmissionStats.downKbps)} down</div>
              <div className="muted">{formatKbps(transmissionStats.upKbps)} up</div>
            </div>
            <div className="activityItem">
              <div className="activityLabel">Active Torrents</div>
              <div className="activityValue">{formatCount(transmissionStats.activeTorrents)}</div>
              <div className="muted">of {formatCount(transmissionStats.totalTorrents)} total</div>
            </div>
            <div className="activityItem">
              <div className="activityLabel">Syncthing Peers</div>
              <div className="activityValue">{formatCount(syncthingStats.connectedPeers)} / {formatCount(syncthingStats.totalPeers)}</div>
              <div className="muted">connected / configured</div>
            </div>
            <div className="activityItem">
              <div className="activityLabel">Immich Library</div>
              <div className="activityValue">{formatCount(immichStats.photos)} photos</div>
              <div className="muted">{formatCount(immichStats.videos)} videos</div>
            </div>
            <div className="activityItem">
              <div className="activityLabel">Unraid Array</div>
              <div className="activityValue">{unraidStats.arrayState || "-"}</div>
              <div className="muted">used: {Number.isFinite(unraidStats.arrayUsedPercent) ? `${unraidStats.arrayUsedPercent}%` : "-"}</div>
            </div>
            <div className="activityItem">
              <div className="activityLabel">Unraid Docker</div>
              <div className="activityValue">{formatCount(unraidStats.dockerRunning)} / {formatCount(unraidStats.dockerTotal)}</div>
              <div className="muted">running / total</div>
            </div>
            <div className="activityItem">
              <div className="activityLabel">Unraid Uptime</div>
              <div className="activityValue">{formatUptime(unraidStats.uptime)}</div>
              <div className="muted">version: {unraidStats.version || "-"}</div>
            </div>
          </div>
        </section>

        <div className="grid">
          <section className="bigCard" id="overview-panel">
            <div className="cardTitle">
              <div>Overview</div>
              <div className={`pill ${overview.loading ? "" : overview.ok ? "good" : "bad"}`}>
                {overview.loading ? "loading" : overview.ok ? "ok" : "down"}
              </div>
            </div>
            <div className="services">
              {Object.keys(services).length === 0 && <div className="muted">No services discovered</div>}
              {Object.entries(services).map(([k, v]) => (
                <ServiceCard key={k} name={k} info={v} />
              ))}
            </div>
          </section>

          <section className="bigCard" id="backend-health">
            <div className="cardTitle">
              <div>Backend Health</div>
              <div className={`pill ${health.loading ? "" : health.ok ? "good" : "bad"}`}>
                {health.loading ? "loading" : health.ok ? "ok" : "down"}
              </div>
            </div>
            <div className="healthBody">
              <div>
                Status: <strong>{health.ok ? "OK" : "Unavailable"}</strong>
              </div>
              <div className="muted">{health.data?.status ?? health.error ?? "No details"}</div>
              <div className="muted">
                Updated: {health.data?.time ? new Date(health.data.time).toLocaleString() : "-"}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
