// Port dictionary entries from the fork's i18n.js into our i18n-missing set.
// Output: i18n-port.json = { englishKey: zhValue } for keys that exist in our source
// (i.e. are in i18n-missing.json) and are not already in our dictionary.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const forkSrc = fs.readFileSync(path.join(root, '..', 'inkwave-game/public/game/src/i18n.js'), 'utf8');
const forkBody = forkSrc.match(/const ZH = \{([\s\S]*?)\n\};/)[1];

// parse 'key': 'value' pairs (values may contain escaped quotes / \u sequences)
const pairs = [];
const re = /'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g;
let m;
while ((m = re.exec(forkBody))) pairs.push([m[1], m[2]]);
const forkDict = new Map(pairs);

const ourSrc = fs.readFileSync(path.join(root, 'src/i18n.js'), 'utf8');
const ourBody = ourSrc.match(/const ZH = \{([\s\S]*?)\n\};/)[1];
const ourKeys = new Set([...ourBody.matchAll(/'((?:[^'\\]|\\.)*)'\s*:/g)].map((x) => x[1]));

const missing = JSON.parse(fs.readFileSync(path.join(root, 'i18n-missing.json'), 'utf8'));
const missingSet = new Map(missing.map((x) => [x.s, x]));

const port = {};
const skipped = [];
for (const [k, v] of forkDict) {
  if (ourKeys.has(k)) continue;
  if (!missingSet.has(k)) continue;
  if (ourKeys.has(k.toUpperCase()) || ourKeys.has(k.toLowerCase()) && k !== k.toUpperCase()) {
    // already covered case-insensitively? our engine is exact-match, so only exact keys count
  }
  port[k] = v;
}

const stats = {
  forkTotal: forkDict.size,
  portable: Object.keys(port).length,
};
fs.writeFileSync(path.join(root, 'i18n-port.json'), JSON.stringify(port, null, 1));
console.log(JSON.stringify(stats));

// which of the big UI files are still uncovered after port?
const byFile = {};
for (const { s, files } of missing) {
  if (port[s] !== undefined) continue;
  const f = files[0].replace('src/', '');
  (byFile[f] = byFile[f] || []).push(s);
}
for (const [f, arr] of Object.entries(byFile).sort((a, b) => b[1].length - a[1].length)) {
  if (arr.length >= 5) console.log('still missing:', f, arr.length);
}
