# Ignis by Pyr Neural Network — Standalone Site (Phase 2, v1.00)

Ignis's own front door: a hand-built static site (plain HTML/CSS/JS, no
framework, no build step) for the Pyr Neural Network layer under Prometheon
SI (K5 intent routing, K1 One Memory, K3 context that travels). It talks to
the **same live Prometheon SI gateway** (Alienware, port 8811) and the same
accounts as prometheon.si — one backend, two front doors. The gateway
client (`docs/gateway-client.js`) is byte-identical to the Lampas bundle's
copy.

## Repo target

- **Repository:** `American-Business-Capital-Group/pyr-network`
- **GitHub Pages source:** `/docs` on the default branch (the `docs/` folder
  in this directory is the complete publish bundle / site root)
- **Custom domain:** `pyr.network` (`docs/CNAME`, exact)
- **DNS step:** in the coordinator's `PUBLISH_STEPS.md` — not performed by
  this build.

## Bundle contents (`docs/`)

| File | Purpose |
|---|---|
| `index.html` | Home — what Ignis is: K5 routing, K1 One Memory, K3 context that travels |
| `architecture.html` | Where Ignis sits — Neural Network layer routing for Prometheon SI + Lampas, grounded in the pilot |
| `console.html` | Login (gateway auth) + chat locked to platform `ignis`, Routing & Memory panel from gateway `/health` + `/catalog` |
| `gateway-config.js` | Gateway discovery candidates (`window.PROMETHEON_GATEWAYS`); coordinator rewrites the `FUNNEL_URL_PENDING` entry |
| `gateway-client.js` | Shared gateway client — identical file in both Phase 2 bundles |
| `site.css` | Brand Kit v3.13 styling (black/gold/chrome, Cinzel + Inter) |
| `logo-lockup.png` | Supplied Prometheon SI logo lockup, unmodified |
| `CNAME`, `.nojekyll` | GitHub Pages custom domain + no-Jekyll markers |

Brand: Brand Kit v3.13, tagline "Powering human achievement.", ticker
"Full Beta Release 2/1/2027", footer "v1.00" + the ABCG copyright line.
Not announced anywhere; the only external calls are the gateway and
Google Fonts.
