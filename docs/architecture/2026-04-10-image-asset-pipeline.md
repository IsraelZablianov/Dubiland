# 2026-04-10 — Image Asset Pipeline + Budget Gates

- Owner: Performance Expert
- Source issue: [DUB-534](/DUB/issues/DUB-534)
- Parent: [DUB-503](/DUB/issues/DUB-503)

## Goal

Ship a deterministic image optimization flow for Dubiland web assets and enforce size budgets in build/CI.

## Pipeline Contract

## Source of truth

Author raster source files in:

- `packages/web/assets-src/images/**`

Supported source formats:

- `.png`, `.jpg`, `.jpeg`

## Generated outputs

`yarn assets:optimize` (or `yarn workspace @dubiland/web images:optimize`) generates:

- fallback `png`
- modern `webp`
- modern `avif`

under:

- `packages/web/public/images/**`

Handbook page sources (`handbooks/<slug>/page-XX.*`) also generate compact launch renditions:

- `page-XX-960.webp`
- `page-XX-960.avif`

## Manifest

The optimizer emits:

- `packages/web/public/images-manifest.json`

Manifest fields include path, class, format, bytes, dimensions, hash, and source mapping.

## Budget Enforcement

`yarn assets:budgets` (or `yarn workspace @dubiland/web images:budgets`) validates:

1. Per-asset limits by class + format (`thumbnail`, `background`, `handbookPage`, `handbookPageCompact`, etc.).
2. Handbook startup preload budget (cover + first 2 compact page renditions): max `60 KiB`.

On violation, script exits non-zero and build fails.

## Build/CI Integration

`@dubiland/web` build now runs:

1. `images:pipeline` (`images:optimize` then `images:budgets`)
2. TypeScript build
3. Vite build
4. Crawl assets + SEO route generation

This means PR/CI regressions in image bytes are blocked automatically.

## Developer Workflow

1. Add/replace source raster in `packages/web/assets-src/images/...`.
2. Run `yarn assets:pipeline`.
3. Commit updated files in `packages/web/public/images/**` and `packages/web/public/images-manifest.json`.
4. Run `yarn build` and `yarn typecheck` before merge.

## Notes

- Current seeded representative set in source: `handbooks/magic-letter-map`.
- Existing manually managed SVG assets remain untouched and are still inventory-tracked in the manifest.
