# Flask → FastAPI + Async API Migration Plan Overview

This document outlines the full migration of the CAD-glaucoma backend from **Flask 3.x** (synchronous, session-based) to **FastAPI** (asynchronous, JWT-based).

## Project Snapshot (Before Migration)

| Layer | Current Tech |
|---|---|
| Framework | Flask 3.x with factory pattern (`create_app()`) |
| Auth | Flask sessions (signed cookies, server-side) |
| Database | `mysql-connector-python` (synchronous) |
| ML Inference | TensorFlow 2.x U‑Net (synchronous, loaded once) |
| File Serving | Flask `send_from_directory` |
| SPA Serving | Flask static folder + explicit routes for each SPA path |
| Deploy | Docker Compose (db + flask backend + nginx frontend) |
| Dev Server | Vite proxy `/api` → `http://localhost:5000` |

## Target Architecture (After Migration)

| Layer | Target Tech |
|---|---|
| Framework | **FastAPI** with async endpoints |
| Auth | **JWT** (Bearer token + HTTP-only cookie) via `python-jose` |
| Database | **asyncmy** connection pool (async MySQL driver) |
| ML Inference | TensorFlow wrapped in `asyncio.to_thread()` (non-blocking) |
| File Serving | FastAPI `FileResponse` |
| SPA Serving | FastAPI `StaticFiles` mount (eliminates nginx dependency) |
| Deploy | Docker Compose (db + fastapi backend; frontend optional) |
| Dev Server | Vite proxy same; no frontend code changes needed |

## Migration Phases

| # | Phase | Effort | Risk | Dependencies |
|---|-------|--------|------|-------------|
| 0 | Project Scaffolding & Dependencies | Small (15m) | None | — |
| 1 | Core Infrastructure Rewrite | Medium (1–2h) | Medium | Phase 0 |
| 2 | Authentication — JWT | Medium (1.5h) | Medium | Phase 1 |
| 3 | Auth Route Migration | Small (30m) | Low | Phase 2 |
| 4 | Upload & Prediction Route Migration | Medium (1.5h) | High | Phase 1, Phase 3 |
| 5 | History & Polygon Route Migration | Medium (2h) | Medium | Phase 1, Phase 2 |
| 6 | SPA Serving & Health Route | Small (15m) | Low | Phase 1 |
| 7 | Services — Async Adaptations | Small (30m) | Low | Phase 1 |
| 8 | Docker & Deployment Config | Small (30m) | Low | Phase 1–7 |

**Total estimated effort:** 8–12 hours for a single developer.

## Recommended Execution Order

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3
                                        │
                    ┌───────────────────┤
                    ▼                   ▼
               Phase 5             Phase 4 (hardest)
                    │                   │
                    └────────┬──────────┘
                             ▼
                        Phase 6 ──→ Phase 7 ──→ Phase 8
```

Each phase from Phase 2 onwards is independently testable after Phase 1 is complete.

## Key Architectural Decisions

1. **JWT over sessions** — stateless, FastAPI-idiomatic, no server-side store needed. Tokens sent as both `Authorization: Bearer` header and HTTP-only cookie for flexibility.
2. **asyncmy over SQLAlchemy** — lightweight, minimal query changes from current `mysql-connector-python` code.
3. **TF/OpenCV in thread pool** — ML inference is CPU-bound; running it in `asyncio.to_thread()` prevents event-loop blocking while keeping the route signatures async.
4. **FastAPI serves SPA directly** — eliminates the nginx reverse-proxy dependency for the frontend, simplifies Docker Compose.

## No Frontend Changes Required

All API calls use **relative paths** (`/api/*`). The Vite dev-server proxy and production serving are handled at the infrastructure layer, so the frontend codebase is unaffected.

## Risk Summary

| Risk | Mitigation |
|---|---|
| TF model loading blocks startup | Load in lifespan event, outside request path |
| TF inference blocks event loop | Wrap all TF/OpenCV calls in `asyncio.to_thread()` |
| JWT cannot be server-revoked | Use short expiry (30 min) + refresh token; optional blocklist |
| asyncmy connection errors | Connection pool with retry logic in health check |
| File path handling differences | Use `pathlib.Path` consistently; test upload route thoroughly |
