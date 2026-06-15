<div align="center">

# tasknull

**Prove you finished the work. Hide who you are.**

Anonymous, nullifier-backed proof-of-completion for on-chain bounties — settled on Base.
This repository is the **`tasknull` command-line tool** and how to use it.

[![Website](https://img.shields.io/badge/website-tasknull.xyz-f2b441?style=flat-square)](https://tasknull.xyz)
[![Docs](https://img.shields.io/badge/docs-tasknull.xyz%2Fdocs-f97316?style=flat-square)](https://tasknull.xyz/docs/)
[![X](https://img.shields.io/badge/follow-@TaskNull-1da1f2?style=flat-square&logo=x&logoColor=white)](https://x.com/TaskNull)
[![License: MIT](https://img.shields.io/badge/license-MIT-63cad6?style=flat-square)](LICENSE)

</div>

---

## What is this?

`tasknull` turns a completed bounty into a cryptographic receipt. A reviewer can confirm the work
is real and that the claim can't be spent twice — **without ever learning which wallet did it.**

This repo contains the **CLI** only. The website and the full documentation live at
**[tasknull.xyz](https://tasknull.xyz)** ([docs](https://tasknull.xyz/docs/)).

> **Status — v0.1 reference implementation.** The cryptography (identity, commitments, nullifiers,
> signatures, double-claim prevention) is real and runs locally today. On-chain settlement on Base
> is **simulated locally** until the `$TNULL` contract launches.

---

## 1. Requirements

- **Node.js 18 or newer** — check with `node -v`
- **git**

## 2. Install

```bash
git clone https://github.com/tasknull/tasknull.git
cd tasknull/cli
npm install -g .          # adds the global `tasknull` command
```

Check it works:

```bash
tasknull --version       # → tasknull v0.1.0
```

> Don't want a global install? Run it directly: `node bin/tasknull.js --help`
> The CLI has **zero dependencies** (only Node's built-in `crypto`).

## 3. Create your identity

This generates a secret + signing keys, stored locally in `~/.tasknull`. Your secret never leaves
your machine.

```bash
tasknull init
```

## 4. Prove you finished a bounty

Point at your solution file and a **fresh** payout address you control:

```bash
echo "my fix for the reentrancy bug" > solution.txt

tasknull prove \
  --bounty zk-audit-114 \
  --file solution.txt \
  --to 0x1111111111111111111111111111111111111111 \
  --out proof.json
```

This writes `proof.json` — a signed proof containing a one-way **nullifier**.

## 5. Verify and settle

Anyone can verify the proof; settling burns the nullifier so the work can't be claimed again.

```bash
tasknull verify proof.json     # → ✓ VALID
tasknull claim proof.json      # → ✓ settled (nullifier burned)
tasknull claim proof.json      # → ✗ rejected (no double-claims)
```

That's the whole lifecycle.

---

## Command reference

| Command | What it does |
|---|---|
| `tasknull init` | Create your local identity (secret + Ed25519 keys). `--force` to overwrite. |
| `tasknull whoami` | Print your public identity commitment. |
| `tasknull commit --bounty <id> --file <path>` | Publish a hiding commitment for a solution. |
| `tasknull prove --bounty <id> --file <path> --to <0x…>` | Emit a signed proof + nullifier. Options: `--out`, `--scope`, `--reward`. |
| `tasknull verify <proof.json>` | Verify signature, structure, nullifier freshness, scope. |
| `tasknull claim <proof.json>` | Settle a proof — burns the nullifier locally. |
| `tasknull spent` | List nullifiers spent on this machine. |

Run `tasknull --help` any time. Full guides: **[tasknull.xyz/docs](https://tasknull.xyz/docs/)**.

## How it works (in brief)

- **Identity** — a 32-byte secret + Ed25519 keypair, generated and stored locally.
- **Commitment** — `SHA256(bounty ‖ SHA256(solution) ‖ secret)` binds your work without revealing it.
- **Nullifier** — `SHA256("nullifier" ‖ secret ‖ bounty)`: deterministic per `(secret, bounty)`, so the
  same work can't be claimed twice, yet it leaks nothing about your secret.
- **Proof** — a signed JSON object; verification re-checks the Ed25519 signature over the exact
  payload, so any tampering is caught.

Read the full explanation in the [docs](https://tasknull.xyz/docs/concepts.html).

## Where your data lives

State is stored under `~/.tasknull` (override with the `TASKNULL_HOME` env var):

- `identity.json` — your secret + keys. **Keep this private and back it up; there is no recovery.**
- `spent.json` — nullifiers burned on this machine.

## Links

- 🌐 Website — https://tasknull.xyz
- 📚 Docs — https://tasknull.xyz/docs/
- 𝕏 — https://x.com/TaskNull

## Disclaimer

`$TNULL` is an experimental utility token and this software is provided **"as is"**, without
warranties of any kind. Nothing here is financial, legal, or investment advice. Digital assets are
highly volatile and you may lose the entire value of your funds. Use at your own risk.

## License

Released under the [MIT License](LICENSE).
