# tasknull CLI

The reference command-line tool for **tasknull** — prove you finished a bounty, keep your
identity unlinkable, and make double-claims impossible.

It is written in plain **Node.js (≥ 18)** with **zero dependencies** (only the standard
`crypto` module): Ed25519 signatures, SHA-256 commitments, and one-way nullifiers.

> **Status — v0.1 reference implementation.** The cryptography is real and works locally.
> On-chain settlement on Solana is **simulated locally** (the nullifier is recorded in a local
> registry) until the `$TNULL` program is live. Use it to learn, test, and integrate against.

## Install

```bash
git clone https://github.com/tasknull/tasknull.git
cd tasknull/cli

# install the `tasknull` command globally…
npm install -g .

# …or run it directly without installing
node bin/tasknull.js --help
```

## Quick start

```bash
# 1. Create your local identity (a secret + signing keys that never leave your machine)
tasknull init

# 2. Make a solution file (anything — code, a writeup, a patch)
echo "my fix for the reentrancy bug" > solution.txt

# 3. Generate a signed completion proof, payable to a fresh address you control
tasknull prove --bounty zk-audit-114 --file solution.txt \
  --to 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU --out proof.json

# 4. Anyone can verify it — no trust in you required
tasknull verify proof.json

# 5. Settle the claim — this burns the nullifier so it can never be reused
tasknull claim proof.json

# 6. Proof that double-claims are impossible: try to claim again → rejected
tasknull claim proof.json
```

## Commands

| Command | What it does |
|---|---|
| `tasknull init` | Create your local identity (`secret` + Ed25519 keys). `--force` overwrites. |
| `tasknull whoami` | Print your public **Solana address** (safe to share). |
| `tasknull commit --bounty <id> --file <path>` | Publish a hiding **commitment** binding a solution to a bounty. |
| `tasknull prove --bounty <id> --file <path> --to <SOL_ADDR>` | Emit a signed proof JSON with a one-way **nullifier**. `--out <file>`, `--scope`, `--reward` optional. |
| `tasknull verify <proof.json>` | Check signature, structure, nullifier freshness, scope. Exit `0` = valid. |
| `tasknull claim <proof.json>` | Verify, then **burn** the nullifier (local settlement). |
| `tasknull spent` | List nullifiers spent on this machine. |
| `tasknull --help` · `--version` | Help / version. |

## How it works

- **Identity** — `init` generates a 32-byte `secret` and an Ed25519 keypair, stored locally. Your
  public **Solana address** (a base58 Ed25519 pubkey) can be shared; the secret never leaves the box.
- **Commitment** — `SHA256(bounty ‖ SHA256(solution) ‖ secret)` binds your work to a bounty without
  revealing it.
- **Nullifier** — `SHA256("nullifier" ‖ secret ‖ bounty)`. It is **deterministic** per
  `(secret, bounty)`: proving the same bounty twice yields the *same* nullifier, so the second claim
  collides and is rejected — yet the nullifier reveals nothing about your secret.
- **Proof** — a JSON object `{ bounty, solutionHash, commitment, nullifier, payout, publicKey, … }`
  signed with Ed25519. `verify` re-checks the signature over the exact payload, so any tampering fails.

> Full zero-knowledge unlinkability (ring/membership proofs) is part of the protocol's design and
> will land with the ZK circuit; this reference CLI focuses on commitments, nullifiers, signatures,
> and double-claim prevention.

## State & files

Everything lives in `~/.tasknull` (override with the `TASKNULL_HOME` environment variable):

- `identity.json` — your secret + keys (**keep private; back it up**).
- `spent.json` — nullifiers burned on this machine.

## License

[MIT](../LICENSE)
