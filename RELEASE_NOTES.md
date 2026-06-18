# 1.7.1 (2026-05-13)

## Fixes

### Core Platform

- Handle transient 400 errors on HUB PISP webhook to prevent false failures – #112542
  <details>
    <summary>Details</summary>

  The HUB PISP webhook now returns 200 OK on transient 400 responses from BPCE PS instead of failing.
  </details>
