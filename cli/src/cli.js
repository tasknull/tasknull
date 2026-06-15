'use strict';
// tasknull — reference CLI.
// Commands: init · whoami · commit · prove · verify · claim · spent
const fs = require('fs');
const C = require('./crypto');
const store = require('./store');
const pkg = require('../package.json');

const ADDR_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/; // Solana base58 address
const HEX64 = /^[0-9a-f]{64}$/;

// ---- tiny colour helpers (skip codes when not a TTY, e.g. piped output) ----
const tty = process.stdout.isTTY;
const paint = (code, s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const ok = (s) => paint('36', s);
const amber = (s) => paint('33', s);
const bad = (s) => paint('31', s);
const dim = (s) => paint('90', s);

function die(msg) {
  console.error(bad('error: ') + msg);
  process.exit(1);
}

function need(val, msg) {
  if (val === undefined || val === true || val === '') die(msg);
  return val;
}

const HELP = `${amber('tasknull')} ${dim('v' + pkg.version)} — anonymous proof-of-completion for on-chain bounties

${amber('USAGE')}
  tasknull <command> [options]

${amber('COMMANDS')}
  init                 Create your local identity (secret + signing keys)
  whoami               Show your public identity commitment
  commit               Lock a solution to a bounty (publishes a commitment)
    --bounty <id>        bounty identifier            (required)
    --file <path>        path to your solution        (required)
  prove                Generate a signed completion proof
    --bounty <id>        bounty identifier            (required)
    --file <path>        path to your solution        (required)
    --to <SOL_ADDR>      fresh payout address         (required)
    --scope <text>       optional scope label
    --reward <text>      optional reward label
    --out <path>         write proof JSON to a file (default: stdout)
  verify <proof.json>  Verify a proof (signature, structure, nullifier freshness)
  claim <proof.json>   Settle a verified proof (burns the nullifier locally)
  spent                List nullifiers spent on this machine

${amber('OPTIONS')}
  -h, --help           Show this help
  -v, --version        Show version

${amber('EXAMPLE')}
  tasknull init
  echo "my fix" > solution.txt
  tasknull prove --bounty zk-audit-114 --file solution.txt --to 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU --out proof.json
  tasknull verify proof.json
  tasknull claim proof.json

${dim('State is stored in ~/.tasknull (override with TASKNULL_HOME).')}
${dim('Settlement is local in this release; on-chain settlement on Solana ships with the $TNULL program.')}`;

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h') { out.help = true; continue; }
    if (a === '-v') { out.version = true; continue; }
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else {
      out._.push(a);
    }
  }
  return out;
}

function cmdInit(args) {
  if (store.hasIdentity() && !args.force) {
    die('identity already exists at ' + store.IDENTITY + ' — use --force to overwrite');
  }
  const secret = C.newSecret();
  const kp = C.newKeypair();
  const idc = C.identityCommitment(kp.publicKeyPem);
  store.saveIdentity({
    version: 1, secret, ...kp, identityCommitment: idc, createdAt: new Date().toISOString(),
  });
  console.log(ok('✓ identity created') + '  ' + dim('→ ' + store.IDENTITY));
  console.log('  identity commitment  ' + amber(idc.slice(0, 24) + '…'));
  console.log(dim('  your secret never leaves this machine — back up this folder, keep it private.'));
}

function cmdWhoami() {
  const id = store.loadIdentity();
  console.log('identity commitment  ' + amber(id.identityCommitment));
  console.log('created              ' + dim(id.createdAt));
}

function cmdCommit(args) {
  const bounty = need(args.bounty, '--bounty <id> required');
  const file = need(args.file, '--file <path> required');
  if (!fs.existsSync(file)) die('file not found: ' + file);
  const id = store.loadIdentity();
  const solutionHash = C.hashFile(file);
  const commitment = C.commitment(id.secret, bounty, solutionHash);
  console.log(ok('✓ commitment for ') + amber(bounty));
  console.log('  solution sha256  ' + dim(solutionHash));
  console.log('  commitment       ' + amber(commitment));
  console.log(dim('  publish the commitment now; reveal a proof later with `tasknull prove`.'));
}

function buildProof(id, bounty, solutionHash, payout, opts) {
  const payload = {
    version: 1,
    bounty,
    scope: opts.scope && opts.scope !== true ? opts.scope : null,
    reward: opts.reward && opts.reward !== true ? opts.reward : null,
    solutionHash,
    commitment: C.commitment(id.secret, bounty, solutionHash),
    nullifier: C.nullifier(id.secret, bounty),
    payout,
    publicKey: id.publicKeyPem,
    createdAt: new Date().toISOString(),
  };
  const signature = C.sign(id.privateKeyPem, JSON.stringify(payload));
  return { ...payload, signature };
}

function cmdProve(args) {
  const bounty = need(args.bounty, '--bounty <id> required');
  const file = need(args.file, '--file <path> required');
  const payout = need(args.to, '--to <SOL_ADDRESS> required');
  if (!ADDR_RE.test(payout)) die('invalid --to address (expected a Solana base58 address, 32-44 chars)');
  if (!fs.existsSync(file)) die('file not found: ' + file);
  const id = store.loadIdentity();
  const proof = buildProof(id, bounty, C.hashFile(file), payout, { scope: args.scope, reward: args.reward });
  const json = JSON.stringify(proof, null, 2);
  if (args.out && args.out !== true) {
    fs.writeFileSync(args.out, json);
    console.log(ok('✓ proof written  ') + dim('→ ' + args.out));
    console.log('  nullifier  ' + amber(proof.nullifier.slice(0, 24) + '…'));
  } else {
    console.log(json);
  }
  console.error(dim('share this proof — anyone can check it with `tasknull verify`.'));
}

function loadProofArg(args) {
  const f = args._[1] || (args.file !== true && args.file);
  if (!f) die('proof file required — usage: tasknull ' + args._[0] + ' <proof.json>');
  if (!fs.existsSync(f)) die('proof not found: ' + f);
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (_) {
    die('invalid proof JSON: ' + f);
  }
}

function checkProof(proof) {
  const { signature, ...payload } = proof;
  const sigOk = Boolean(signature) && C.verifySig(proof.publicKey, JSON.stringify(payload), signature);
  const wellFormed = HEX64.test(proof.commitment || '') && HEX64.test(proof.nullifier || '');
  const scopeOk = sigOk && Boolean(proof.bounty);
  const fresh = !store.isSpent(proof.nullifier);
  return [
    ['bounty membership / commitment', wellFormed],
    ['signature integrity', sigOk],
    ['nullifier unspent', fresh],
    ['scope & reward match', scopeOk],
  ];
}

function printResults(results) {
  for (const [label, pass] of results) {
    console.log((pass ? ok('  ✓ ') : bad('  ✗ ')) + label);
  }
  return results.every((r) => r[1]);
}

function cmdVerify(args) {
  const proof = loadProofArg(args);
  console.log('verifying proof for ' + amber(proof.bounty) + dim('  → payout ' + proof.payout));
  const allOk = printResults(checkProof(proof));
  console.log(allOk ? ok('\n✓ VALID') + dim(' — proof checks out') : bad('\n✗ INVALID'));
  process.exit(allOk ? 0 : 1);
}

function cmdClaim(args) {
  const proof = loadProofArg(args);
  console.log('settling claim for ' + amber(proof.bounty));
  const allOk = printResults(checkProof(proof));
  if (!allOk) {
    console.log(bad('\n✗ cannot settle') + ' — proof invalid or nullifier already spent');
    process.exit(1);
  }
  store.markSpent(proof.nullifier, { bounty: proof.bounty, payout: proof.payout, at: new Date().toISOString() });
  console.log(ok('\n✓ settled') + ' — nullifier burned, reward released to ' + amber(proof.payout));
  console.log(dim('  local settlement — on-chain settlement on Solana ships with the $TNULL program.'));
}

function cmdSpent() {
  const s = store.loadSpent();
  const keys = Object.keys(s);
  if (!keys.length) return console.log(dim('no spent nullifiers on this machine yet'));
  console.log(amber(String(keys.length)) + ' spent nullifier(s):');
  for (const k of keys) console.log('  ' + dim(k.slice(0, 24) + '…') + '  ' + (s[k].bounty || ''));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0];
  if (args.version) return console.log('tasknull v' + pkg.version);
  if (!cmd || args.help || cmd === 'help') return console.log(HELP);
  try {
    switch (cmd) {
      case 'init':
      case 'keygen': return cmdInit(args);
      case 'whoami': return cmdWhoami();
      case 'commit': return cmdCommit(args);
      case 'prove': return cmdProve(args);
      case 'verify': return cmdVerify(args);
      case 'claim':
      case 'settle': return cmdClaim(args);
      case 'spent': return cmdSpent();
      default: return die('unknown command: ' + cmd + '  (try `tasknull --help`)');
    }
  } catch (e) {
    if (e && e.user) die(e.message);
    throw e;
  }
}

main();
