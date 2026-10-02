// node --check every JS source file. Replaces the POSIX `find` one-liner in package.json, which dies
// under cmd.exe on Windows ("此时不应有 f。"). usage: node tools/check-syntax.mjs
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['src', 'electron', 'build', 'tools', 'server/src'];
const exts = new Set(['.js', '.mjs', '.cjs']);
const files = [];
const walk = (d) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (exts.has(p.slice(p.lastIndexOf('.')))) files.push(p);
  }
};
for (const r of roots) walk(r);
let bad = 0;
for (const f of files) {
  if (spawnSync(process.execPath, ['--check', f], { stdio: 'inherit' }).status !== 0) {
    bad++;
    console.error(`syntax error in ${f}`);
  }
}
if (bad) { console.error(`${bad} file(s) failed`); process.exit(1); }
console.log(`syntax ok (${files.length} files)`);
