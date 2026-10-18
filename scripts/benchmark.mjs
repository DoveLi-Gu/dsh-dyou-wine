import { chromium } from '@playwright/test';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { cpus, totalmem, release } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = 4181;
// Freeze the source under test. A dev-server hot reload invalidates timing runs.
const bundle = await build({absWorkingDir:root,entryPoints:['tests/fixture/main.ts'],bundle:true,format:'esm',write:false,loader:{'.png':'dataurl','.webp':'dataurl','.mp3':'dataurl'}});
const javascript = bundle.outputFiles[0].text;
const html = (await readFile(join(root,'tests/fixture/index.html'),'utf8')).replace('./main.ts','/main.js');
const server = createServer((request,response) => {
  response.setHeader('Content-Type',request.url === '/main.js' ? 'text/javascript' : 'text/html; charset=utf-8');
  response.end(request.url === '/main.js' ? javascript : html);
});
await new Promise(done => server.listen(port,'127.0.0.1',done));
const url = `http://127.0.0.1:${port}/tests/fixture/`;
const pause = ms => new Promise(done => setTimeout(done, ms));
let browser;
try {
  for (let i = 0; i < 80; i++) { try { if ((await fetch(url)).ok) break; } catch {} await pause(250); }
  const local = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1248/chrome-win64/chrome.exe');
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? (local && existsSync(local) ? local : undefined) });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(url);
  const inventory = await page.evaluate(() => window.__wineFixture.longHistory());
  const measure = () => page.evaluate(async () => {
    const frames = []; let previous = performance.now(); const start = previous;
    while (performance.now() - start < 60_000) await new Promise(done => requestAnimationFrame(now => { frames.push(now - previous); previous = now; done(); }));
    frames.sort((a,b) => a-b);
    return { durationMs: performance.now() - start, samples: frames.length, frameP95: frames[Math.ceil(frames.length * .95) - 1] };
  });
  console.log('Measuring 60-second baseline in the labelled synthetic browser fixture.');
  const baseline = await measure();
  await page.locator('[data-action=toggle]').click();
  await page.locator('[data-action=start]').click();
  await page.locator('[data-action=toggle]').click();
  await page.mouse.move(1,1);
  console.log('Measuring 60 seconds with the plugin enabled.');
  const enabled = await measure();
  const diagnostics = await page.evaluate(() => window.__wineFixture.snapshot());
  const active = await page.evaluate(() => document.getAnimations().filter(a => a.id.startsWith('dsh-dyou-wine:')).length);
  const stop = await page.evaluate(async () => {
    const start = performance.now(); document.querySelector('[data-action=stop]').click();
    await new Promise(done => requestAnimationFrame(done));
    return { elapsedMs:performance.now() - start, remaining:document.getAnimations().filter(a => a.id.startsWith('dsh-dyou-wine:')).length };
  });
  const environment = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl');
    const debug = gl?.getExtension('WEBGL_debug_renderer_info');
    return { userAgent:navigator.userAgent, devicePixelRatio, viewport:{width:innerWidth,height:innerHeight}, gpu:debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'unavailable' };
  });
  const report = { kind:'synthetic-fixture-headless-60s-comparison', timestamp:new Date().toISOString(), fixtureBundleSha256:createHash('sha256').update(javascript).digest('hex'), cpu:cpus()[0]?.model, logicalCpus:cpus().length, memoryGiB:Math.round(totalmem()/1024**3), os:`${process.platform} ${release()}`, browser:browser.version(), ...environment, inventory, baseline, enabled, diagnostics, active, stop,
    limitations:['Headless Chromium synthetic DOM; not physical desktop refresh, native IME, real DSH chat, or OS input-to-pixel latency.', 'GPU may be software-rendered; physical display scaling and GPU load are not measured.'] };
  await mkdir(join(root,'.qa'),{recursive:true});
  await writeFile(join(root,'.qa/benchmark-60s.json'), JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if (active > 120 || stop.remaining) throw new Error('Target budget or stop cleanup failed.');
} finally { await browser?.close(); await new Promise(done => server.close(done)); }
