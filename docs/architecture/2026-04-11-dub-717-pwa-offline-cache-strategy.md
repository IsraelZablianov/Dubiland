# DUB-717 PWA Offline Cache Strategy (Phase 1)

Issue: [DUB-717](/DUB/issues/DUB-717)

## Goal

Provide a safe offline foundation for Dubiland web on tablet/unstable Wi-Fi by introducing a PWA app shell and bounded runtime caches.

## Implementation Location

- `packages/web/vite.config.ts`
- Tooling: `vite-plugin-pwa` (`GenerateSW` strategy)

## Cache Scope

### 1) Never cache auth/session/API traffic

- `NetworkOnly` for Supabase endpoints (`auth`, `rest`, `storage`, `functions`)
- `NetworkOnly` for same-origin `api/auth/rest` paths

Reason: avoid stale auth/session behavior and prevent sensitive API responses from being served from service-worker caches.

### 2) App shell pages

- Navigation requests use `NetworkFirst`
- Timeout fallback to cached shell enables previously visited routes to boot while offline
- Cache: `app-shell-pages`, bounded by entry count and 7-day TTL

### 3) Static runtime assets

- Same-origin scripts/styles/fonts/workers use `StaleWhileRevalidate`
- Cache: `static-runtime-assets`, 30-day TTL, bounded entry count

### 4) Audio manifest and audio files

- `/audio/he/manifest.json` uses `StaleWhileRevalidate` (1-day TTL)
- `/audio/he/*.(mp3|m4a|aac|ogg|wav)` uses `StaleWhileRevalidate` (30-day TTL)

### 5) Local images

- `/images/*.(avif|webp|png|jpg|jpeg|svg)` uses `StaleWhileRevalidate` (30-day TTL)

## PWA Behavior

- Auto-register service worker in production builds
- `skipWaiting`, `clientsClaim`, and `cleanupOutdatedCaches` enabled
- Offline shell supported for previously visited routes
- Development mode keeps SW disabled to avoid local-cache confusion

## Security Guardrail

This phase intentionally does **not** cache authenticated network responses. Future offline write support (outbox/background sync) must preserve idempotency and auth correctness before any expansion of cache scope.
