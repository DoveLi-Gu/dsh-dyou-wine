import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __musicAnimationWitness: { page: Animation; pet: Animation };
    __bundledMusicElements: HTMLAudioElement[];
  }
}

async function openPanel(page: Page) {
  if (!await page.locator('[data-action=start]').isVisible()) await page.locator('[data-action=toggle]').click();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__bundledMusicElements = [];
    const create = Document.prototype.createElement;
    Document.prototype.createElement = function (this: Document, tag: string, options?: ElementCreationOptions) {
      const element = create.call(this, tag, options);
      if (tag.toLowerCase() === 'audio') window.__bundledMusicElements.push(element as HTMLAudioElement);
      return element;
    } as typeof create;
  });
  await page.goto('/tests/fixture/');
  await expect(page.locator('#assistant-text')).toBeVisible();
  await openPanel(page);
});

test('the compact panel exposes independent effects, three presets and music without advanced or local audio controls', async ({ page }) => {
  const panel = page.locator('#dyou-wine-panel');
  await expect(panel.locator('input')).toHaveCount(3);
  await expect(panel.locator('input:not([type=checkbox]), select, details, input[type=file]')).toHaveCount(0);
  await expect(panel.locator('#wine-bpm, #wine-offset, #wine-intensity, #wine-volume, #wine-seek, #wine-pet-size, #wine-pet-speed, [data-range]')).toHaveCount(0);
  await expect(panel).not.toContainText(/本地音频|上传音频|节拍偏移|后台音频|快捷键设置/);
  await expect(panel.locator('#wine-page-enabled')).toBeChecked();
  await expect(panel.locator('#wine-pet-enabled')).not.toBeChecked();
  await expect(panel.locator('#wine-music-enabled')).not.toBeChecked();
  await expect(panel.locator('[data-preset]')).toHaveCount(3);
  for (const preset of ['tipsy', 'party', 'wild'] as const) {
    await panel.locator(`[data-preset=${preset}]`).click();
    await expect(panel.locator('[data-preset][aria-pressed=true]')).toHaveCount(1);
    await expect(panel.locator(`[data-preset=${preset}]`)).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => window.__wineFixture.settings().preset)).toBe(preset);
  }
  await panel.locator('#wine-pet-enabled').check();
  await expect(page.locator('[data-wine-pet]')).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await panel.locator('[data-action=start]').click();
  await expect(page.locator('[data-wine-pet]')).toHaveCount(1);
  await page.mouse.move(1, 1);
  await expect.poll(() => page.locator('#user-message').evaluate(element => element.getAnimations().length)).toBe(1);
});

test('bundled music is opt-in, loops locally and keeps its position through pause, visibility and independent toggles', async ({ page }) => {
  const requests: string[] = [];
  await page.route(/^https?:\/\//, async route => {
    if (new URL(route.request().url()).origin !== 'http://127.0.0.1:4179') {
      requests.push(route.request().url());
      await route.abort();
    } else await route.continue();
  });
  const audio = () => page.evaluate(() => {
    const element = window.__bundledMusicElements.at(-1);
    return element ? { paused: element.paused, time: element.currentTime, duration: element.duration,
      loop: element.loop, volume: element.volume, src: element.currentSrc || element.src,
      connected: element.isConnected } : null;
  });
  const source = page.locator('[data-wine-music-source]');
  await expect(source).toHaveText('BV1hXbN6VEKV');
  await expect(source).toHaveAttribute('href', 'https://www.bilibili.com/video/BV1hXbN6VEKV/');
  await expect(source).toHaveAttribute('target', '_blank');
  expect((await source.getAttribute('rel'))?.split(/\s+/)).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
  expect((await audio())?.paused ?? true).toBe(true);
  await page.locator('#wine-music-enabled').check();
  await page.waitForTimeout(100);
  expect((await audio())?.paused ?? true).toBe(true);
  expect(requests).toEqual([]);
  // Arming music while stopped and starting visual effects while it is disabled
  // must not play the recording.
  await page.locator('#wine-music-enabled').uncheck();
  await page.locator('#wine-pet-enabled').check();
  await page.locator('[data-action=start]').click();
  await page.mouse.move(1, 1);
  await expect(page.locator('[data-wine-pet]')).toHaveCount(1);
  await expect.poll(() => page.locator('#user-message').evaluate(element => element.getAnimations().length)).toBe(1);
  await page.evaluate(async () => {
    const page = document.querySelector('#user-message')!.getAnimations()[0];
    const pet = document.querySelector('[data-wine-pet]')!.getAnimations({ subtree: true })[0];
    await Promise.all([page.ready, pet.ready]);
    window.__musicAnimationWitness = { page, pet };
  });
  await page.locator('#wine-music-enabled').check();
  await expect.poll(async () => (await audio())?.paused).toBe(false);
  await expect.poll(async () => (await audio())?.time ?? 0).toBeGreaterThan(0.15);
  const playing = (await audio())!;
  expect(playing.duration).toBeGreaterThan(180);
  expect(playing.loop).toBe(true);
  expect(playing.volume).toBe(0.5);
  expect(playing.src).toMatch(/^(?:http:\/\/127\.0\.0\.1:4179\/|data:audio\/)/);
  await expect(page.locator('iframe, video, [data-wine-music]')).toHaveCount(0);
  expect(await page.evaluate(() => ({
    page: document.querySelector('#user-message')!.getAnimations()[0] === window.__musicAnimationWitness.page,
    pet: document.querySelector('[data-wine-pet]')!.getAnimations({ subtree: true })[0] === window.__musicAnimationWitness.pet,
  }))).toEqual({ page: true, pet: true });
  await page.locator('#wine-music-enabled').uncheck();
  await expect.poll(async () => (await audio())?.paused).toBe(true);
  const disabledTime = (await audio())!.time;
  await page.waitForTimeout(180);
  expect((await audio())!.time).toBeCloseTo(disabledTime, 2);
  expect(await page.evaluate(() => ({
    page: document.querySelector('#user-message')!.getAnimations()[0] === window.__musicAnimationWitness.page,
    pet: document.querySelector('[data-wine-pet]')!.getAnimations({ subtree: true })[0] === window.__musicAnimationWitness.pet,
  }))).toEqual({ page: true, pet: true });
  await page.locator('#wine-music-enabled').check();
  await expect.poll(async () => (await audio())?.time ?? 0).toBeGreaterThan(disabledTime + 0.1);
  // Disabling either effect must leave the native recording running.
  await page.locator('#wine-page-enabled').uncheck();
  await page.locator('#wine-pet-enabled').uncheck();
  expect((await audio())!.paused).toBe(false);
  const withoutEffectsTime = (await audio())!.time;
  await expect.poll(async () => (await audio())?.time ?? 0).toBeGreaterThan(withoutEffectsTime + 0.1);
  await page.locator('#wine-page-enabled').check();
  await page.locator('#wine-pet-enabled').check();
  await page.locator('[data-action=pause]').click();
  await expect.poll(async () => (await audio())?.paused).toBe(true);
  const pausedTime = (await audio())!.time;
  await page.waitForTimeout(180);
  expect((await audio())!.time).toBeCloseTo(pausedTime, 2);
  await page.locator('[data-action=start]').click();
  await expect.poll(async () => (await audio())?.time ?? 0).toBeGreaterThan(pausedTime + 0.1);
  await page.evaluate(() => window.__wineFixture.setHidden(true));
  await expect.poll(async () => (await audio())?.paused).toBe(true);
  const hiddenTime = (await audio())!.time;
  await page.waitForTimeout(180);
  expect((await audio())!.time).toBeCloseTo(hiddenTime, 2);
  await page.evaluate(() => window.__wineFixture.setHidden(false));
  await expect.poll(async () => (await audio())?.time ?? 0).toBeGreaterThan(hiddenTime + 0.1);
  // Exercise the native loop boundary without waiting for the entire song.
  await page.evaluate(() => {
    const element = window.__bundledMusicElements.at(-1)!;
    element.currentTime = element.duration - 0.12;
  });
  await expect.poll(async () => (await audio())!.time, { timeout: 5_000 }).toBeLessThan(1.5);
  expect((await audio())!.paused).toBe(false);
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await audio())?.paused).toBe(true);
  expect((await audio())!.time).toBe(0);
  await page.locator('[data-action=start]').click();
  await expect.poll(async () => (await audio())?.time ?? 0).toBeGreaterThan(0.1);
  await page.evaluate(() => window.__wineFixture.unmount());
  await expect(page.locator('iframe')).toHaveCount(0);
  expect(await page.evaluate(() => window.__bundledMusicElements.every(element => element.paused && !element.getAttribute('src') && !element.isConnected))).toBe(true);
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length)).toBe(0);
});

test('a rejected recording playback reports an error while both fixed rhythm effects continue', async ({ page }) => {
  await page.evaluate(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (this instanceof HTMLAudioElement && !this.src.startsWith('blob:')) {
        return Promise.reject(new DOMException('Playback was blocked in the test', 'NotAllowedError'));
      }
      return play.call(this);
    };
  });
  await page.locator('#wine-music-enabled').check();
  await page.locator('#wine-pet-enabled').check();
  await page.locator('[data-action=start]').click();
  await page.mouse.move(1, 1);
  await expect(page.locator('[data-error]')).toBeVisible();
  await expect(page.locator('[data-state]')).toContainText('正在律动');
  await expect.poll(() => page.locator('#user-message').evaluate(element => element.getAnimations().length)).toBe(1);
  await expect(page.locator('[data-wine-pet]')).toHaveCount(1);
  const first = await page.evaluate(() => ({
    page: Number(document.querySelector('#user-message')!.getAnimations()[0].currentTime),
    pet: Number(document.querySelector('[data-wine-pet]')!.getAnimations({ subtree: true })[0].currentTime),
  }));
  await page.waitForTimeout(600);
  const later = await page.evaluate(() => ({
    page: Number(document.querySelector('#user-message')!.getAnimations()[0].currentTime),
    pet: Number(document.querySelector('[data-wine-pet]')!.getAnimations({ subtree: true })[0].currentTime),
    durations: [document.querySelector('#user-message')!.getAnimations()[0], document.querySelector('[data-wine-pet]')!.getAnimations({ subtree: true })[0]].map(animation => animation.effect!.getComputedTiming().duration),
  }));
  expect(later.page - first.page).toBeGreaterThan(450);
  expect(later.pet - first.pet).toBeGreaterThan(450);
  expect(Math.abs(later.page - later.pet)).toBeLessThan(0.05);
  expect(later.durations).toEqual([500, 500]);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length)).toBe(0);
});
