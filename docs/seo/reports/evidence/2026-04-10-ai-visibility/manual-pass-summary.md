# Manual AI Visibility Pass Summary (2026-04-10)

- Scope: 10 Hebrew parent-intent queries x 4 assistants (40 probes)
- Capture mode: reproducible query links + platform gate-state screenshots
- Screenshot evidence confirms gate states before assistant answers render:
  - ChatGPT: Cloudflare verify-human gate
  - Perplexity: Cloudflare security verification gate
  - Google AIO lane: Google reCAPTCHA unusual-traffic gate
  - Copilot: region-not-available gate

## Status Marker Counts

| Platform | Marker | Count | Typical HTTP code |
|---|---|---|---|
| ChatGPT | cloudflare_human_verification | 10 | 403 |
| Copilot | region_blocked | 10 | 200 |
| Google_AIO | google_recaptcha_unusual_traffic | 10 | 200 |
| Perplexity | cloudflare_security_verification | 10 | 403 |

## Evidence Files

- chatgpt.png
- perplexity.png
- google.png
- copilot.png
- manual-pass-2026-04-10.csv
- queries.txt
