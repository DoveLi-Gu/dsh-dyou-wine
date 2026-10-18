import { spawn, execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { chromium } from '@playwright/test';
import { findDshCli, findNpmCli } from './cli-paths.mjs';

// Capture the actual packaged plugin in a disposable, seeded DSH profile.
// No daily profile, model credentials, injected UI or altered animation clocks.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const output = join(root, '.qa', 'demo');
const assets = join(root, 'docs', 'assets');
const home = join(root, '.test-dsh-home', `demo-${randomUUID()}`);
const tarball = resolve(process.argv[2] ?? join(root, `dsh-dyou-wine-${pkg.version}.tgz`));
if (!existsSync(tarball)) throw new Error('Build and npm pack first, or pass a plugin tarball path.');
const env = { ...process.env, DSH_HOME: home, DSH_TELEMETRY_DISABLED: '1', DSH_WINE_TEST_SEED: '1',
  DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '' };
const runFile = promisify(execFile);
const npmCli = await findNpmCli();
const dshBin = await findDshCli({ root, npmCli });
await mkdir(output, { recursive: true });
await mkdir(assets, { recursive: true });
await mkdir(home, { recursive: true });
const run = async (args) => {
  try { return await runFile(process.execPath, [dshBin, ...args], {
  cwd: root, env, windowsHide: true, timeout: 120_000, maxBuffer: 8 * 1024 * 1024,
  }); } catch (error) {
    throw new Error(String(error.message).replace(/([?&]token=)[^\s&]+/g, '$1[redacted]'));
  }
};
const seed = await runFile(process.execPath, [npmCli, 'pack', './tests/host', '--pack-destination', output, '--json'],
  { cwd: root, env, windowsHide: true });
await run(['--profile', 'wine-demo', '--from-default-profile', 'web', '--dump-config']);
await run(['plugin', '--profile', 'wine-demo', 'add', tarball, '--ignore-scripts']);
await run(['plugin', '--profile', 'wine-demo', 'add', join(output, JSON.parse(seed.stdout)[0].filename), '--ignore-scripts']);
const installedRoot = join(home, 'profiles', 'wine-demo', 'node_modules', pkg.name);
const installedPackage = JSON.parse(await readFile(join(installedRoot, 'package.json'), 'utf8'));
const installedClientSha256 = createHash('sha256').update(await readFile(join(installedRoot, 'lib/client.js'))).digest('hex');
console.log('Installed plugin and deterministic session in an isolated DSH home.');
const host = spawn(process.execPath, [dshBin, '--profile', 'wine-demo', '--no-open', '--host', '127.0.0.1', '--port', '0'],
  { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
let logs = '';
for (const stream of [host.stdout, host.stderr]) stream.on('data', data => { logs += data.toString(); });
const sleep = ms => new Promise(done => setTimeout(done, ms));
let browser, page;
try {
  let address;
  for (let attempt = 0; attempt < 240; attempt++) {
    if (host.exitCode !== null) throw new Error(`DSH exited (${host.exitCode}).`);
    address = logs.match(/https?:\/\/127\.0\.0\.1:\d+(?:\/[^\s]*)?/)?.[0];
    if (address) break;
    await sleep(250);
  }
  if (!address) throw new Error('DSH startup timed out.');
  const localChrome = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright', 'chromium-1248', 'chrome-win64', 'chrome.exe');
  browser = await chromium.launch({ headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? (localChrome && existsSync(localChrome) ? localChrome : undefined) });
  page = await browser.newPage({ viewport: { width: 1280, height: 800 },
    recordVideo: { dir: output, size: { width: 1280, height: 800 } } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addLocatorHandler(page.getByText('预览版说明', { exact: true }), async () => {
    await page.getByRole('button', { name: '继续', exact: true }).click();
  });
  await page.addLocatorHandler(page.getByRole('button', { name: '稍后配置', exact: true }), async later => later.click());
  await page.goto(address, { waitUntil: 'networkidle' });
  const workspace = page.getByText('D友の酒 验收工作区', { exact: true }).first();
  await workspace.waitFor({ state: 'visible', timeout: 30_000 });
  const chat = page.getByText('D友の酒 · 本地验收', { exact: true }).first();
  if (!await chat.isVisible()) await workspace.click();
  await chat.click();
  await page.locator('[data-turn-process][aria-expanded="false"]').first().click();
  const tools = page.locator('[data-process-activity="tools"][aria-expanded="false"]').first();
  if (await tools.isVisible()) await tools.click();
  await page.locator('[data-tool="read_file"]').waitFor({ state: 'visible' });
  await page.locator('[data-action="toggle"]').click();
  await page.locator('#wine-page-enabled').check();
  await page.locator('#wine-pet-enabled').check();
  await page.locator('[data-preset="party"]').click();
  // GIF has no sound. The user can opt into the separately credited BGM in DSH.
  await page.locator('#wine-music-enabled').uncheck();
  await page.screenshot({ path: join(output, 'controls.png') });
  await page.locator('[data-action="start"]').click();
  await page.locator('[data-wine-pet] img').waitFor({ state: 'visible' });
  await page.locator('[data-action="toggle"]').click();
  await page.mouse.move(1, 1);
  await sleep(600);
  await page.screenshot({ path: join(output, 'running.png') });
  console.log('Recording 12 seconds of real page + pet motion at native speed.');
  const observation = await page.evaluate(async () => {
    const pet = document.querySelector('[data-wine-pet]');
    const effects = document.getAnimations().filter(a => a.id.startsWith('dsh-dyou-wine:'));
    const body = pet.querySelector('[data-wine-pet-body]');
    const petEffect = body.getAnimations()[0];
    const pageEffect = effects.find(a => !pet.contains(a.effect.target));
    let frames = 0, xReflections = 0, yReflections = 0, maxPhaseErrorMs = 0, maxOverflow = 0;
    let previous, dxSign = 0, dySign = 0;
    const started = performance.now();
    while (performance.now() - started < 12_000) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const transform = new DOMMatrixReadOnly(getComputedStyle(pet).transform);
      if (previous) {
        const dx = Math.sign(transform.m41 - previous.x), dy = Math.sign(transform.m42 - previous.y);
        if (dx && dxSign && dx !== dxSign) xReflections++;
        if (dy && dySign && dy !== dySign) yReflections++;
        if (dx) dxSign = dx;
        if (dy) dySign = dy;
      }
      previous = { x: transform.m41, y: transform.m42 };
      const rect = pet.querySelector('img').getBoundingClientRect();
      maxOverflow = Math.max(maxOverflow, -rect.left, -rect.top, rect.right - innerWidth, rect.bottom - innerHeight);
      const difference = Math.abs((Number(pageEffect.currentTime) - Number(petEffect.currentTime)) % 500);
      maxPhaseErrorMs = Math.max(maxPhaseErrorMs, Math.min(difference, 500 - difference));
      frames++;
    }
    return { frames, xReflections, yReflections, maxPhaseErrorMs, maxOverflow,
      durationMs: performance.now() - started, pageEffects: effects.filter(a => !pet.contains(a.effect.target)).length,
      allPeriods500ms: effects.every(a => Number(a.effect.getTiming().duration) === 500) };
  });
  const video = page.video();
  await page.context().close();
  page = undefined;
  await video.saveAs(join(output, 'raw.webm'));
  if (errors.length || !observation.allPeriods500ms || observation.pageEffects === 0
    || !observation.xReflections || !observation.yReflections || observation.maxOverflow > 0.2
    || observation.maxPhaseErrorMs > 0.1) throw new Error(`Demo verification failed: ${JSON.stringify({ observation, errors })}`);
  // Trim the setup, preserve real playback speed, then quantize only for GIF delivery.
  await runFile('ffmpeg', ['-y', '-sseof', '-12', '-i', join(output, 'raw.webm'), '-t', '12', '-an',
    '-vf', 'fps=15,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=80:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle',
    '-loop', '0', join(assets, 'demo.gif')], { windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
  const gif = await readFile(join(assets, 'demo.gif'));
  const report = { timestamp: new Date().toISOString(), version: installedPackage.version, installedClientSha256,
    source: 'Actual isolated DSH Web; deterministic test session; no model requests or private chats.',
    viewport: { width: 1280, height: 800 }, gif: { path: 'docs/assets/demo.gif', width: 800, height: 500, fps: 15, silent: true,
      bytes: gif.length, sha256: createHash('sha256').update(gif).digest('hex') }, observation, pageErrors: errors };
  await writeFile(join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await page?.context().close();
  await browser?.close();
  host.kill();
  await writeFile(join(output, 'host.log'), logs.replace(/([?&]token=)[^\s&]+/g, '$1[redacted]'));
}
