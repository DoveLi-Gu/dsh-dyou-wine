import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

async function openPanel(page: Page) {
  if (!await page.locator('[data-action=start]').isVisible()) await page.locator('[data-action=toggle]').click();
}

async function startBoth(page: Page, fast = false) {
  await openPanel(page);
  await page.locator('#wine-page-enabled').check();
  await page.locator('#wine-pet-enabled').check();
  await page.evaluate(fast => window.__wineFixture.updateSettings({
    bpm: 120, ...(fast ? { petSize: 120, petSpeed: 600 } : {}),
  }), fast);
  await page.locator('[data-action=start]').click();
  await page.locator('[data-action=toggle]').click();
  await page.mouse.move(1, 1);
  await expect(page.locator('[data-wine-pet]')).toHaveCount(1);
  await expect.poll(() => page.locator('#user-message').evaluate(element => element.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length)).toBe(1);
}

function phaseDistance(first: number, second: number, duration: number) {
  const difference = Math.abs(first - second) % duration;
  return Math.min(difference, duration - difference);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/fixture/');
  await expect(page.locator('#assistant-text')).toBeVisible();
});

test('page and flying pet share a stable native rhythm across many cycles and wall reflections', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.evaluate(() => { Math.random = () => 0.375; });
  await startBoth(page, true);
  const evidence = await page.evaluate(async () => {
    const root = document.querySelector<HTMLElement>('[data-wine-pet]')!;
    const pageRoot = document.querySelector('#user-message')!;
    const pageAnimation = pageRoot.getAnimations()[0];
    const petAnimation = root.getAnimations({ subtree: true })[0];
    await Promise.all([pageAnimation.ready, petAnimation.ready]);
    const frames = [pageAnimation, petAnimation].map(animation => JSON.stringify((animation.effect as KeyframeEffect).getKeyframes()));
    const origins = [Number(pageAnimation.startTime), Number(petAnimation.startTime)];
    const read = (animation: Animation) => {
      const target = (animation.effect as KeyframeEffect).target as Element;
      const timing = animation.effect!.getComputedTiming();
      const scale = getComputedStyle(target).scale.split(' ').map(Number);
      return { time: Number(animation.currentTime), origin: Number(animation.startTime),
        duration: Number(timing.duration), iteration: timing.currentIteration, progress: timing.progress,
        sy: scale[1] ?? scale[0], playState: animation.playState };
    };
    const samples = [];
    const began = performance.now();
    while (performance.now() - began < 4500) {
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      const currentPage = pageRoot.getAnimations()[0];
      const currentPet = root.getAnimations({ subtree: true })[0];
      const rect = root.getBoundingClientRect();
      samples.push({ timeline: Number(document.timeline.currentTime), x: rect.x, y: rect.y,
        page: read(currentPage), pet: read(currentPet),
        samePage: currentPage === pageAnimation, samePet: currentPet === petAnimation,
        pageFrames: JSON.stringify((currentPage.effect as KeyframeEffect).getKeyframes()) === frames[0],
        petFrames: JSON.stringify((currentPet.effect as KeyframeEffect).getKeyframes()) === frames[1] });
    }
    const sprite = root.querySelector('[data-wine-pet-sprite]')!;
    const branchAnimations = [];
    for (let element: Element | null = sprite; element; element = element.parentElement) {
      branchAnimations.push(...element.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).map(animation => animation.id));
    }
    return { samples, origins, branchAnimations, petSubtreeCount: root.getAnimations({ subtree: true }).length };
  });
  await mkdir('.qa', { recursive: true });
  await writeFile('.qa/combined-native-rhythm.json', JSON.stringify({ kind: 'synthetic-fixture-page-and-pet-native-timeline', ...evidence }, null, 2));
  expect(evidence.samples.length).toBeGreaterThan(100);
  expect(evidence.samples.every(sample => sample.samePage && sample.samePet && sample.pageFrames && sample.petFrames)).toBe(true);
  expect(new Set(evidence.samples.flatMap(sample => [sample.page.duration, sample.pet.duration]))).toEqual(new Set([500]));
  expect(new Set(evidence.samples.map(sample => sample.page.origin))).toEqual(new Set([evidence.origins[0]]));
  expect(new Set(evidence.samples.map(sample => sample.pet.origin))).toEqual(new Set([evidence.origins[1]]));
  expect(evidence.samples.every(sample => sample.page.playState === 'running' && sample.pet.playState === 'running')).toBe(true);
  expect(Math.max(...evidence.samples.map(sample => phaseDistance(sample.page.time, sample.pet.time, 500)))).toBeLessThan(0.05);
  expect(Math.max(...evidence.samples.flatMap(sample => [
    Math.abs(sample.page.time - (sample.timeline - sample.page.origin)),
    Math.abs(sample.pet.time - (sample.timeline - sample.pet.origin)),
  ]))).toBeLessThan(0.01);
  // Both characters stretch and squash on the same half-cycle, even though
  // their amplitudes and geometric anchors intentionally differ.
  expect(Math.min(...evidence.samples.map(sample => (sample.page.sy - 1) * (sample.pet.sy - 1)))).toBeGreaterThanOrEqual(-0.0001);
  expect(evidence.petSubtreeCount).toBe(1);
  expect(evidence.branchAnimations).toEqual(['dsh-dyou-wine:pet:q']);
  let bounces = 0, previousX = 0, previousY = 0;
  for (let index = 1; index < evidence.samples.length; index++) {
    const current = evidence.samples[index], previous = evidence.samples[index - 1];
    const x = Math.sign(current.x - previous.x), y = Math.sign(current.y - previous.y);
    if (previousX && x && previousX !== x) bounces++;
    if (previousY && y && previousY !== y) bounces++;
    if (x) previousX = x; if (y) previousY = y;
  }
  expect(bounces).toBeGreaterThanOrEqual(4);
  const pageIterations = evidence.samples.map(sample => sample.page.iteration!);
  const petIterations = evidence.samples.map(sample => sample.pet.iteration!);
  expect(Math.max(...pageIterations) - Math.min(...pageIterations)).toBeGreaterThanOrEqual(8);
  expect(Math.max(...petIterations) - Math.min(...petIterations)).toBeGreaterThanOrEqual(8);
});

test('independent toggles preserve the other engine and rejoin the shared rhythm, BPM and offset', async ({ page }) => {
  await startBoth(page);
  const evidence = await page.evaluate(async () => {
    const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const pageRoot = document.querySelector('#user-message')!;
    const pageAnimation = () => pageRoot.getAnimations().find(animation => animation.id.startsWith('dsh-dyou-wine:'));
    const petRoot = () => document.querySelector<HTMLElement>('[data-wine-pet]');
    const petAnimation = () => petRoot()?.getAnimations({ subtree: true })[0];
    const toggle = (id: string, enabled: boolean) => {
      const input = document.querySelector<HTMLInputElement>(id)!;
      if (input.checked !== enabled) input.click();
    };
    const waitFor = async (get: () => Animation | undefined) => {
      const deadline = performance.now() + 2000;
      while ((!get() || get()!.effect!.getComputedTiming().progress === null) && performance.now() < deadline) await frame();
      const animation = get(); if (!animation) throw new Error('Effect did not start');
      await animation.ready; return animation;
    };
    const read = (animation: Animation) => ({ time: Number(animation.currentTime), origin: Number(animation.startTime),
      duration: Number(animation.effect!.getComputedTiming().duration), frames: JSON.stringify((animation.effect as KeyframeEffect).getKeyframes()) });
    const beforePage = await waitFor(pageAnimation), beforePet = await waitFor(petAnimation);
    const originalPage = read(beforePage), originalPet = read(beforePet);
    const positionBefore = petRoot()!.getBoundingClientRect();
    toggle('#wine-page-enabled', false);
    const positionAfter = petRoot()!.getBoundingClientRect();
    await frame(); await frame();
    const pageOff = { pageCount: pageRoot.getAnimations().length, samePet: petAnimation() === beforePet,
      pet: read(petAnimation()!), immediateJump: Math.hypot(positionAfter.x - positionBefore.x, positionAfter.y - positionBefore.y) };
    toggle('#wine-page-enabled', true);
    const rejoinedPage = await waitFor(pageAnimation);
    const pageJoined = { page: read(rejoinedPage), pet: read(petAnimation()!), samePet: petAnimation() === beforePet };
    const retainedPage = read(rejoinedPage);
    toggle('#wine-pet-enabled', false);
    await frame(); await frame();
    const petOff = { petCount: document.querySelectorAll('[data-wine-pet]').length, samePage: pageAnimation() === rejoinedPage, page: read(pageAnimation()!) };
    toggle('#wine-pet-enabled', true);
    const rejoinedPet = await waitFor(petAnimation);
    const petJoined = { samePage: pageAnimation() === rejoinedPage, page: read(pageAnimation()!), pet: read(rejoinedPet) };
    window.__wineFixture.updateSettings({ bpm: 150 }); await frame(); await frame();
    const bpm = { samePage: pageAnimation() === rejoinedPage, samePet: petAnimation() === rejoinedPet, page: read(pageAnimation()!), pet: read(petAnimation()!) };
    window.__wineFixture.updateSettings({ offsetMs: 125 }); await frame(); await frame();
    const offset = { samePage: pageAnimation() === rejoinedPage, samePet: petAnimation() === rejoinedPet, page: read(pageAnimation()!), pet: read(petAnimation()!) };
    const beforeStrength = { page: read(pageAnimation()!), pet: read(petAnimation()!) };
    window.__wineFixture.updateSettings({ intensity: 90 }); await frame(); await frame();
    const strength = { samePage: pageAnimation() === rejoinedPage, samePet: petAnimation() === rejoinedPet, page: read(pageAnimation()!), pet: read(petAnimation()!) };
    toggle('#wine-page-enabled', false); toggle('#wine-pet-enabled', false);
    await frame(); await frame();
    const bothOff = document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length;
    // Disabling effects leaves the shared source clock running.
    for (let index = 0; index < 8; index++) await frame();
    toggle('#wine-page-enabled', true); toggle('#wine-pet-enabled', true);
    await waitFor(pageAnimation); await waitFor(petAnimation);
    const bothRejoined = { page: read(pageAnimation()!), pet: read(petAnimation()!) };
    return { originalPage, originalPet, pageOff, pageJoined, retainedPage, petOff, petJoined, bpm, offset, beforeStrength, strength, bothOff, bothRejoined };
  });
  expect(evidence.pageOff.pageCount).toBe(0);
  expect(evidence.pageOff.samePet).toBe(true);
  expect(evidence.pageOff.immediateJump).toBe(0);
  expect(evidence.pageOff.pet.origin).toBe(evidence.originalPet.origin);
  expect(evidence.pageOff.pet.frames).toBe(evidence.originalPet.frames);
  expect(evidence.pageJoined.samePet).toBe(true);
  expect(evidence.pageJoined.pet.origin).toBe(evidence.originalPet.origin);
  expect(evidence.pageJoined.pet.frames).toBe(evidence.originalPet.frames);
  expect(evidence.petOff.petCount).toBe(0);
  expect(evidence.petOff.samePage).toBe(true);
  expect(evidence.petOff.page.origin).toBe(evidence.retainedPage.origin);
  expect(evidence.petOff.page.frames).toBe(evidence.retainedPage.frames);
  expect(evidence.petJoined.samePage).toBe(true);
  expect(evidence.petJoined.page.origin).toBe(evidence.retainedPage.origin);
  for (const sample of [evidence.pageJoined, evidence.petJoined, evidence.bpm, evidence.offset, evidence.strength, evidence.bothRejoined]) {
    expect(sample.page.duration).toBe(sample.pet.duration);
    expect(phaseDistance(sample.page.time, sample.pet.time, sample.page.duration)).toBeLessThan(0.05);
  }
  expect(evidence.bpm.samePage && evidence.bpm.samePet && evidence.offset.samePage && evidence.offset.samePet).toBe(true);
  expect(evidence.bpm.page.duration).toBe(400); expect(evidence.bpm.pet.duration).toBe(400);
  expect(phaseDistance(evidence.offset.page.origin - evidence.bpm.page.origin, 125, 400)).toBeLessThan(0.05);
  expect(phaseDistance(evidence.offset.pet.origin - evidence.bpm.pet.origin, 125, 400)).toBeLessThan(0.05);
  expect(evidence.strength.samePage && evidence.strength.samePet).toBe(true);
  expect(evidence.strength.page.origin).toBe(evidence.beforeStrength.page.origin);
  expect(evidence.strength.pet.origin).toBe(evidence.beforeStrength.pet.origin);
  expect(evidence.strength.page.frames).not.toBe(evidence.beforeStrength.page.frames);
  expect(evidence.strength.pet.frames).not.toBe(evidence.beforeStrength.pet.frames);
  expect(evidence.bothOff).toBe(0);
});

test('pause, background, resume, Escape and unmount control both effects together', async ({ page }) => {
  await startBoth(page);
  await openPanel(page);
  await page.locator('[data-action=pause]').click();
  const paused = await page.locator('[data-wine-pet]').evaluate(async element => {
    const animation = element.getAnimations({ subtree: true })[0]; await animation.ready;
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, time: Number(animation.currentTime), state: animation.playState };
  });
  expect(paused.state).toBe('paused');
  expect(await page.locator('#user-message').evaluate(element => element.getAnimations().length)).toBe(0);
  await page.waitForTimeout(300);
  const held = await page.locator('[data-wine-pet]').evaluate(element => {
    const animation = element.getAnimations({ subtree: true })[0]; const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, time: Number(animation.currentTime), state: animation.playState };
  });
  expect(held).toEqual(paused);
  await page.locator('[data-action=start]').click();
  await expect.poll(() => page.locator('#user-message').evaluate(element => element.getAnimations().length)).toBe(1);
  const readPhase = async () => page.evaluate(async () => {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    const a = document.querySelector('#user-message')!.getAnimations()[0];
    const b = document.querySelector('[data-wine-pet]')!.getAnimations({ subtree: true })[0];
    await Promise.all([a.ready, b.ready]);
    return { page: Number(a.currentTime), pet: Number(b.currentTime), duration: Number(a.effect!.getComputedTiming().duration) };
  });
  const resumed = await readPhase();
  expect(phaseDistance(resumed.page, resumed.pet, resumed.duration)).toBeLessThan(0.05);
  await page.evaluate(() => window.__wineFixture.setHidden(true));
  const hidden = await page.locator('[data-wine-pet]').evaluate(async element => {
    const animation = element.getAnimations({ subtree: true })[0]; await animation.ready;
    const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y, time: Number(animation.currentTime) };
  });
  expect(await page.locator('#user-message').evaluate(element => element.getAnimations().length)).toBe(0);
  await page.waitForTimeout(250);
  expect(await page.locator('[data-wine-pet]').evaluate(element => {
    const animation = element.getAnimations({ subtree: true })[0]; const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, time: Number(animation.currentTime) };
  })).toEqual(hidden);
  await page.evaluate(() => window.__wineFixture.setHidden(false));
  await expect.poll(() => page.locator('#user-message').evaluate(element => element.getAnimations().length)).toBe(1);
  const visible = await readPhase();
  expect(phaseDistance(visible.page, visible.pet, visible.duration)).toBeLessThan(0.05);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-wine-pet]')).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length)).toBe(0);
  await page.locator('[data-action=start]').click();
  await expect(page.locator('[data-wine-pet]')).toHaveCount(1);
  await expect.poll(() => page.locator('#user-message').evaluate(element => element.getAnimations().length)).toBe(1);
  await page.evaluate(() => window.__wineFixture.unmount());
  await expect(page.locator('[data-wine-pet]')).toHaveCount(0);
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length)).toBe(0);
});
