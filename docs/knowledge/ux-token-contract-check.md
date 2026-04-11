# UX Token Contract Check

Use this quick check whenever child-facing UI polish looks inconsistent across routes.

## Why

Undefined CSS custom properties (`var(--token)`) fail silently. The UI can lose color, spacing, motion, or contrast with no compile error.

## Quick command

```bash
uses=$(rg --no-filename -o -e "var\\(--[a-z0-9-]+" packages/web/src | sed 's/var(//' | sort -u)
defs=$(rg --no-filename -o -e "--[a-z0-9-]+[[:space:]]*:" packages/web/src | sed 's/[[:space:]]*:$//' | sort -u)
comm -13 <(printf "%s\n" "$defs") <(printf "%s\n" "$uses")
```

## Current critical missing tokens (found in DUB-496 audit)

- `--color-accent-warning`
- `--color-warning`
- `--color-border`
- `--color-border-subtle`
- `--color-bg-surface`
- `--color-surface`
- `--color-surface-muted`
- `--font-size-base`
- `--motion-duration-fast`
- `--space-2xs`

## Usage note

Run this before visual QA and before shipping game UI changes, then either:

1. Define the missing token in the token layer, or
2. Replace its usage with an existing supported token.

## Route Polish Extension (DUB-678)

When a UX QA sweep flags low-scoring routes, define semantic surface tokens before per-page tweaks:

- `--surface-legal-*` for legal/trust pages
- `--surface-parent-*` for parent dashboard rhythm
- `--surface-recovery-*` for 404/recovery flows
- `--shell-*-touch-min` for header/footer controls

This keeps fixes systemic and lowers risk of regressions from route-local pixel literals.
