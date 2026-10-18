import { spawn, execFile } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { chromium } from '@playwright/test';
import { findDshCli, findNpmCli } from './cli-paths.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mediaPaths = {
  audio: '/plugins/dsh-dyou-wine/assets/BV1hXbN6VEKV.mp3',
  image: '/plugins/dsh-dyou-wine/assets/whale-girl.png',
};
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
// Use the authenticated browser context's API client: these plugin routes
// must retain the real host's trust-cookie protection and HTTP semantics.
async function verifyStaticAsset(page, origin, pathname, sourcePath, mime) {
  const source = await readFile(sourcePath);
  const url = new URL(pathname, origin).href;
  const getResponse = await page.request.get(url);
  const getBody = await getResponse.body();
  const getHeaders = getResponse.headers();
  const headResponse = await page.request.head(url);
  const headBody = await headResponse.body();
  const headHeaders = headResponse.headers();
  const end = Math.min(31, source.length - 1);
  const rangeResponse = await page.request.get(url, { headers: { Range: `bytes=0-${end}` } });
  const rangeBody = await rangeResponse.body();
  const rangeHeaders = rangeResponse.headers();
  const invalidResponse = await page.request.get(url, { headers: { Range: `bytes=${source.length}-` } });
  const invalidHeaders = invalidResponse.headers();
  const contentTypeMatches = value => value?.split(';', 1)[0].trim() === mime;
  const result = {
    pathname, sameOrigin: new URL(getResponse.url()).origin === origin,
    sourceBytes: source.length, sourceSha256: sha256(source),
    get: { status: getResponse.status(), bytes: getBody.length, sha256: sha256(getBody),
      contentType: getHeaders['content-type'], contentLength: getHeaders['content-length'],
      acceptRanges: getHeaders['accept-ranges'] },
    head: { status: headResponse.status(), bytes: headBody.length,
      contentType: headHeaders['content-type'], contentLength: headHeaders['content-length'] },
    range: { status: rangeResponse.status(), bytes: rangeBody.length,
      contentType: rangeHeaders['content-type'], contentLength: rangeHeaders['content-length'],
      contentRange: rangeHeaders['content-range'], matchesSource: rangeBody.equals(source.subarray(0, end + 1)) },
    invalidRange: { status: invalidResponse.status(), contentRange: invalidHeaders['content-range'] },
  };
  result.passed = result.sameOrigin && result.get.status === 200 && result.get.sha256 === result.sourceSha256
    && result.get.bytes === source.length && result.get.contentLength === String(source.length)
    && contentTypeMatches(result.get.contentType) && result.get.acceptRanges === 'bytes'
    && result.head.status === 200 && result.head.bytes === 0
    && result.head.contentLength === String(source.length) && contentTypeMatches(result.head.contentType)
    && result.range.status === 206 && result.range.bytes === end + 1 && result.range.matchesSource
    && result.range.contentLength === String(end + 1) && contentTypeMatches(result.range.contentType)
    && result.range.contentRange === `bytes 0-${end}/${source.length}`
    && result.invalidRange.status === 416 && result.invalidRange.contentRange === `bytes */${source.length}`;
  return result;
}
const output = join(root, '.qa');
const profile = 'wine-smoke';
const home = join(root, '.test-dsh-home', randomUUID());
const env = {
  ...process.env,
  DSH_HOME: home,
  DSH_TELEMETRY_DISABLED: '1',
  DSH_WINE_TEST_SEED: '1',
  DEEPSEEK_API_KEY: '', OPENAI_API_KEY: '', ANTHROPIC_API_KEY: '',
};
const tarballFlag = process.argv.indexOf('--tarball');
let tarball = tarballFlag >= 0 ? resolve(process.argv[tarballFlag + 1]) : undefined;
if (!tarball) {
  const names = (await readdir(root)).filter(name => /^dsh-dyou-wine-.+\.tgz$/.test(name));
  if (names.length !== 1) throw new Error('Pass --tarball <path> when there is not exactly one plugin tarball.');
  tarball = join(root, names[0]);
}
const binFlag = process.argv.indexOf('--dsh-bin');
if (binFlag >= 0 && (!process.argv[binFlag + 1] || process.argv[binFlag + 1].startsWith('--'))) {
  throw new Error('--dsh-bin requires a path to the DSH lib/bin.js entry.');
}
const npmCli = await findNpmCli();
const dshBin = await findDshCli({ root, explicit: binFlag >= 0 ? process.argv[binFlag + 1] : undefined, npmCli });
await mkdir(output, { recursive: true });
await mkdir(home, { recursive: true });
const execFileAsync = promisify(execFile);
const packedSeed = await execFileAsync(process.execPath, [npmCli, 'pack', './tests/host', '--pack-destination', output, '--json'], { cwd: root, env, windowsHide: true });
const seedTarball = join(output, JSON.parse(packedSeed.stdout)[0].filename);
const pause = ms => new Promise(done => setTimeout(done, ms));
async function run(args, timeoutMs = 120_000) {
  return await new Promise((done, reject) => {
    const child = spawn(process.execPath, [dshBin, ...args], { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let error = '';
    child.stderr.on('data', chunk => { error += chunk.toString(); });
    child.stdout.resume();
    const timeout = setTimeout(() => { child.kill(); reject(new Error(`DSH command timed out: ${args[0]}`)); }, timeoutMs);
    child.once('error', reject);
    child.once('exit', code => { clearTimeout(timeout); code === 0 ? done() : reject(new Error(`DSH command failed (${code}): ${error.slice(-6000)}`)); });
  });
}

// A new home and named profile are created for each run. Daily DSH config is never loaded.
await run(['--profile', profile, '--from-default-profile', 'web', '--dump-config']);
console.log('Created isolated DSH test profile.');
await run(['plugin', '--profile', profile, 'add', tarball]);
console.log('Installed plugin tarball into test profile.');
await run(['plugin', '--profile', profile, 'add', seedTarball]);
console.log('Installed deterministic test session bundle.');
const child = spawn(process.execPath, [dshBin, '--profile', profile, '--no-open', '--host', '127.0.0.1', '--port', '0'], {
  cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { logs += chunk.toString(); });
let browser;
let page;
try {
  let address;
  for (let attempt = 0; attempt < 240; attempt++) {
    if (child.exitCode !== null) throw new Error(`DSH exited early (${child.exitCode}): ${logs.slice(-6000)}`);
    address = logs.match(/https?:\/\/127\.0\.0\.1:\d+(?:\/[^\s]*)?/)?.[0];
    // The CLI emits this URL only after binding. A separate Node fetch cannot
    // perform the browser's trust-cookie handshake and must not gate readiness.
    if (address) break;
    await pause(250);
  }
  if (!address) throw new Error(`DSH did not report a loopback URL: ${logs.slice(-6000)}`);
  const localChromium = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'ms-playwright', 'chromium-1248', 'chrome-win64', 'chrome.exe');
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ?? (localChromium && existsSync(localChromium) ? localChromium : undefined);
  browser = await chromium.launch({ headless: true, executablePath });
  page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
    recordVideo: { dir: output, size: { width: 1600, height: 1000 } },
  });
  const errors = [];
  const externalBilibiliRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const url = new URL(request.url());
    if (/(?:^|\.)(?:bilibili\.com|bilivideo\.com|hdslb\.com|biliapi\.(?:com|net)|b23\.tv)$/i.test(url.hostname)) {
      externalBilibiliRequests.push(`${url.origin}${url.pathname}`);
    }
  });
  // Test-only observation: retain native media without replacing its
  // playback methods, metadata, clock or browser autoplay policy.
  await page.addInitScript(() => {
    window.__wineAudioElements = [];
    const createElement = Document.prototype.createElement;
    Document.prototype.createElement = function (...args) {
      const element = Reflect.apply(createElement, this, args);
      if (element instanceof HTMLAudioElement) window.__wineAudioElements.push(element);
      return element;
    };
  });
  await page.addLocatorHandler(page.getByText('预览版说明', { exact: true }), async () => {
    await page.getByRole('button', { name: '继续', exact: true }).click();
  });
  await page.addLocatorHandler(page.getByRole('button', { name: '稍后配置', exact: true }), async later => {
    await later.click();
  });
  await page.goto(address, { waitUntil: 'networkidle' });
  console.log('Loaded real DSH browser UI.');
  const hostOrigin = new URL(page.url()).origin;
  const staticMedia = {
    audio: await verifyStaticAsset(page, hostOrigin, mediaPaths.audio, join(root, 'src/assets/BV1hXbN6VEKV.mp3'), 'audio/mpeg'),
    image: await verifyStaticAsset(page, hostOrigin, mediaPaths.image, join(root, 'src/assets/whale-girl.png'), 'image/png'),
  };
  const staticMediaPassed = Object.values(staticMedia).every(asset => asset.passed);
  console.log('Verified authenticated same-origin GET, HEAD and Range requests for packaged media.');
  const workspace = page.getByText('D友の酒 验收工作区', { exact: true }).first();
  await workspace.waitFor({ state: 'visible', timeout: 30_000 });
  const seededChat = page.getByText('D友の酒 · 本地验收', { exact: true }).first();
  if (!await seededChat.isVisible()) await workspace.click();
  console.log('Opened isolated acceptance workspace.');
  await seededChat.waitFor({ state: 'visible', timeout: 30_000 });
  await seededChat.click();
  console.log('Opened deterministic session through real DSH sidebar.');
  const completedGroup = page.locator('[data-turn-process][aria-expanded="false"]').first();
  await completedGroup.waitFor({ state: 'visible' });
  await completedGroup.click();
  const toolGroup = page.locator('[data-process-activity="tools"][aria-expanded="false"]').first();
  if (await toolGroup.isVisible()) await toolGroup.click();
  await page.locator('[data-tool="read_file"]').waitFor({ state: 'visible' });
  await pause(250);
  const wine = page.locator('[data-action=toggle]');
  await wine.waitFor({ state: 'visible', timeout: 30_000 });
  await wine.click();
  await page.getByRole('button', { name: '开喝', exact: true }).waitFor({ state: 'visible' });
  const musicDefaults = await page.evaluate(() => ({
    enabled: document.querySelector('#wine-music-enabled').checked,
    playingAudio: window.__wineAudioElements.filter(media => !media.paused).length,
    bundledAudio: window.__wineAudioElements.filter(media => media.hasAttribute('data-wine-audio')).length,
    video: document.querySelectorAll('iframe,video').length,
  }));
  const musicCredit = await page.locator('[data-wine-music-source]').evaluate(link => ({
    href: link.href, target: link.target, rel: [...link.relList], text: link.textContent,
  }));
  await page.screenshot({ path: join(output, 'dsh-host.png'), fullPage: true });
  await writeFile(join(output, 'dsh-host.html'), (await page.content()).replace(/([?&]token=)[^\s&"']+/g, '$1[redacted]'));
  await page.getByRole('button', { name: '开喝', exact: true }).click();
  await page.mouse.move(1, 1);
  await pause(800);
  const coverage = await page.evaluate(() => {
    const counts = {};
    const groups = {
      messages: '[data-chat-flow-kind],[data-chat-flow-key]:not([data-chat-group-key])',
      text: '[data-chat-flow] p,[data-chat-flow] h1,[data-chat-flow] h2,[data-chat-flow] li,[data-streaming]',
      input: '[data-composer-card],[data-composer-input],textarea,[role=textbox]',
      sidebar: '[data-slot="sidebar"] *,[data-slot^="sidebar."] *',
      tools: '[data-tool],[data-chat-call-id],pre,table,:has(> [data-code-block-content])',
    };
    const participates = element => {
      for (let node = element; node; node = node.parentElement) {
        if (node.getAnimations().some(animation => animation.id.startsWith('dsh-dyou-wine:'))) return true;
      }
      return false;
    };
    for (const [category, selector] of Object.entries(groups)) counts[category] = [...document.querySelectorAll(selector)]
      .filter(participates).length;
    return counts;
  });
  const animatedElements = await page.evaluate(() => document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length);
  const codeMotion = await page.evaluate(() => {
    const own = element => element.getAnimations().some(animation => animation.id.startsWith('dsh-dyou-wine:'));
    const inherited = element => {
      for (let node = element; node; node = node.parentElement) if (own(node)) return true;
      return false;
    };
    const wrappers = [...document.querySelectorAll(':has(> [data-code-block-content])')];
    return { wrappers: wrappers.filter(own).length, effectiveWrappers: wrappers.filter(inherited).length,
      scrollingSurfaces: [...document.querySelectorAll('[data-code-block-content]')].filter(own).length };
  });
  const emergencyStopAnimations = await page.locator('[data-action=stop]').evaluate(element => element.getAnimations().length);
  // Observe the simplified reference-style loop on real rendered roots. Children
  // inherit their parent's motion instead of multiplying a second oscillation.
  const referenceMotion = await page.evaluate(async () => {
    const selectors = {
      messages: '[data-chat-flow-kind],[data-chat-flow-key]:not([data-chat-group-key])',
      sidebar: '[data-slot="sidebar"] *,[data-slot^="sidebar."] *',
    };
    const samples = {};
    const targets = Object.entries(selectors).map(([category, selector]) => ({
      category, elements: [...document.querySelectorAll(selector)].filter(element =>
        element.getAnimations().some(animation => animation.id.startsWith('dsh-dyou-wine:'))
          && getComputedStyle(element).transform === 'none')
        .map(element => {
          const animation = element.getAnimations().find(animation => animation.id.startsWith('dsh-dyou-wine:'));
          return { element, animation, bottom: element.getBoundingClientRect().bottom,
            startTime: Number(animation.startTime), duration: Number(animation.effect.getTiming().duration),
            frames: JSON.stringify(animation.effect.getKeyframes()) };
        }),
    }));
    for (const { category } of targets) samples[category] = {
      minY: 0, maxY: 0, minScaleY: 1, maxScaleY: 1, maxBottomDrift: 0,
      sameDirectionScaleSamples: 0, maxRotation: 0, frames: 0, roots: targets.find(target => target.category === category).elements.length,
    };
    let phaseMismatchSamples = 0;
    let nestedAnimationSamples = 0;
    let nativeNotRunningSamples = 0;
    let changedWaveformSamples = 0;
    let maxNativeClockErrorMs = 0;
    const started = performance.now();
    do {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const signs = [];
      for (const { category, elements } of targets) {
        const sample = samples[category];
        for (const { element, animation, bottom, startTime, duration, frames } of elements) {
          if (animation.playState !== 'running') nativeNotRunningSamples++;
          if (Number(animation.effect.getTiming().duration) !== duration
            || JSON.stringify(animation.effect.getKeyframes()) !== frames) changedWaveformSamples++;
          maxNativeClockErrorMs = Math.max(maxNativeClockErrorMs,
            Math.abs(Number(animation.currentTime) - (Number(document.timeline.currentTime) - startTime)));
          const style = getComputedStyle(element);
          const y = Number.parseFloat(style.translate.split(/\s+/)[1]) || 0;
          const scale = style.scale.split(/\s+/).map(Number);
          const sx = Number.isFinite(scale[0]) ? scale[0] : 1;
          const sy = Number.isFinite(scale[1]) ? scale[1] : sx;
          sample.minY = Math.min(sample.minY, y);
          sample.maxY = Math.max(sample.maxY, y);
          sample.minScaleY = Math.min(sample.minScaleY, sy);
          sample.maxScaleY = Math.max(sample.maxScaleY, sy);
          sample.maxBottomDrift = Math.max(sample.maxBottomDrift, Math.abs(element.getBoundingClientRect().bottom - bottom));
          if ((sx - 1) * (sy - 1) > 0.0001) sample.sameDirectionScaleSamples++;
          sample.maxRotation = Math.max(sample.maxRotation, Math.abs(Number.parseFloat(style.rotate) || 0));
          if (Math.abs(sy - 1) > 0.003) signs.push(Math.sign(sy - 1));
          for (let parent = element.parentElement; parent; parent = parent.parentElement) {
            if (parent.getAnimations().some(animation => animation.id.startsWith('dsh-dyou-wine:'))) nestedAnimationSamples++;
          }
        }
        sample.frames++;
      }
      if (new Set(signs).size > 1) phaseMismatchSamples++;
    } while (performance.now() - started < 4200);
    return { groups: samples, phaseMismatchSamples, nestedAnimationSamples,
      nativeNotRunningSamples, changedWaveformSamples, maxNativeClockErrorMs };
  });
  const referencePassed = referenceMotion.groups.messages.minScaleY < 0.82 && referenceMotion.groups.messages.maxScaleY > 1.15
    && referenceMotion.groups.sidebar.minScaleY < 0.89 && referenceMotion.groups.sidebar.maxScaleY > 1.09
    && Object.values(referenceMotion.groups).every(sample => sample.maxRotation === 0 && sample.frames > 100 && sample.roots > 0
      && sample.minY === 0 && sample.maxY === 0 && sample.maxBottomDrift < 0.75 && sample.sameDirectionScaleSamples === 0)
    && referenceMotion.phaseMismatchSamples === 0 && referenceMotion.nestedAnimationSamples === 0
    && referenceMotion.nativeNotRunningSamples === 0 && referenceMotion.changedWaveformSamples === 0
    && referenceMotion.maxNativeClockErrorMs < 0.5;
  await page.screenshot({ path: join(output, 'dsh-host-expanded.png'), fullPage: true });
  await page.locator('[data-action=toggle]').click();
  await page.mouse.move(1, 1);
  await page.screenshot({ path: join(output, 'dsh-host.png'), fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await pause(400);
  await page.screenshot({ path: join(output, 'dsh-host-dark.png'), fullPage: true });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.getByRole('button', { name: '醒酒', exact: true }).first().click();
  await pause(150);
  const animationsAfterStop = await page.evaluate(() => document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length);
  // Exercise the packaged pet on the real host as well as the legacy page mode.
  await page.setViewportSize({ width: 700, height: 500 });
  await page.locator('[data-action=toggle]').click();
  await page.locator('#wine-page-enabled').uncheck();
  await page.locator('#wine-pet-enabled').check();
  await page.locator('[data-action=start]').click();
  await page.locator('[data-wine-pet-sprite]').evaluate(image => image.decode());
  await page.locator('[data-action=toggle]').click();
  const petMotion = await page.locator('[data-wine-pet]').evaluate(async root => {
    const animation = root.getAnimations({ subtree: true })[0];
    await animation.ready;
    const target = animation.effect.target;
    const startTime = Number(animation.startTime);
    const frames = JSON.stringify(animation.effect.getKeyframes());
    const samples = [];
    const started = performance.now();
    while (performance.now() - started < 5000) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const rect = root.getBoundingClientRect();
      const sprite = root.querySelector('[data-wine-pet-sprite]').getBoundingClientRect();
      const [sx, sy] = getComputedStyle(target).scale.split(' ').map(Number);
      const current = root.getAnimations({ subtree: true })[0];
      samples.push({ x: rect.x, y: rect.y, left: sprite.left, top: sprite.top,
        right: sprite.right, bottom: sprite.bottom, sx, sy,
        stable: current === animation && Number(current.startTime) === startTime
          && Number(current.effect.getTiming().duration) === 500
          && JSON.stringify(current.effect.getKeyframes()) === frames });
    }
    const reversals = { x: 0, y: 0 };
    for (const axis of ['x', 'y']) {
      let direction = 0;
      for (let i = 1; i < samples.length; i++) {
        const next = Math.sign(samples[i][axis] - samples[i - 1][axis]);
        if (direction && next && next !== direction) reversals[axis]++;
        if (next) direction = next;
      }
    }
    return { frames: samples.length, reversals, stable: samples.every(sample => sample.stable),
      maxOverflow: Math.max(...samples.flatMap(s => [-s.left, -s.top, s.right - innerWidth, s.bottom - innerHeight])),
      minScaleY: Math.min(...samples.map(s => s.sy)), maxScaleY: Math.max(...samples.map(s => s.sy)),
      sameDirection: samples.filter(s => (s.sx - 1) * (s.sy - 1) > 0.0001).length,
      hostEffects: document.getAnimations().filter(a => a.id.startsWith('dsh-dyou-wine:') && !root.contains(a.effect.target)).length,
      source: root.querySelector('img').src,
      sourceSameOrigin: new URL(root.querySelector('img').src).origin === location.origin,
      sourcePath: new URL(root.querySelector('img').src).pathname,
      naturalWidth: root.querySelector('img').naturalWidth, naturalHeight: root.querySelector('img').naturalHeight,
      viewport: { width: innerWidth, height: innerHeight } };
  });
  await page.screenshot({ path: join(output, 'dsh-host-pet.png'), fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: join(output, 'dsh-host-pet-dark.png'), fullPage: true });
  await page.locator('[data-action=toggle]').click();
  await page.locator('[data-action=pause]').click();
  await pause(50);
  const petPaused = await page.locator('[data-wine-pet]').evaluate(async root => {
    const before = root.style.transform;
    const animation = root.getAnimations({ subtree: true })[0];
    await animation.ready;
    const time = Number(animation.currentTime);
    await new Promise(resolve => setTimeout(resolve, 350));
    return root.style.transform === before && animation.playState === 'paused' && Number(animation.currentTime) === time;
  });
  await page.locator('[data-action=stop]').click();
  const petCleaned = await page.locator('[data-wine-pet]').count() === 0;
  const petPassed = petMotion.frames > 100 && petMotion.stable && petMotion.maxOverflow < 0.2
    && petMotion.reversals.x > 0 && petMotion.reversals.y > 0 && petMotion.sameDirection === 0
    && petMotion.minScaleY < 0.9 && petMotion.maxScaleY > 1.1 && petMotion.hostEffects === 0
    && petMotion.sourceSameOrigin && petMotion.sourcePath === mediaPaths.image
    && petMotion.naturalWidth > 0 && petMotion.naturalHeight > 0 && petPaused && petCleaned;
  // Verify both effects together in the installed bundle, on the actual DSH renderer.
  await page.locator('#wine-page-enabled').check();
  await page.locator('#wine-pet-enabled').check();
  await page.locator('[data-action=start]').click();
  await page.locator('[data-action=toggle]').click();
  await page.mouse.move(1, 1);
  await pause(350);
  const combinedMotion = await page.evaluate(async () => {
    const root = document.querySelector('[data-wine-pet]');
    const pet = root.getAnimations({ subtree: true })[0];
    const pageAnimation = document.getAnimations().find(a => a.id.startsWith('dsh-dyou-wine:') && !root.contains(a.effect.target));
    if (!pageAnimation) throw new Error('Page effect missing while pet is enabled');
    await Promise.all([pet.ready, pageAnimation.ready]);
    const effects = [pageAnimation, pet];
    const originals = effects.map(a => ({ start: Number(a.startTime), frames: JSON.stringify(a.effect.getKeyframes()) }));
    let frames = 0, maxPhaseErrorMs = 0, maxOverflow = 0, stable = true;
    const started = performance.now();
    while (performance.now() - started < 4200) {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const duration = Number(pet.effect.getTiming().duration);
      const difference = Math.abs((Number(pageAnimation.currentTime) - Number(pet.currentTime)) % duration);
      maxPhaseErrorMs = Math.max(maxPhaseErrorMs, Math.min(difference, duration - difference));
      stable &&= effects.every((a, i) => a.playState === 'running' && Number(a.startTime) === originals[i].start
        && Number(a.effect.getTiming().duration) === 500 && JSON.stringify(a.effect.getKeyframes()) === originals[i].frames);
      const sprite = root.querySelector('img').getBoundingClientRect();
      maxOverflow = Math.max(maxOverflow, -sprite.left, -sprite.top, sprite.right - innerWidth, sprite.bottom - innerHeight);
      frames++;
    }
    // Test-only witnesses stay in this isolated test page, never in the plugin.
    window.__wineCombinedWitness = { pet, page: pageAnimation };
    return { frames, maxPhaseErrorMs, stable, maxOverflow,
      pageEffects: document.getAnimations().filter(a => a.id.startsWith('dsh-dyou-wine:') && !root.contains(a.effect.target)).length,
      petEffects: root.getAnimations({ subtree: true }).length };
  });
  await page.screenshot({ path: join(output, 'dsh-host-combined.png'), fullPage: true });
  await page.locator('[data-action=toggle]').click();
  await page.locator('#wine-page-enabled').uncheck();
  await pause(100);
  const petSurvivedPageOff = await page.evaluate(() => {
    const root = document.querySelector('[data-wine-pet]');
    return root.getAnimations({ subtree: true })[0] === window.__wineCombinedWitness.pet
      && !document.getAnimations().some(a => a.id.startsWith('dsh-dyou-wine:') && !root.contains(a.effect.target));
  });
  await page.locator('#wine-page-enabled').check();
  await pause(150);
  await page.evaluate(() => {
    const root = document.querySelector('[data-wine-pet]');
    window.__wineCombinedWitness.page = document.getAnimations().find(a => a.id.startsWith('dsh-dyou-wine:') && !root.contains(a.effect.target));
  });
  await page.locator('#wine-pet-enabled').uncheck();
  await pause(100);
  const pageSurvivedPetOff = await page.evaluate(() => !document.querySelector('[data-wine-pet]')
    && window.__wineCombinedWitness.page.playState === 'running'
    && document.getAnimations().includes(window.__wineCombinedWitness.page));
  await page.locator('#wine-pet-enabled').check();
  await pause(100);
  await page.locator('[data-action=stop]').click();
  const combinedCleaned = await page.evaluate(() => !document.querySelector('[data-wine-pet]')
    && !document.getAnimations().some(a => a.id.startsWith('dsh-dyou-wine:')));
  const combinedPassed = combinedMotion.frames > 100 && combinedMotion.maxPhaseErrorMs < 0.05
    && combinedMotion.stable && combinedMotion.maxOverflow < 0.2 && combinedMotion.pageEffects > 0
    && combinedMotion.petEffects === 1 && petSurvivedPageOff && pageSurvivedPetOff && combinedCleaned;
  // Exercise the packaged recording only after the existing motion checks, so
  // media decoding cannot alter their samples or autoplay assumptions.
  await page.locator('#wine-music-enabled').check();
  const musicEnabledWhileStopped = await page.evaluate(() => ({
    enabled: document.querySelector('#wine-music-enabled').checked,
    playingAudio: window.__wineAudioElements.filter(media => !media.paused).length,
    bundledAudio: window.__wineAudioElements.filter(media => media.hasAttribute('data-wine-audio')).length,
  }));
  await page.locator('[data-action=start]').click();
  await page.waitForFunction(() => window.__wineAudioElements.some(media =>
    media.hasAttribute('data-wine-audio') && media.readyState === 4 && !media.paused),
  undefined, { timeout: 20_000 });
  const musicStarted = await page.evaluate(async () => {
    const media = window.__wineAudioElements.find(media => media.hasAttribute('data-wine-audio'));
    window.__wineBundledMusicWitness = media;
    return {
      nativeAudio: media instanceof HTMLAudioElement, duration: media.duration, readyState: media.readyState,
      paused: media.paused, muted: media.muted, loop: media.loop, volume: media.volume,
      currentTime: media.currentTime, connected: media.isConnected,
      hidden: media.hidden, owned: media.hasAttribute('data-wine-owned'), bundled: media.hasAttribute('data-wine-audio'),
      source: media.src, sourceSameOrigin: new URL(media.src).origin === location.origin,
      sourcePath: new URL(media.src).pathname,
      iframeOrVideo: document.querySelectorAll('iframe,video').length,
      mediaError: media.error?.code ?? null,
    };
  });
  musicStarted.sourceMime = staticMedia.audio.get.contentType;
  musicStarted.fetchedBytes = staticMedia.audio.get.bytes;
  musicStarted.sha256 = staticMedia.audio.get.sha256;
  await pause(650);
  const musicAdvanced = await page.evaluate(() => ({
    currentTime: window.__wineBundledMusicWitness.currentTime,
    paused: window.__wineBundledMusicWitness.paused,
    sameElement: window.__wineAudioElements.filter(media => media.hasAttribute('data-wine-audio')).length === 1,
  }));
  await page.screenshot({ path: join(output, 'dsh-host-bundled-music.png'), fullPage: true });
  await page.locator('[data-action=pause]').click();
  const musicPaused = await page.evaluate(async () => {
    const media = window.__wineBundledMusicWitness;
    const before = media.currentTime;
    await new Promise(resolve => setTimeout(resolve, 350));
    return { paused: media.paused, before, after: media.currentTime };
  });
  await page.locator('[data-action=start]').click();
  await page.waitForFunction(() => !window.__wineBundledMusicWitness.paused);
  const musicResumed = await page.evaluate(async () => {
    const media = window.__wineBundledMusicWitness;
    const before = media.currentTime;
    await new Promise(resolve => setTimeout(resolve, 650));
    return { paused: media.paused, before, after: media.currentTime,
      sameElement: window.__wineAudioElements.filter(element => element.hasAttribute('data-wine-audio')).length === 1 };
  });
  await page.keyboard.press('Escape');
  const musicEscaped = await page.evaluate(async () => {
    const media = window.__wineBundledMusicWitness;
    const before = media.currentTime;
    await new Promise(resolve => setTimeout(resolve, 350));
    return { paused: media.paused, before, after: media.currentTime,
      remainingEffects: document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length,
      remainingPet: document.querySelectorAll('[data-wine-pet]').length };
  });
  const recordingSha256 = createHash('sha256').update(await readFile(join(root, 'src', 'assets', 'BV1hXbN6VEKV.mp3'))).digest('hex');
  const bundledMusic = {
    defaults: musicDefaults, enabledWhileStopped: musicEnabledWhileStopped, credit: musicCredit,
    started: musicStarted, advanced: musicAdvanced,
    paused: musicPaused, resumed: musicResumed, escaped: musicEscaped,
    sourceSha256: recordingSha256, http: staticMedia.audio, externalBilibiliRequests,
    screenshot: '.qa/dsh-host-bundled-music.png',
    limits: ['Native HTMLAudio playback and decoded media clock are verified; physical speaker output is not monitored.',
      'Plugin hot-unload is covered by the browser lifecycle tests, not this real-host smoke run.'],
  };
  const bundledMusicPassed = !musicDefaults.enabled && musicDefaults.playingAudio === 0 && musicDefaults.bundledAudio === 0
    && musicEnabledWhileStopped.enabled && musicEnabledWhileStopped.playingAudio === 0 && musicEnabledWhileStopped.bundledAudio === 0
    && musicDefaults.video === 0 && musicCredit.href === 'https://www.bilibili.com/video/BV1hXbN6VEKV/'
    && musicCredit.target === '_blank' && musicCredit.rel.includes('noopener') && musicCredit.rel.includes('noreferrer')
    && musicCredit.text === 'BV1hXbN6VEKV'
    && musicStarted.nativeAudio && musicStarted.duration > 180 && musicStarted.readyState === 4
    && !musicStarted.paused && !musicStarted.muted && musicStarted.loop && musicStarted.volume === 0.5
    && musicStarted.connected && musicStarted.hidden && musicStarted.owned && musicStarted.bundled
    && musicStarted.sourceSameOrigin && musicStarted.sourcePath === mediaPaths.audio
    && musicStarted.sourceMime?.split(';', 1)[0].trim() === 'audio/mpeg' && staticMedia.audio.passed
    && musicStarted.sha256 === recordingSha256 && musicStarted.iframeOrVideo === 0 && musicStarted.mediaError === null
    && !musicAdvanced.paused && musicAdvanced.sameElement && musicAdvanced.currentTime > musicStarted.currentTime + 0.25
    && musicPaused.paused && Math.abs(musicPaused.after - musicPaused.before) < 0.02
    && !musicResumed.paused && musicResumed.sameElement && musicResumed.before >= musicPaused.after - 0.02
    && musicResumed.after > musicResumed.before + 0.25 && musicEscaped.paused
    && musicEscaped.before === 0 && musicEscaped.after === 0 && musicEscaped.remainingEffects === 0
    && musicEscaped.remainingPet === 0 && externalBilibiliRequests.length === 0;
  const hostPackage = JSON.parse(await readFile(resolve(dshBin, '../../package.json'), 'utf8'));
  const installedClient = await readFile(join(home, 'profiles', profile, 'node_modules', 'dsh-dyou-wine', 'lib', 'client.js'));
  const installedClientSha256 = sha256(installedClient);
  const installedClientBytes = installedClient.length;
  const clientEntryWithinMarketplaceLimit = installedClientBytes < 1_000_000;
  const report = {
    kind: 'actual-dsh-isolated-profile', timestamp: new Date().toISOString(),
    passed: errors.length === 0 && emergencyStopAnimations === 0 && animationsAfterStop === 0 && Object.values(coverage).every(count => count > 0) && referencePassed
      && codeMotion.effectiveWrappers > 0 && codeMotion.scrollingSurfaces === 0 && petPassed && combinedPassed && bundledMusicPassed
      && staticMediaPassed && clientEntryWithinMarketplaceLimit,
    dshVersion: hostPackage.version, browserVersion: browser.version(), installedClientSha256,
    installedClientBytes, clientEntryWithinMarketplaceLimit, staticMedia, staticMediaPassed,
    tarball, home, address: new URL(address).origin, panelLoaded: true, animatedElements, coverage, codeMotion,
    emergencyStopAnimations, animationsAfterStop, referenceMotion, referencePassed, coverageMode: 'own or inherited; one effect per ancestor chain', pageErrors: errors,
    petMotion, petPaused, petCleaned, petPassed, petScreenshot: '.qa/dsh-host-pet.png',
    combinedMotion, petSurvivedPageOff, pageSurvivedPetOff, combinedCleaned, combinedPassed, combinedScreenshot: '.qa/dsh-host-combined.png',
    bundledMusic, bundledMusicPassed,
    screenshot: '.qa/dsh-host.png', expandedScreenshot: '.qa/dsh-host-expanded.png',
    video: '.qa/dsh-host.webm', videoSource: 'Actual isolated DSH with deterministic seeded session; no model requests.',
    darkScreenshot: '.qa/dsh-host-dark.png', darkThemeSource: 'Browser system color-scheme preference emulation against the real host.',
    limits: ['Real DSH renderer with deterministic test-only session events; no provider credentials or real model requests.', 'Native OS IME candidate UI, desktop shell and third-party plugin compatibility are unverified.'],
  };
  await writeFile(join(output, 'dsh-host-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (errors.length) throw new Error(`Real DSH page errors: ${errors.join('; ')}`);
  if (!staticMediaPassed) throw new Error(`Real DSH static media HTTP contract failed: ${JSON.stringify(staticMedia)}`);
  if (!clientEntryWithinMarketplaceLimit) throw new Error(`Installed client entry exceeds the 1,000,000-byte marketplace limit: ${installedClientBytes}`);
  if (!bundledMusicPassed) throw new Error(`Real DSH bundled music failed: ${JSON.stringify(bundledMusic)}`);
  if (!combinedPassed) throw new Error(`Real DSH combined motion failed: ${JSON.stringify({ combinedMotion, petSurvivedPageOff, pageSurvivedPetOff, combinedCleaned })}`);
  if (!petPassed) throw new Error(`Real DSH flying pet failed: ${JSON.stringify({ petMotion, petPaused, petCleaned })}`);
  if (emergencyStopAnimations || animationsAfterStop) throw new Error('Real DSH stop control or cleanup check failed.');
  if (!referencePassed) throw new Error(`Real DSH reference-style synchronized deformation failed: ${JSON.stringify(referenceMotion)}`);
  if (Object.values(coverage).some(count => count === 0)) throw new Error(`Real DSH five-category coverage incomplete: ${JSON.stringify(coverage)}`);
  if (codeMotion.effectiveWrappers === 0 || codeMotion.scrollingSurfaces !== 0) throw new Error(`Real DSH code wrapper protection failed: ${JSON.stringify(codeMotion)}`);
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  if (page) {
    await page.screenshot({ path: join(output, 'dsh-host-failed.png'), fullPage: true }).catch(() => {});
    await writeFile(join(output, 'dsh-host-failed.html'), await page.content()).catch(() => {});
  }
  throw error;
} finally {
  const video = page?.video();
  await page?.context().close();
  if (video) await video.saveAs(join(output, 'dsh-host.webm'));
  await browser?.close();
  child.kill();
  await writeFile(join(output, 'dsh-host.log'), logs.replace(/([?&]token=)[^\s&]+/g, '$1[redacted]'));
}
