const { chromium } = require('playwright');
const jobs = JSON.parse(process.argv[2]);
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox','--allow-file-access-from-files'] });
  const p = await b.newPage();
  for (const j of jobs) {
    await p.setViewportSize({ width: j.size, height: j.size });
    await p.goto('file://' + __dirname + '/icon.html?' + new URLSearchParams(j.q || {}) + '&size=' + j.size);
    await p.waitForFunction(() => document.title === 'ready'); await p.waitForTimeout(150);
    await p.screenshot({ path: j.out, omitBackground: true });
  }
  await b.close();
})();
