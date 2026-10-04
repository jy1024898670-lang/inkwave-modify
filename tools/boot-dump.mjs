// Single-page boot diagnostic: open one client, wait up to 150 s, then dump what the page actually is.
import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const b = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--use-gl=swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required',
    '--window-size=800,450'],
  defaultViewport: { width: 800, height: 450, deviceScaleFactor: 1 },
});
const p = await b.newPage();
const logs = [];
p.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
p.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await p.goto('http://localhost:8490/?skipTitle&autopilot', { waitUntil: 'load', timeout: 120000 });
for (let i = 0; i < 30; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  const st = await p.evaluate(() => ({
    inkwave: !!window.__inkwave, G: !!window.__G, mode: window.__G?.mode, net: window.__G?.net?.state,
    loading: document.querySelector('.iw-loading')?.textContent || null,
    ready: document.readyState,
  })).catch((e) => ({ err: String(e) }));
  console.log(`t+${(i + 1) * 5}s`, JSON.stringify(st));
  if (st.mode === 'menu') { console.log('REACHED MENU'); break; }
}
console.log('--- console tail ---');
console.log(logs.slice(-25).join('\n'));
await b.close();
process.exit(0);
