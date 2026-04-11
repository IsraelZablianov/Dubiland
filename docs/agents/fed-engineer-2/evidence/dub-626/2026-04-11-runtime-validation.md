# DUB-626 — Interactive handbook illustration integration validation

Date: 2026-04-11
Agent: FED Engineer 2
Route tested: `/games/reading/interactive-handbook`
Book tested: `magicLetterMap` (`/images/handbooks/magic-letter-map/*`)

## 1) Static asset path contract verification

Validated required file families exist under `packages/web/public/images/handbooks/magic-letter-map`:

- cover variants: `cover.png`, `cover.webp`, `cover.avif`
- page variants: `page-01..10.(png|webp|avif)`
- compact variants: `page-01..10-960.(webp|avif)`

Result:

```json
{
  "checked": 53,
  "failedCount": 0
}
```

## 2) Images manifest integrity

Checked `packages/web/public/images-manifest.json` for `magic-letter-map` entries and local file existence.

Result:

```json
{
  "images-manifest assets for magic-letter-map": 53,
  "missing files": 0
}
```

## 3) Supabase handbook preload manifest validity

Queried `handbooks` row for `slug=magicLetterMap` and verified `preload_manifest_json` paths resolve to local public assets.

Result:

```json
{
  "handbookId": "4550fab6-097d-461a-a96c-8b1a96d3f8d4",
  "isPublished": true,
  "preloadCriticalCount": 3,
  "preloadPageBucketCount": 3,
  "preloadPathCount": 9,
  "preloadMissingCount": 0
}
```

## 4) Supabase handbook media assets validity

Queried `handbook_media_assets` for the same handbook id and verified `storage_path` references resolve locally.

Result:

```json
{
  "mediaAssetCount": 48,
  "mediaMissingCount": 0
}
```

## 5) Runtime page-by-page image render verification (Playwright)

Ran route flow on book 4 and advanced pages 1 -> 10. Observed image source per page:

1. `page-01-960.webp`
2. `page-02-960.webp`
3. `page-03-960.webp`
4. `page-04-960.webp`
5. `page-05-960.webp`
6. `page-06-960.webp`
7. `page-07-960.webp`
8. `page-08-960.webp`
9. `page-09-960.webp`
10. `page-10-960.webp`

Network capture for handbook pages:

- `GET /images/handbooks/magic-letter-map/page-01-960.webp` -> `200`
- `GET /images/handbooks/magic-letter-map/page-02-960.webp` -> `200`
- `GET /images/handbooks/magic-letter-map/page-03-960.webp` -> `200`
- `GET /images/handbooks/magic-letter-map/page-04-960.webp` -> `200`
- `GET /images/handbooks/magic-letter-map/page-05-960.webp` -> `200`
- `GET /images/handbooks/magic-letter-map/page-06-960.webp` -> `200`
- `GET /images/handbooks/magic-letter-map/page-07-960.webp` -> `200`
- `GET /images/handbooks/magic-letter-map/page-08-960.webp` -> `200`
- `GET /images/handbooks/magic-letter-map/page-09-960.webp` -> `200`
- `GET /images/handbooks/magic-letter-map/page-10-960.webp` -> `200`

## 6) Runtime fallback safety probe

Forced the currently displayed page image source from `page-10-960.webp` to an invalid `page-10-960-missing.webp` probe path.

Observed behavior:

```json
{
  "before": "/images/handbooks/magic-letter-map/page-10-960.webp",
  "guessedFallback": "/images/handbooks/magic-letter-map/page-10.png",
  "after": "/images/handbooks/magic-letter-map/page-10.png",
  "fallbackApplied": true
}
```

Note: in Vite dev, missing static paths are served as `200 text/html` (SPA fallback), not `404`; the image decode still fails and the component `onError` correctly swaps to PNG fallback.

## 7) Quality gate

`yarn typecheck` passed.

