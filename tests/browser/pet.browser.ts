import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const pet = '[data-wine-pet]';
const sprite = '[data-wine-pet-sprite]';
const storageKey = 'dsh-dyou-wine.settings.v1';

async function openPanel(page: Page) {
  if (!await page.locator('[data-action=start]').isVisible()) await page.locator('[data-action=toggle]').click();
}

async function startPet(page: Page, options: { size?: number; speed?: number; bpm?: number } = {}) {
  await openPanel(page);
  await page.locator('#wine-page-enabled').uncheck();
  await page.locator('#wine-pet-enabled').check();
  await page.evaluate(options => window.__wineFixture.updateSettings({
    ...(options.size === undefined ? {} : { petSize: options.size }),
    ...(options.speed === undefined ? {} : { petSpeed: options.speed }),
    ...(options.bpm === undefined ? {} : { bpm: options.bpm }),
  }), options);
  await page.locator('[data-action=start]').click();
  await expect(page.locator(pet)).toHaveCount(1);
  await expect.poll(() => page.locator(pet).evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(1);
  await page.locator('[data-action=toggle]').click();
  await page.mouse.move(1, 1);
}

async function position(page: Page) {
  return page.locator(pet).evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y };
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/fixture/');
  await expect(page.locator('#assistant-text')).toBeVisible();
});

test('pet is opt-in, loads a transparent bundled character, and leaves host motion and input alone', async ({ page }) => {
  expect(await page.locator(pet).count()).toBe(0);
  const hostBefore = await page.locator('#host-transform').getAttribute('style');
  const externalImages: string[] = [];
  page.on('request', request => {
    if (request.resourceType() === 'image' && !request.url().startsWith('http://127.0.0.1:4179/') && !request.url().startsWith('data:')) externalImages.push(request.url());
  });
  await startPet(page);
  await expect(page.locator(`body > ${pet}`)).toHaveCount(1);
  const asset = await page.locator(sprite).evaluate(async element => {
    const image = element as HTMLImageElement;
    await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0, 64, 64);
    const pixels = context.getImageData(0, 0, 64, 64).data;
    let transparent = 0, visible = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] === 0) transparent++;
      if (pixels[index] > 128) visible++;
    }
    return { src: image.currentSrc, width: image.naturalWidth, height: image.naturalHeight, transparent, visible };
  });
  expect(asset.width).toBeGreaterThan(0); expect(asset.height).toBeGreaterThan(0);
  expect(asset.transparent).toBeGreaterThan(300); expect(asset.visible).toBeGreaterThan(300);
  expect(externalImages).toEqual([]);
  expect(await page.locator('#host-transform').getAttribute('style')).toBe(hostBefore);
  const hostAnimations = await page.evaluate(() => document.getAnimations().filter(animation => {
    const target = (animation.effect as KeyframeEffect).target;
    return animation.id.startsWith('dsh-dyou-wine:') && target instanceof Element && !target.closest('[data-wine-pet]');
  }).length);
  expect(hostAnimations).toBe(0);

  // Freeze the character, then place an actual host control under its visible
  // center and click that pixel. Locator.click() alone would miss an overlay bug.
  await openPanel(page); await page.locator('[data-action=pause]').click();
  await page.locator('[data-action=toggle]').click();
  const point = await page.locator(sprite).evaluate(element => {
    const rect = element.getBoundingClientRect();
    const x = Math.max(30, Math.min(innerWidth - 30, rect.left + rect.width / 2));
    const y = Math.max(30, Math.min(innerHeight - 30, rect.top + rect.height / 2));
    const button = document.createElement('button'); button.id = 'pet-underlying-action'; button.textContent = '宿主按钮';
    button.style.cssText = `position:fixed;left:${x - 30}px;top:${y - 20}px;width:60px;height:40px;z-index:8`;
    button.addEventListener('click', () => button.dataset.clicked = 'true'); document.body.append(button);
    return { x, y };
  });
  await page.mouse.click(point.x, point.y);
  await expect(page.locator('#pet-underlying-action')).toHaveAttribute('data-clicked', 'true');
  await page.locator('#composer').fill('桌宠运行时，中文与 English 输入正常。');
  await expect(page.locator('#composer')).toHaveValue('桌宠运行时，中文与 English 输入正常。');
});

test('multiple wall hits preserve the same native Q-bounce animation, period and waveform', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  // Fix only the random initial heading/position, so the same short recording
  // crosses both pairs of walls without a chance near-horizontal launch.
  await page.evaluate(() => { Math.random = () => 0.375; });
  await startPet(page, { size: 120, speed: 600, bpm: 120 });
  const evidence = await page.locator(pet).evaluate(async root => {
    const animation = root.getAnimations({ subtree: true })[0]; await animation.ready;
    const target = (animation.effect as KeyframeEffect).target as Element;
    const frames = JSON.stringify((animation.effect as KeyframeEffect).getKeyframes());
    const startTime = Number(animation.startTime);
    const origin = performance.now();
    const samples = [];
    while (performance.now() - origin < 4500) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const current = root.getAnimations({ subtree: true })[0];
      const rect = root.getBoundingClientRect();
      const image = root.querySelector('[data-wine-pet-sprite]')!.getBoundingClientRect();
      const style = getComputedStyle(target);
      const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
      const scale = style.scale === 'none' ? [matrix.a, matrix.d] : style.scale.split(' ').map(Number);
      const timing = current.effect!.getComputedTiming();
      samples.push({ now: Number(document.timeline.currentTime), x: rect.x, y: rect.y,
        left: image.left, right: image.right, top: image.top, bottom: image.bottom,
        sx: scale[0], sy: scale[1] ?? scale[0], iteration: timing.currentIteration,
        duration: Number(timing.duration), startTime: Number(current.startTime),
        time: Number(current.currentTime), sameAnimation: current === animation,
        sameFrames: JSON.stringify((current.effect as KeyframeEffect).getKeyframes()) === frames });
    }
    return { samples, startTime, width: innerWidth, height: innerHeight };
  });
  await mkdir('.qa', { recursive: true });
  await writeFile('.qa/pet-native-flight.json', JSON.stringify({ kind: 'synthetic-fixture-native-timeline', ...evidence }, null, 2));
  const samples = evidence.samples;
  expect(samples.length).toBeGreaterThan(100);
  expect(samples.every(sample => sample.sameAnimation && sample.sameFrames)).toBe(true);
  expect(new Set(samples.map(sample => sample.duration))).toEqual(new Set([500]));
  expect(new Set(samples.map(sample => sample.startTime))).toEqual(new Set([evidence.startTime]));
  expect(Math.max(...samples.map(sample => Math.abs(sample.time - (sample.now - sample.startTime))))).toBeLessThan(0.01);
  expect(Math.min(...samples.map(sample => sample.left))).toBeGreaterThanOrEqual(-0.1);
  expect(Math.min(...samples.map(sample => sample.top))).toBeGreaterThanOrEqual(-0.1);
  expect(Math.max(...samples.map(sample => sample.right))).toBeLessThanOrEqual(evidence.width + 0.1);
  expect(Math.max(...samples.map(sample => sample.bottom))).toBeLessThanOrEqual(evidence.height + 0.1);
  expect(Math.max(...samples.map(sample => (sample.sx - 1) * (sample.sy - 1)))).toBeLessThanOrEqual(0.0001);
  const reversals = { x: 0, y: 0 };
  const rates: number[] = [];
  let previousX = 0, previousY = 0;
  for (let index = 1; index < samples.length; index++) {
    const current = samples[index], previous = samples[index - 1];
    const dx = current.x - previous.x, dy = current.y - previous.y;
    const sx = Math.sign(dx), sy = Math.sign(dy);
    const reflected = (previousX && sx !== previousX) || (previousY && sy !== previousY);
    if (previousX && sx && sx !== previousX) reversals.x++;
    if (previousY && sy && sy !== previousY) reversals.y++;
    const dt = (current.now - previous.now) / 1000;
    // A sample straddling a wall contains outgoing and returning travel, so
    // its straight-line displacement is shorter than its actual path.
    if (!reflected && dt > 0 && dt < 0.06) rates.push(Math.hypot(dx, dy) / dt);
    if (sx) previousX = sx; if (sy) previousY = sy;
  }
  expect(reversals.x).toBeGreaterThanOrEqual(2); expect(reversals.y).toBeGreaterThanOrEqual(2);
  expect(rates.length).toBeGreaterThan(80);
  const sortedRates = rates.sort((a, b) => a - b);
  expect(sortedRates[Math.floor(sortedRates.length / 2)]).toBeCloseTo(600, 0);
  expect(sortedRates[Math.floor(sortedRates.length * 0.9)] - sortedRates[Math.floor(sortedRates.length * 0.1)]).toBeLessThan(8);
  const cycles = new Map<number, { x: number[]; y: number[] }>();
  for (const sample of samples) {
    const cycle = cycles.get(sample.iteration!) ?? { x: [], y: [] };
    cycle.x.push(sample.sx); cycle.y.push(sample.sy); cycles.set(sample.iteration!, cycle);
  }
  const complete = [...cycles.values()].slice(1, -1);
  expect(complete.length).toBeGreaterThanOrEqual(7);
  for (const cycle of complete) {
    expect(Math.min(...cycle.y)).toBeLessThan(0.96); expect(Math.max(...cycle.y)).toBeGreaterThan(1.02);
  }
  const minima = complete.map(cycle => Math.min(...cycle.y));
  const maxima = complete.map(cycle => Math.max(...cycle.y));
  expect(Math.max(...minima) - Math.min(...minima)).toBeLessThan(0.02);
  expect(Math.max(...maxima) - Math.min(...maxima)).toBeLessThan(0.02);
});

test('pause freezes flight and deformation, resume excludes paused elapsed time, and stop removes the pet', async ({ page }) => {
  await startPet(page, { speed: 300 });
  await openPanel(page); await page.locator('[data-action=pause]').click();
  const first = await page.locator(pet).evaluate(async element => {
    const animation = element.getAnimations({ subtree: true })[0];
    // Native pause commits on the next document-timeline update. Observe the
    // acknowledged pause, rather than racing its pending compositor task.
    await animation.ready;
    if (animation.playState !== 'paused') throw new Error('Pet did not pause');
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, time: animation ? Number(animation.currentTime) : null };
  });
  await page.waitForTimeout(650);
  const second = await page.locator(pet).evaluate(element => {
    const rect = element.getBoundingClientRect(); const animation = element.getAnimations({ subtree: true })[0];
    return { x: rect.x, y: rect.y, time: animation ? Number(animation.currentTime) : null };
  });
  expect(second).toEqual(first);
  await page.locator('[data-action=start]').click();
  const resumed = await position(page);
  expect(Math.hypot(resumed.x - second.x, resumed.y - second.y)).toBeLessThan(80);
  await page.waitForTimeout(180);
  const later = await position(page);
  expect(Math.hypot(later.x - resumed.x, later.y - resumed.y)).toBeGreaterThan(15);
  await page.locator('[data-action=stop]').click();
  await expect(page.locator(pet)).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length)).toBe(0);
});

test('viewport resizing keeps the complete stretched sprite within bounds', async ({ page }) => {
  await startPet(page, { size: 320, speed: 600 });
  for (const viewport of [{ width: 600, height: 440 }, { width: 260, height: 220 }, { width: 1100, height: 700 }]) {
    await page.setViewportSize(viewport);
    const bounds = await page.locator(sprite).evaluate(async element => {
      const samples = [];
      for (let index = 0; index < 40; index++) {
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        const rect = element.getBoundingClientRect();
        samples.push({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
      }
      return { samples, width: innerWidth, height: innerHeight };
    });
    expect(Math.min(...bounds.samples.map(sample => sample.left))).toBeGreaterThanOrEqual(-0.1);
    expect(Math.min(...bounds.samples.map(sample => sample.top))).toBeGreaterThanOrEqual(-0.1);
    expect(Math.max(...bounds.samples.map(sample => sample.right))).toBeLessThanOrEqual(bounds.width + 0.1);
    expect(Math.max(...bounds.samples.map(sample => sample.bottom))).toBeLessThanOrEqual(bounds.height + 0.1);
  }
});

test('independent switches persist while removed advanced settings reset to defaults without activating', async ({ page }) => {
  await startPet(page, { size: 210, speed: 420, bpm: 90 });
  await openPanel(page);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(saved).toMatchObject({ pageEnabled: false, petEnabled: true, petSize: 210, petSpeed: 420, bpm: 90 });
  expect(saved).not.toHaveProperty('mode');
  await page.locator('#wine-page-enabled').check();
  await expect(page.locator(pet)).toHaveCount(1);
  await expect.poll(() => page.locator('#assistant-message').evaluate(element => element.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length)).toBe(1);
  await page.locator('#wine-pet-enabled').uncheck();
  await expect(page.locator(pet)).toHaveCount(0);
  await expect.poll(() => page.locator('#assistant-message').evaluate(element => element.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length)).toBe(1);
  await page.locator('#wine-page-enabled').uncheck();
  await expect.poll(() => page.locator('#assistant-message').evaluate(element => element.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length)).toBe(0);
  await page.locator('#wine-pet-enabled').check();
  await expect(page.locator(pet)).toHaveCount(1);
  await page.evaluate(() => window.__wineFixture.updateSettings({
    intensity: 0, offsetMs: 125, hiddenAudio: true, shortcut: 'K', loop: false,
    ranges: { messages: false, text: false, input: false, sidebar: false, controls: false, tools: false, dialogs: false },
    preset: 'wild',
  }));
  await page.reload(); await openPanel(page);
  await expect(page.locator('#wine-page-enabled')).not.toBeChecked();
  await expect(page.locator('#wine-pet-enabled')).toBeChecked();
  expect(await page.evaluate(() => window.__wineFixture.settings())).toMatchObject({
    pageEnabled: false, petEnabled: true, preset: 'wild',
    petSize: 180, petSpeed: 180, bpm: 120, intensity: 65, offsetMs: 0,
    hiddenAudio: false, shortcut: 'Escape', loop: true,
    ranges: { messages: true, text: true, input: true, sidebar: true, controls: true, tools: true, dialogs: true },
  });
  await expect(page.locator('#wine-pet-size, #wine-pet-speed, #wine-bpm')).toHaveCount(0);
  // Persisted preference never means persisted activation.
  await expect(page.locator(pet)).toHaveCount(0);
});

test('visibility pauses flight, Escape stops it, and plugin unmount removes all pet effects', async ({ page }) => {
  await startPet(page, { speed: 240 });
  await page.evaluate(() => window.__wineFixture.setHidden(true));
  const first = await position(page);
  await page.waitForTimeout(350);
  expect(await position(page)).toEqual(first);
  await page.evaluate(() => window.__wineFixture.setHidden(false));
  await page.waitForTimeout(180);
  const resumed = await position(page);
  expect(Math.hypot(resumed.x - first.x, resumed.y - first.y)).toBeGreaterThan(10);
  await page.keyboard.press('Escape');
  await expect(page.locator(pet)).toHaveCount(0);
  await openPanel(page); await page.locator('[data-action=start]').click();
  await expect(page.locator(pet)).toHaveCount(1);
  await page.evaluate(() => window.__wineFixture.unmount());
  await expect(page.locator(pet)).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length)).toBe(0);
  await page.setViewportSize({ width: 700, height: 500 });
  await page.waitForTimeout(100);
  await expect(page.locator(pet)).toHaveCount(0);
});
