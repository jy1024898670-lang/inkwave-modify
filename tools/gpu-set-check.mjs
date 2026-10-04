import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader'] });
const p = await b.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await p.goto('http://localhost:8490/?skipTitle&lang=zh', { waitUntil: 'load', timeout: 180000 });
await p.waitForFunction('window.__inkwave && window.__G && __G.mode === "menu"', { timeout: 300000, polling: 500 });
const r = await p.evaluate(() => {
  const out = {};
  out.gpu = __inkwave.R?.gpu || null;
  __inkwave.menus.show('settings');
  return new Promise((res) => setTimeout(() => {
    const video = [...document.querySelectorAll('.iw-tab')].find((t) => /Video|画面/.test(t.textContent));
    video?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    setTimeout(() => {
      const gpuRow = [...document.querySelectorAll('.iw-row')].find((r) => /Graphics card|显卡/.test(r.textContent));
      out.row = gpuRow ? gpuRow.textContent.trim().replace(/\s+/g, ' ') : null;
      out.opts = gpuRow ? [...gpuRow.querySelectorAll('.iw-seg__opt')].map((o) => o.textContent.trim()) : null;
      // focus the row → onFocus → showPreview('gpuPref')
      __inkwave.menus._setFocus(gpuRow, { snap: true });
      setTimeout(() => {
        // now click "Battery"
        const batt = [...gpuRow.querySelectorAll('.iw-seg__opt')].find((o) => /Battery|省电/.test(o.textContent));
        batt?.dispatchEvent(new MouseEvent('click', { bubbles: false }));
        setTimeout(() => {
          out.persisted = __inkwave.settings.gpuPref;
          const pv = document.querySelector('.iw-prev');
          out.prevText = pv ? pv.textContent.trim().replace(/\s+/g, ' ') : null;
          out.prevHasGpuName = pv ? (pv.textContent.includes('ANGLE') || pv.querySelector('.iw-pv-gpu-name') !== null) : false;
          res(out);
        }, 250);
      }, 500);
    }, 600);
  }, 600));
});
console.log(JSON.stringify(r, null, 1));
console.log('errors:', errs.length ? errs : 'none');
const ok = r.gpu && r.row && r.opts?.length === 2 && r.persisted === 'battery' && r.prevHasGpuName && /Detected|检测/.test(r.prevText || '');
console.log(ok && !errs.length ? 'GPU-SET-PASS' : 'GPU-SET-FAIL');
await b.close();
