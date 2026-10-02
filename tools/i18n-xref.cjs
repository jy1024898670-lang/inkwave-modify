// Cross-reference my uncovered UI candidates against the fork's ZH dictionary (the authoritative
// localization standard). For each UI-relevant candidate, report whether the fork translated it and
// what the fork's translation is — so we port the real ones and allowlist the proper nouns.
// usage: node tools/i18n-xref.cjs
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const missing = JSON.parse(fs.readFileSync(path.join(root, 'i18n-missing-rt.json'), 'utf8'));
const keep = /^(ui\/|config\.js|main\.js|net\/(mock|session|transport)\.js|game\/(specials|player|kits)($|\/))/;
const uiRelevant = missing.filter((c) => c.files.some((f) => keep.test(f.replace('src/', ''))));

const evalLit = (q, raw) => { try { return new Function('"use strict"; return (' + q + raw + q + ');')(); } catch { return null; } };

// pull key -> value pairs from a `const ZH = { ... };` body (single-line entries, either quote style)
const pairsFrom = (zhBody) => {
  const map = new Map();
  for (const line of zhBody.split('\n')) {
    const m = line.match(/^\s*(['"])([\s\S]*?)\1\s*:\s*(['"])([\s\S]*?)\3\s*,?\s*$/);
    if (!m) continue;
    const k = evalLit(m[1], m[2]);
    const v = evalLit(m[3], m[4]);
    if (k != null && v != null) map.set(k, v);
  }
  return map;
};

const forkSrc = fs.readFileSync(path.join(root, '..', 'inkwave-game', 'public', 'game', 'src', 'i18n.js'), 'utf8');
const forkPairs = pairsFrom(forkSrc.match(/const ZH = \{([\s\S]*?)\n\};/)[1]);

console.log('UI-relevant uncovered:', uiRelevant.length, ' fork ZH pairs:', forkPairs.size);
console.log('');
for (const c of uiRelevant) {
  const s = c.s;
  const fork = forkPairs.has(s) ? forkPairs.get(s) : (forkPairs.has(s.toUpperCase()) ? forkPairs.get(s.toUpperCase()) : null);
  const tag = fork ? 'PORT' : 'ALLOW?';
  console.log(tag.padEnd(7), s.length.toString().padStart(3), JSON.stringify(s));
  if (fork) console.log('        → ' + JSON.stringify(fork));
}
