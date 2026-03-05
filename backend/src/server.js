import express from "express";
import cors from "cors";

import healthRouter from "./routes/health.js";
import overviewRouter from "./routes/overview.js";
import glancesRouter from "./routes/glances.js";

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: CORS_ORIGIN, credentials: false }));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "homelab-dashboard-backend",
    ok: true,
    endpoints: ["/api/health", "/api/overview"]
  });
});

app.use("/api/health", healthRouter);
app.use("/api/overview", overviewRouter);
app.use("/api/glances", glancesRouter);

// Basic error handler
app.use((err, req, res, next) => {
  console.error("[ERROR]", err);
  res.status(500).json({ ok: false, error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`[backend] listening on :${PORT}`);
  console.log(`[backend] CORS_ORIGIN=${CORS_ORIGIN}`);
});