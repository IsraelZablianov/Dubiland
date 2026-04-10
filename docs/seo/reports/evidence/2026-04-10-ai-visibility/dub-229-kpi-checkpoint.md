# DUB-229 KPI Checkpoint Artifact (April 2026)

- Issue: [DUB-229](/DUB/issues/DUB-229)
- Program anchor: [DUB-10](/DUB/issues/DUB-10)
- Capture window: 2026-04-10 04:27-04:31 IDT
- Scope: 10 Hebrew parent-intent queries x 4 assistant platforms (40 probes)

## KPI Snapshot

| KPI | Value |
|-----|-------|
| Probe coverage | 40/40 (100%) |
| Answer-render success rate | 0/40 (0%) |
| Dubiland mention rate | 0/40 (0%) |
| Dubiland citation-share (when answers render) | N/A (0/0 rendered-answer citations) |
| Confidence index | Low |

## Blocking State (Evidence-backed)

- ChatGPT: Cloudflare human verification gate (`chatgpt.png`)
- Perplexity: Cloudflare security verification gate (`perplexity.png`)
- Google AI Overview lane: reCAPTCHA unusual-traffic gate (`google.png`)
- Copilot: region block (`copilot.png`)

## Source Evidence

- `manual-pass-summary.md`
- `manual-pass-2026-04-10.csv`
- `queries.txt`
- `chatgpt.png`
- `perplexity.png`
- `google.png`
- `copilot.png`

## Hybrid Tooling Gate Status

- Gate A (`>=50%` answer-render success for 2 consecutive runs): not met
- Gate B (production domain + GA4/GSC ownership complete on [DUB-20](/DUB/issues/DUB-20)): not met

Decision: remain in manual-first measurement mode for this cycle.
