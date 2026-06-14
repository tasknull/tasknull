<div align="center">

![tasknull](assets/banner.svg)

**Prove you finished the work. Hide who you are.**

Anonymous, nullifier-backed proof-of-completion for on-chain bounties — settled on Base.

[![Website](https://img.shields.io/badge/website-tasknull.vercel.app-f2b441?style=flat-square)](https://tasknull.vercel.app)
[![X](https://img.shields.io/badge/follow-@TaskNull-1da1f2?style=flat-square&logo=x&logoColor=white)](https://x.com/TaskNull)
[![Base](https://img.shields.io/badge/settled%20on-Base-0052ff?style=flat-square)](https://base.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-63cad6?style=flat-square)](LICENSE)

</div>

---

## Overview

**tasknull** turns a completed bounty into a cryptographic receipt. Reviewers can confirm the
work is real and that the claim cannot be spent twice — **without ever learning which wallet did it.**

Today, claiming a bounty usually means doxxing yourself: either your wallet is attached to the
payout for everyone to trace, or your contribution can't be trusted. tasknull adds a third path:
**provable completion, unlinkable identity.**

This repository contains the **official website / landing page** for the project.

> **Status:** pre-launch. The interactive verifier, registry, and nullifier wall on the site are
> front-end demonstrations of the protocol concept. The `$TNULL` contract address is **TBA** and
> will be announced at launch.

## Table of contents

- [Why](#why)
- [Key features](#key-features)
- [How it works](#how-it-works)
- [The $TNULL token](#the-tnull-token)
- [Tech stack](#tech-stack)
- [3D animated background](#3d-animated-background)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Regenerating assets](#regenerating-assets)
- [Deployment](#deployment)
- [Links](#links)
- [Disclaimer](#disclaimer)
- [License](#license)

## Why

People who ship sensitive work quietly need to get paid without revealing who they are:

- **Security researchers** — claim a disclosure bounty without tying the patch (or the payout) to a real name or employer.
- **Freelance hunters** — build a track record through stable nullifiers while keeping every wallet single-use and clean.
- **DAO contributors** — let a treasury reward completed work on-chain without a public map of who did what for whom.

## Key features

| | Feature | Description |
|---|---|---|
| ✓ | **Verifiable completion** | Every claim carries a proof that the bounty's acceptance criteria were met. Reviewers check the math, not your reputation. |
| ∅ | **Unlinkable identity** | The payout wallet and the proof are cryptographically separated. A verifier learns *"valid hunter"*, never *which* hunter. |
| ⊘ | **No double-claims** | Each claim emits a one-way **nullifier**. Reuse the same solution twice and the second nullifier collides — the chain rejects it. |

## How it works

Three steps, one CLI. The signing happens entirely on your machine — no coordinator, no custodian, no account.

```bash
# 1. COMMIT — lock your solution against the bounty's criteria
tasknull commit --bounty zk-audit-114

# 2. PROVE — derive a nullifier from your secret and sign the completion proof
tasknull prove --reveal ./solution

# 3. SETTLE — anyone can verify; once it checks out, the reward releases to a fresh address
tasknull claim --to 0xYOUR...
```

## The $TNULL token

`$TNULL` is the bounty reward layer, designed to live on **Base**. Reward pools are funded in
`$TNULL` and pay out to the proof, never to a doxxable signer — the privacy model holds by construction.

| Allocation | Share |
|---|---:|
| Bounty reward pool | 60% |
| Liquidity · Base | 20% |
| Protocol & CLI dev | 12% |
| Verifier infra | 8% |

- **Network:** Base (L2)
- **Contract:** `TBA` — announced at launch. Always verify the official address before transacting.

## Tech stack

- **Static front-end** — a single `index.html` (no framework, no build step required to run).
- **HTML + CSS** — custom dark theme, CSS variables, fully responsive.
- **Vanilla JavaScript** — terminal typing animation, animated counters, interactive nullifier wall, demo verifier, scroll reveals.
- **[Three.js](https://threejs.org)** — the 3D animated background (loaded from CDN via an import map).
- **[Vercel](https://vercel.com)** — hosting & deployment.
- Build tooling: **[sharp](https://sharp.pixelplumbing.com)** (Node) and **[Pillow](https://python-pillow.org)** (Python) for generating logo / favicon / OG / banner assets.

## 3D animated background

The hero renders a live **WebGL** scene with Three.js:

- a rotating **particle cloud** (amber / orange / cyan, additive glow) on a spherical shell,
- two counter-rotating **wireframe icosahedrons** for a crystalline / network feel,
- **mouse parallax** on the camera and **exponential fog** for depth.

It is implemented to be considerate:

- respects `prefers-reduced-motion` (renders a single static frame),
- **pauses when the tab is hidden** (saves battery / GPU),
- caps device pixel ratio at 2,
- **removes itself gracefully** if WebGL is unavailable — the site keeps working.

## Project structure

```
tasknull/
├─ index.html              # Landing page (hero, sections, 3D background, all logic)
├─ terms.html              # Terms of Use
├─ privacy.html            # Privacy Policy
├─ assets/
│  ├─ logo.jpg             # Master logo (source of truth)
│  ├─ logo-64.png          # Small logo used in the nav / footer
│  ├─ favicon.png          # Browser tab icon
│  ├─ apple-touch-icon.png # iOS / home-screen icon
│  ├─ og-image.png         # 1200×630 social share image
│  └─ banner.svg           # Animated README banner (self-contained)
├─ build/                  # Asset-generation scripts (not needed at runtime)
│  ├─ genfav.js            # favicon + apple-touch-icon from logo.jpg (sharp)
│  ├─ og.py               # logo-64 + og-image from logo.jpg (Pillow)
│  ├─ banner.py            # animated banner.svg (embeds the logo)
│  └─ package.json
├─ .gitignore
├─ LICENSE
└─ README.md
```

## Getting started

It's a static site — no build step needed to run it.

```bash
git clone https://github.com/tasknull/tasknull.git
cd tasknull

# Option A: just open index.html in your browser

# Option B: serve locally (recommended, so all paths resolve)
python -m http.server 8000
# then visit http://localhost:8000
```

> The 3D background loads Three.js from a CDN, so an internet connection is needed for that effect.

## Regenerating assets

All generated images can be rebuilt from `assets/logo.jpg` using the scripts in `build/`.

```bash
# Favicon + apple-touch-icon  (Node + sharp)
cd build
npm install
node genfav.js

# Small logo + OG share image  (Python + Pillow)
pip install pillow
python og.py

# Animated README banner
python banner.py
```

> `og.py` uses Windows system fonts (Segoe UI) for the OG image text; on other platforms it falls
> back to a default font.

## Deployment

The site is deployed on **Vercel**:

```bash
vercel deploy --prod
```

Or connect the repository to Vercel for automatic deployments on push.

## Links

- 🌐 Website — https://tasknull.vercel.app
- 𝕏 / Twitter — https://x.com/TaskNull
- ⛓ Base — https://base.org

## Disclaimer

`$TNULL` is an experimental utility token and this software is provided **"as is"**, without
warranties of any kind. Nothing in this repository or on the website is financial, legal, or
investment advice. Digital assets are highly volatile and you may lose the entire value of your
funds. Always verify the official contract address before transacting, and use at your own risk.

## License

Released under the [MIT License](LICENSE).

<div align="center">
<sub>© 2026 tasknull · proof of completion, not identity</sub>
</div>
