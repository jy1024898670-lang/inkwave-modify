// True runtime coverage check: evaluates each candidate string literal to its
// runtime value (so \u2019 escapes resolve), and compares against the ZH keys
// (also evaluated). This avoids the scanner's raw-text false positives.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const files = execSync('git ls-files src', { cwd: root, encoding: 'utf8' })
  .trim().split('\n')
  .filter((f) => /\.(js|mjs)$/.test(f));

const isUI = (s) => {
  if (s.length < 4 || s.length > 400) return false;
  if (!/^[A-Za-z(]/.test(s)) return false;
  if (/^[A-Z_][A-Z0-9_]{2,}$/.test(s)) return true;
  if (/^[A-Z][a-z]/.test(s)) return true;
  if (/\.\s|[!?]$/m.test(s)) return true;
  return false;
};
const skip = (s) =>
  /^(https?:|www\.|data:|\.|\/|src\/|#|<|@|var\(|rgb|calc|translate|rotate|matrix|url\()/.test(s) ||
  /[{};]/.test(s) ||
  /^\d+$/.test(s) ||
  /^(Key|Digit|Button|Arrow|Shift|Control|Alt|Space|Tab|Enter|Escape)/.test(s) ||
  /^(GET|POST|PUT|DELETE|PATCH|WS|WSS|HTTP|HTTPS|JSON|NaN|Infinity|undefined|null|true|false|let|const|var|function|return|new|class|export|import|from|default|if|else|for|while|do|switch|case|break|continue|throw|try|catch|finally|typeof|instanceof|void|delete|in|of|yield|await|async|this|super)$/.test(s);

// evaluate a JS string literal (quote + raw body) to its runtime value
const evalLit = (quote, raw) => {
  try {
    return new Function('"use strict"; return (' + quote + raw + quote + ');')();
  } catch { return null; }
};

// Strip // and /* */ comments but KEEP string/template/regex literals. A naive scanner desyncs on regex
// literals containing quote chars (e.g. /it's/) and silently swallows the real string literals that follow,
// so track the previous significant token to tell a regex '/' from a division '/'.
const RE_START = new Set(['return', 'typeof', 'case', 'in', 'of', 'new', 'delete', 'void', 'throw', 'do', 'else', 'instanceof', 'await', 'yield']);
const stripComments = (src) => {
  let out = '', i = 0, n = src.length, mode = null, last = '';
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (mode) {
      out += c;
      if (c === '\\') { if (i + 1 < n) { out += src[i + 1]; i += 2; continue; } }
      if (mode === '/' && c === '\n') { mode = null; last = c; i++; continue; }   // unterminated: resync at newline
      if (c === mode) {
        if (mode === '/') while (i + 1 < n && /[a-z]/.test(src[i + 1])) out += src[++i];   // flags
        mode = null; last = c; i++; continue;
      }
      i++;
      continue;
    }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === "'" || c === '"' || c === '`') { mode = c; out += c; last = c; i++; continue; }
    if (c === '/') {
      if (last === '' || '[(,=:[!&|?{};~^%+*/<>-'.includes(last) || RE_START.has(last)) mode = '/';
      else last = '/';
      out += c; i++; continue;
    }
    if (/[A-Za-z0-9_$]/.test(c)) {
      let w = '';
      while (i < n && /[A-Za-z0-9_$]/.test(src[i])) w += src[i++];
      out += w; last = w; continue;
    }
    out += c; last = c; i++;
  }
  return out;
};

const i18nSrc = fs.readFileSync(path.join(root, 'src/i18n.js'), 'utf8');
const zhBody = i18nSrc.match(/const ZH = \{([\s\S]*?)\n\};/)[1];
const pairRe = /(['"])((?:\\.|(?!\1).)*)'\s*:/g; // single-quoted keys
const pairRe2 = /"((?:\\.|[^"\\])*)"\s*:/g;       // double-quoted keys
const zhKeys = new Set();
let m;
while ((m = pairRe.exec(zhBody))) { const k = evalLit('\'', m[2]); if (k) zhKeys.add(k); }
while ((m = pairRe2.exec(zhBody))) { const k = evalLit('"', m[1]); if (k) zhKeys.add(k); }
const zhUpper = new Set([...zhKeys].map((k) => k.toUpperCase()));   // runtime tr() also matches via UPPER
// TAG map
const tagSrc = i18nSrc.match(/const TAG_ADJ = \{([\s\S]*?)\};[\s\S]*?const TAG_NOUN = \{([\s\S]*?)\};/);
const tagAdj = {}, tagNoun = {};
for (const [obj, body] of [[tagAdj, tagSrc[1]], [tagNoun, tagSrc[2]]]) {
  for (const pm of body.matchAll(/'([^']+)'\s*:\s*'([^']*)'/g)) obj[pm[1]] = pm[2];
}
const tagHit = (t) => {
  const sp = t.indexOf(' ');
  return sp > 0 && tagAdj[t.slice(0, sp)] && tagNoun[t.slice(sp + 1)];
};

// Proper nouns are kept in English by design (fork standard — mirrors the ALLOW list in i18n-walk.mjs).
// A candidate is allowed when EVERY ascii letter-run in it is an allowed proper noun / keycap / acronym.
const ALLOW = new Set([
  'INKWAVE', 'HULLBREAKER', 'Titan', 'One', 'Rubik', 'Font', 'Diner', 'Hubert', 'Fischer',
  'MSAA', 'XP', 'LMB', 'RMB', 'TAB', 'SHIFT', 'CTRL', 'SPACE', 'ENTER', 'ESC', 'JOIN', 'VIEW', 'F11', 'F12', 'NETXX', 'Yeah',
  'Tako', 'Juno', 'Fizz', 'Loop', 'Meta', 'Drip', 'Moxie', 'Pip', 'Wasabi', 'Otto', 'Glub', 'Momo',
  'Wavebreaker', 'Kraken', 'Kai', 'Tentakool', 'Tidal', 'Tia', 'Coraline', 'Juniper', 'Nibbles', 'Seafoam', 'Pixel', 'Squee', 'Dashi', 'Zippy',
  'Mako', 'Blot', 'Lulu', 'Marlo', 'Nori', 'Suki', 'Zest', 'Kelp', 'Coral', 'Inky', 'Vee', 'Sprinkle', 'Squiddo', 'Blotch', 'Riptide', 'Bubbles',
  'Tangerine', 'Cobalt', 'Bubblegum', 'Mint', 'Lemon', 'Grape', 'Aqua', 'Cherry', 'Lime', 'Magenta', 'Sun', 'Sea', 'Alpha', 'Bravo',
  'Splash', 'Attitude', 'Harbor', 'Lounge', 'Fresh', 'Victory', 'Final', 'Shell', 'Shock', 'Hull', 'Alarm',
  'DEEP', 'bi',
  'Esc', 'Enter', 'Tab', 'Shift', 'Space', 'SIL', 'Jayden', 'Davis', 'github', 'com', 'jaydendavisnc', 'inkwave',
]);
const ALLOW_LC = new Set([...ALLOW].map((x) => x.toLowerCase()));
const allowedNoun = (s) => {
  const runs = s.match(/[A-Za-z]{2,}/g);
  return !!runs && runs.every((r) => ALLOW_LC.has(r.toLowerCase()));
};
// Title pool words (menus.js TITLE_ADJ/TITLE_NOUN): never rendered alone — composed "Adjective Noun"
// titles are translated at runtime via the TAG_ADJ/TAG_NOUN maps, so a pool word is not a UI string.
const isTitleWord = (s) => !!tagAdj[s] || !!tagNoun[s];
// Template fragments / identifiers that never render as standalone UI text: room-code alphabet,
// keyboard key identifiers, the BOSS loanword (fork standard), and toast template fragments whose
// composed strings are handled by dictionary keys ('Your beacon') or are online-only interpolation.
const EXACT_ALLOW = new Set([
  'BCEFGHJKLMNPQRTUVXYZ23456789', 'NumpadEnter', 'CapsLock', 'BOSS', 'Your', 'That stage', 'The host',
]);

const seen = new Map();
for (const f of files) {
  const src = stripComments(fs.readFileSync(path.join(root, f), 'utf8'));
  const re = /(['"])((?:\\.|(?!\1).){3,400}?)\1/g;
  while ((m = re.exec(src))) {
    const raw = m[2];
    if (m[1] === '`' && raw.includes('${')) continue;
    const s = evalLit(m[1], raw);
    if (s == null || !isUI(s) || skip(s)) continue;
    if (zhKeys.has(s) || zhUpper.has(s.toUpperCase()) || tagHit(s) || isTitleWord(s) || EXACT_ALLOW.has(s) || allowedNoun(s)) continue;
    const short = f.replace('src/', '');
    if (!seen.has(s)) seen.set(s, []);
    const arr = seen.get(s);
    if (arr.length < 3 && !arr.includes(short)) arr.push(short);
  }
}
const out = [...seen.entries()].map(([s, files_]) => ({ s, files: files_ }));
fs.writeFileSync(path.join(root, 'i18n-missing-rt.json'), JSON.stringify(out, null, 1));
console.log('runtime-uncovered candidates:', out.length);
const keep = /^(ui\/|config\.js|main\.js|net\/(mock|session|transport)\.js|game\/(specials|player|kits)($|\/))/;
console.log('--- UI-relevant ---');
for (const { s, files } of out) {
  const f = files[0].replace('src/', '');
  if (keep.test(f)) console.log(f + ' :: ' + JSON.stringify(s));
}
