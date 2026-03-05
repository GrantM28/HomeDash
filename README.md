# Homelab Dashboard (base)

## Dev workflow
- Build/edit on Windows in VS Code
- Push to GitHub
- Clone on Unraid
- Run: `docker compose up -d --build`

## Ports
- Frontend: http://<unraid-ip>:3000
- Backend:  http://<unraid-ip>:3001

## First test
- Frontend page shows backend health status
- Backend: GET /api/health

## Setup
1) Copy `.env.example` to `.env`
2) `docker compose up -d --build`
3) Open frontend and verify it shows "ok"