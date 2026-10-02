// Exhaustively extract candidate UI strings from the game source, cross-check against the i18n dictionary.
// Output: JSON array of { s, files } for English-looking strings not yet covered.
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const files = execSync('git ls-files src', { cwd: root, encoding: 'utf8' })
  .trim().split('\n')
  .filter((f) => /\.(js|mjs)$/.test(f));

// strings that are almost certainly UI copy: long-ish, start uppercase or have sentence case,
// not a code identifier / CSS class / URL / path / color / symbol
const isUI = (s) => {
  if (s.length < 4 || s.length > 400) return false;
  if (!/^[A-Za-z(]/.test(s)) return false;
  if (/\s*\(.*\)\s*$/.test(s) && !/[.!?]$/.test(s)) return false;   // fns like foo(
  if (/^[A-Z_][A-Z0-9_]{2,}$/.test(s)) return true;                  // SCREAMING label
  if (/^[A-Z][a-z]/.test(s)) return true;                            // Title or sentence
  if (/\.\s|[!?]$/m.test(s)) return true;
  return false;
};
const skip = (s) =>
  /^(https?:|www\.|data:|\.|\/|src\/|#|<|@|var\(|rgb|calc|translate|rotate|matrix|url\()/.test(s) ||
  /[{};]/.test(s) || // GLSL / code
  /^\d+$/.test(s) ||
  /^(Key|Digit|Button|Arrow|Shift|Control|Alt|Space|Tab|Enter|Escape|CapsLock|Numpad|PageUp|PageDown|Home|End|F\d+|Mouse|Wheel|ContextMenu|PointerDown|pointer|click|mousedown|mouseup|keydown|keyup|touchstart|touchend|change|input|submit|blur|focus|resize|load|error|abort|cancel|play|pause|ended|stalled|waiting|seeked|timeupdate|ratechange|volumechange|loadedmetadata|canplay|webkit|moz|ms)/.test(s) ||
  /^(GET|POST|PUT|DELETE|PATCH|WS|WSS|HTTP|HTTPS|JSON|NaN|Infinity|undefined|null|true|false|let|const|var|function|return|new|class|export|import|from|default|if|else|for|while|do|switch|case|break|continue|throw|try|catch|finally|typeof|instanceof|void|delete|in|of|yield|await|async|this|super|extends|implements|interface|type|enum|namespace|abstract|public|private|protected|readonly|static|get|set|map|set\b|has\b|add\b|delete\b|clear\b|size|values|keys|entries|filter|reduce|find|some|every|join|split|slice|splice|concat|push|pop|shift|unshift|sort|reverse|toFixed|toExponential|toString|fromString|valueOf|parse|stringify|random|floor|ceil|round|abs|sqrt|min|max|pow|sin|cos|tan|atan2|hypot|PI|TAU|clamp|lerp|mix|smooth|ease|exp|log|deg2rad|rad2deg|UP|DOWN|LEFT|RIGHT|FRONT|BACK)$/.test(s);

const i18nSrc = fs.readFileSync(path.join(root, 'src/i18n.js'), 'utf8');
const zhBody = i18nSrc.match(/const ZH = \{([\s\S]*?)\n\};/)[1];
const dictKeys = new Set([...zhBody.matchAll(/'((?:[^'\\]|\\.)*)'\s*:/g)].map((x) => x[1]));
const covered = new Set([...dictKeys, ...[...dictKeys].map((k) => k.toUpperCase())]);

const seen = new Map();
for (const f of files) {
  const src = fs.readFileSync(path.join(root, f), 'utf8');
  // string literals: '...' "..." `...` (template literals only if no ${ } — those are dynamic)
  const re = /(['"`])((?:\\.|(?!\1).){3,400}?)\1/g;
  let m;
  while ((m = re.exec(src))) {
    const s = m[2];
    if (m[1] === '`' && s.includes('${')) continue;
    if (!isUI(s) || skip(s)) continue;
    if (covered.has(s) || covered.has(s.toUpperCase())) continue;
    const k = (seen.get(s) || (seen.set(s, []).length, seen.get(s)));
    if (!seen.has(s)) seen.set(s, []);
    const arr = seen.get(s);
    const short = f.replace('src/', '');
    if (arr.length < 3 && !arr.includes(short)) arr.push(short);
  }
}
const out = [...seen.entries()].map(([s, files_]) => ({ s, files: files_ }));
out.sort((a, b) => b.s.length - a.s.length);
fs.writeFileSync(path.join(__dirname, '..', 'i18n-missing.json'), JSON.stringify(out, null, 1));
console.log('total uncovered candidates:', out.length);
