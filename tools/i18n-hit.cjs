// quick i18n dictionary hit-rate check
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const { execSync } = require('child_process');
const files = execSync('git ls-files src index.html', { cwd: root, encoding: 'utf8' }).trim().split('\n');
const src = files.map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const i18n = fs.readFileSync(path.join(root, 'src/i18n.js'), 'utf8');
const m = i18n.match(/const ZH = \{([\s\S]*?)\n\};/);
const keys = [...m[1].matchAll(/'((?:[^'\\]|\\.)*)'\s*:/g)].map((x) => x[1]);
let hit = 0;
const miss = [];
for (const k of keys) {
  const esc = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (src.includes(k) || new RegExp(esc).test(src)) hit++;
  else if (k.length > 12) miss.push(k);
}
console.log('total keys:', keys.length, ' found in code:', hit, ' long misses:', miss.length);
console.log(miss.slice(0, 15).join('\n'));
