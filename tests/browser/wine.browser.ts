import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

declare global {
  interface Window {
    __fixtureMedia: HTMLAudioElement[];
    __fixtureRevokedUrls: string[];
    __hostAnimation: Animation;
  }
}

async function openPanel(page: Page) {
  const start = page.locator('[data-action=start]');
  if (!await start.isVisible()) await page.locator('[data-action=toggle]').click();
  await expect(start).toBeVisible();
}
async function start(page: Page) {
  await openPanel(page);
  await page.locator('[data-action=start]').click();
  await page.mouse.move(1, 1);
  await expect.poll(() => motionCountOnChain(page, '#assistant-text')).toBeGreaterThan(0);
}
async function animationCount(page: Page, selector: string) {
  return await page.locator(selector).evaluate(element => element.getAnimations().length);
}
async function motionCountOnChain(page: Page, selector: string) {
  return await page.locator(selector).evaluate(element => {
    let count = 0;
    for (let current: Element | null = element; current; current = current.parentElement) count += current.getAnimations().length;
    return count;
  });
}
function waveFile(seconds = 2): Buffer {
  const rate = 16_000;
  const samples = rate * seconds;
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36);
  buffer.writeUInt32LE(samples * 2, 40);
  for (let index = 0; index < samples; index++) {
    const envelope = Math.max(0, 1 - (index % (rate / 2)) / (rate / 10));
    buffer.writeInt16LE(Math.round(Math.sin(index / rate * Math.PI * 2 * 220) * envelope * 1200), 44 + index * 2);
  }
  return buffer;
}

test.beforeEach(async ({ page }) => {
  // Observe the detached native audio element without adding a production debug API.
  await page.addInitScript(() => {
    window.__fixtureMedia = [];
    const create = Document.prototype.createElement;
    Document.prototype.createElement = function (this: Document, tag: string, options?: ElementCreationOptions) {
      const element = create.call(this, tag, options);
      if (tag.toLowerCase() === 'audio') window.__fixtureMedia.push(element as HTMLAudioElement);
      return element;
    } as typeof create;
  });
  await page.goto('/tests/fixture/');
  await expect(page.locator('#assistant-text')).toBeVisible();
});

test('starts only after opt-in and moves each visual branch through a single animated root', async ({ page }) => {
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await start(page);
  for (const selector of ['#user-message', '#assistant-text', '#tool-card', '#code-card', '#composer-card', '#sidebar-session']) {
    await expect.poll(() => motionCountOnChain(page, selector), { message: `${selector} participates once` }).toBe(1);
  }
  expect(await animationCount(page, '#assistant-text')).toBe(0);
  expect(await animationCount(page, '#tool-card')).toBe(0);
  expect(await animationCount(page, '#code-card')).toBe(0);
  expect(await animationCount(page, '#code-scroll')).toBe(0);
  expect(await animationCount(page, '#code-block')).toBe(0);
  const scale = await page.locator('#assistant-message').evaluate(element => getComputedStyle(element).scale);
  expect(scale).not.toBe('none');
  await mkdir('.qa', { recursive: true });
  await page.screenshot({ path: '.qa/fixture-running.png', fullPage: true });
  await page.getByRole('button', { name: '醒酒', exact: true }).first().click();
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('eight native timeline cycles repeat the same grounded waveform in phase across all regions', async ({ page }) => {
  const evidence = await page.evaluate(async () => {
    window.__wineFixture.unmount();
    const engineModule = '/src/motion/engine.ts';
    const settingsModule = '/src/settings.ts';
    const [{ WineEngine }, { defaults }] = await Promise.all([import(engineModule), import(settingsModule)]);
    const origin = performance.now();
    const errors: string[] = [];
    const engine = new WineEngine(document, () => (performance.now() - origin) / 1000, (error: Error) => errors.push(error.message));
    const selectors = ['#user-message', '#assistant-message', '#composer-card', '#sidebar-session'];
    const elements = selectors.map(selector => document.querySelector<HTMLElement>(selector)!);
    const baselines = elements.map(element => {
      const { top, left, width, height, bottom } = element.getBoundingClientRect();
      return { top, left, width, height, bottom };
    });
    const frame = () => new Promise<void>(done => requestAnimationFrame(() => done()));
    const samples = [];
    engine.start(defaults);
    try {
      await frame(); await frame();
      const animations = elements.map(element => element.getAnimations().find(animation => animation.id.startsWith('dsh-dyou-wine:'))!);
      await Promise.all(animations.map(animation => animation.ready));
      const initialFrames = animations.map(animation => JSON.stringify((animation.effect as KeyframeEffect).getKeyframes()));
      const firstIteration = animations[0].effect!.getComputedTiming().currentIteration ?? 0;
      while ((animations[0].effect!.getComputedTiming().currentIteration ?? 0) < firstIteration + 8) {
        await frame();
        const regions = elements.map((element, index) => {
          const animation = element.getAnimations().find(animation => animation.id.startsWith('dsh-dyou-wine:'))!;
          const timing = animation.effect!.getComputedTiming();
          const style = getComputedStyle(element);
          const [sx = 1, sy = sx] = style.scale.split(' ').map(Number);
          const [x = 0, y = 0] = style.translate.split(' ').map(Number.parseFloat);
          const { bottom, height } = element.getBoundingClientRect();
          const frames = (animation.effect as KeyframeEffect).getKeyframes();
          const progress = timing.progress!;
          const left = Math.min(frames.length - 2, Math.floor(progress * (frames.length - 1)));
          const fraction = progress * (frames.length - 1) - left;
          const scale = (frame: ComputedKeyframe) => {
            const [x, y = x] = String(frame.scale).split(' ').map(Number);
            return y;
          };
          const expectedScaleY = scale(frames[left]) * (1 - fraction) + scale(frames[left + 1]) * fraction;
          return { selector: selectors[index], position: Number(animation.currentTime), progress,
            iteration: timing.currentIteration, startTime: Number(animation.startTime), duration: Number(timing.duration),
            sx, sy, x, y, expectedScaleY, rotate: Number.parseFloat(style.rotate), bottom, height,
            sameAnimation: animation === animations[index], sameFrames: JSON.stringify(frames) === initialFrames[index],
            playState: animation.playState,
            ownAnimations: element.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length };
        });
        samples.push({ timeline: Number(document.timeline.currentTime), regions });
      }
      const nested = ['#assistant-text', '#tool-card', '#code-card', '#composer', '#send-button'].map(selector => {
        const element = document.querySelector(selector)!;
        let chain = 0;
        for (let current: Element | null = element; current; current = current.parentElement) {
          chain += current.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length;
        }
        return { selector, own: element.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length, chain };
      });
      const coverage = engine.snapshot();
      engine.update({ ...defaults, ranges: { ...defaults.ranges, messages: false } });
      await frame(); await frame();
      const withoutMessages = ['#user-message', '#assistant-message', '#assistant-text', '#tool-card', '#code-card'].map(selector => ({
        selector, own: document.querySelector(selector)!.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length,
      }));
      return { errors, baselines, samples, nested, coverage, withoutMessages };
    } finally { engine.stop(); }
  });
  await mkdir('.qa', { recursive: true });
  await writeFile(join('.qa', 'periodic-reference-trajectory.json'), JSON.stringify({ kind: 'synthetic-fixture-native-timeline', reference: 'fixed-periodic-squash-stretch', cycles: 8, bpm: 120, ...evidence }, null, 2));
  expect(evidence.errors).toEqual([]);
  expect(evidence.samples.length).toBeGreaterThan(160);
  const states = evidence.samples.flatMap(sample => sample.regions.map((current, region) => ({
    ...current,
    timelineError: Math.abs(current.position - (sample.timeline - current.startTime)),
    siblingPositionError: Math.abs(current.position - sample.regions[0].position),
    siblingStartError: Math.abs(current.startTime - sample.regions[0].startTime),
    scaleError: Math.abs(current.sy - current.expectedScaleY),
    bottomError: Math.abs(current.bottom - evidence.baselines[region].bottom),
  })));
  // Aggregate every recorded high-refresh sample before assertions, so the
  // test runner does not generate tens of thousands of trace assertion steps.
  expect(Math.max(...states.map(state => state.timelineError))).toBeLessThan(0.0001);
  expect(Math.max(...states.map(state => state.siblingPositionError))).toBeLessThan(0.0001);
  expect(Math.max(...states.map(state => state.siblingStartError))).toBeLessThan(0.0001);
  expect(new Set(states.map(state => state.duration))).toEqual(new Set([500]));
  expect(new Set(states.map(state => state.ownAnimations))).toEqual(new Set([1]));
  expect(new Set(states.map(state => state.playState))).toEqual(new Set(['running']));
  expect(states.every(state => state.sameAnimation && state.sameFrames)).toBe(true);
  // Computed CSS/keyframes serialize to about six significant digits.
  expect(Math.max(...states.map(state => state.scaleError))).toBeLessThan(0.00005);
  expect(Math.max(...states.map(state => state.bottomError))).toBeLessThan(0.005);
  expect(states.every(state => state.x === 0 && state.y === 0 && state.rotate === 0)).toBe(true);
  expect(Math.max(...states.map(state => (state.sx - 1) * (state.sy - 1)))).toBeLessThanOrEqual(0.0001);
  for (let region = 0; region < evidence.baselines.length; region++) {
    const cycles = new Map<number, number[]>();
    for (const sample of evidence.samples) {
      const state = sample.regions[region];
      const values = cycles.get(state.iteration!) ?? [];
      values.push(state.sy); cycles.set(state.iteration!, values);
    }
    // The first and final sampled cycles may be partial. All seven complete
    // intervening cycles must reach the same extrema at the unchanged period.
    for (const values of [...cycles.values()].slice(1, -1)) {
      expect(Math.min(...values)).toBeLessThan(0.9);
      expect(Math.max(...values)).toBeGreaterThan(1.05);
    }
    const full = [...cycles.values()].slice(1, -1);
    const minima = full.map(values => Math.min(...values));
    const maxima = full.map(values => Math.max(...values));
    expect(Math.max(...minima) - Math.min(...minima)).toBeLessThan(0.008);
    expect(Math.max(...maxima) - Math.min(...maxima)).toBeLessThan(0.008);
  }
  for (const nested of evidence.nested) {
    expect(nested.own, `${nested.selector} follows its visual root`).toBe(0);
    expect(nested.chain, `${nested.selector} has only one animated ancestor`).toBe(1);
  }
  expect(evidence.coverage.categories.messages).toBeGreaterThan(0);
  expect(evidence.coverage.categories.text).toBeGreaterThan(0);
  expect(evidence.coverage.categories.tools).toBeGreaterThan(0);
  expect(evidence.withoutMessages.find(target => target.selector === '#assistant-message')?.own).toBe(0);
  expect(evidence.withoutMessages.find(target => target.selector === '#assistant-text')?.own).toBe(1);
  expect(evidence.withoutMessages.find(target => target.selector === '#tool-card')?.own).toBe(1);
  expect(evidence.withoutMessages.find(target => target.selector === '#code-card')?.own).toBe(0);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('a protected region schedules neutral reentry on the shared native timeline', async ({ page }) => {
  const result = await page.evaluate(async () => {
    window.__wineFixture.unmount();
    const engineModule = '/src/motion/engine.ts';
    const settingsModule = '/src/settings.ts';
    const [{ WineEngine }, { defaults }] = await Promise.all([import(engineModule), import(settingsModule)]);
    const origin = performance.now();
    const errors: string[] = [];
    const engine = new WineEngine(document, () => (performance.now() - origin) / 1000, (error: Error) => errors.push(error.message));
    const input = document.querySelector<HTMLTextAreaElement>('#composer')!;
    const root = document.querySelector<HTMLElement>('#composer-card')!;
    const baseline = root.getBoundingClientRect();
    const frame = () => new Promise<void>(done => requestAnimationFrame(() => done()));
    const read = () => {
      const animation = root.getAnimations().find(animation => animation.id.startsWith('dsh-dyou-wine:'));
      const style = getComputedStyle(root);
      const [sx = 1, sy = sx] = style.scale === 'none' ? [1, 1] : style.scale.split(' ').map(Number);
      const { top, bottom, height } = root.getBoundingClientRect();
      const timing = animation?.effect!.getComputedTiming();
      const sibling = document.querySelector('#user-message')!.getAnimations().find(animation => animation.id.startsWith('dsh-dyou-wine:'));
      return { planned: Boolean(animation), active: timing?.progress != null, position: animation ? Number(animation.currentTime) : null,
        progress: timing?.progress ?? null, sx, sy, top, bottom, height,
        siblingPosition: Number(sibling?.currentTime), timeline: Number(document.timeline.currentTime) };
    };
    input.focus();
    engine.start(defaults);
    try {
      await frame(); await frame();
      const protectedState = read();
      input.blur();
      const releasedAt = Number(document.timeline.currentTime);
      const waiting = [];
      let joined = read();
      while (!joined.active && Number(document.timeline.currentTime) - releasedAt < 1500) {
        waiting.push(joined);
        await frame(); joined = read();
      }
      const firstJoined = joined;
      const firstJoinedAt = Number(document.timeline.currentTime);
      while (Number(document.timeline.currentTime) - firstJoinedAt < 100) await frame();
      return { errors, baseline: { top: baseline.top, bottom: baseline.bottom, height: baseline.height },
        protectedState, waiting, firstJoined, later: read(), elapsedBeforeJoin: firstJoinedAt - releasedAt };
    } finally { engine.stop(); }
  });
  expect(result.errors).toEqual([]);
  expect(result.protectedState.planned).toBe(false);
  expect(result.protectedState.active).toBe(false);
  expect(result.waiting.length).toBeGreaterThan(5);
  expect(result.waiting.every(state => !state.active && state.sx === 1 && state.sy === 1)).toBe(true);
  expect(result.waiting.some(state => state.planned && state.position! < 0)).toBe(true);
  expect(result.elapsedBeforeJoin).toBeGreaterThanOrEqual(170);
  expect(result.firstJoined.active).toBe(true);
  expect(result.firstJoined.progress).toBeLessThan(0.09);
  expect(result.firstJoined.sy).toBeLessThan(1.06);
  expect(result.firstJoined.bottom).toBeCloseTo(result.baseline.bottom, 2);
  expect(result.later.sy).toBeGreaterThan(1.05);
  const phase = (time: number) => ((time % 500) + 500) % 500;
  expect(phase(result.later.position!)).toBeCloseTo(phase(result.later.siblingPosition), 5);
  expect(result.later.bottom).toBeCloseTo(result.baseline.bottom, 2);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('a main-thread long task does not make native animation time stall or need per-frame seeks', async ({ page }) => {
  const blockingMs = 280;
  const evidence = await page.evaluate(async (blockingMs) => {
    window.__wineFixture.unmount();
    const engineModule = '/src/motion/engine.ts';
    const settingsModule = '/src/settings.ts';
    const [{ WineEngine }, { defaults }] = await Promise.all([import(engineModule), import(settingsModule)]);
    const descriptor = Object.getOwnPropertyDescriptor(Animation.prototype, 'currentTime')!;
    let explicitSeeks = 0;
    Object.defineProperty(Animation.prototype, 'currentTime', { ...descriptor, set(value) { explicitSeeks++; descriptor.set!.call(this, value); } });
    const origin = performance.now();
    const errors: string[] = [];
    const engine = new WineEngine(document, () => (performance.now() - origin) / 1000, (error: Error) => errors.push(error.message));
    const frame = () => new Promise<number>(done => requestAnimationFrame(done));
    engine.start(defaults);
    try {
      await frame(); await frame();
      const roots = ['#user-message', '#assistant-message', '#composer-card', '#sidebar-session'];
      const animations = roots.map(selector => document.querySelector(selector)!.getAnimations().find(animation => animation.id.startsWith('dsh-dyou-wine:'))!);
      await Promise.all(animations.map(animation => animation.ready));
      const baselineFrameTimes: number[] = [];
      for (let index = 0; index < 7; index++) baselineFrameTimes.push(await frame());
      const baselineIntervalsMs = baselineFrameTimes.slice(1).map((time, index) => time - baselineFrameTimes[index]);
      const sortedIntervals = [...baselineIntervalsMs].sort((left, right) => left - right);
      const medianFrameMs = (sortedIntervals[2] + sortedIntervals[3]) / 2;
      // Both samples can land on adjacent rendering boundaries. Allow two
      // measured frames plus clock rounding, capped at two 30 Hz frames so
      // an overloaded baseline cannot excuse a genuinely stalled timeline.
      const frameIntervalMs = Math.min(1000 / 30, Math.max(1000 / 120, medianFrameMs));
      const samplingAllowanceMs = 2 * frameIntervalMs + 1;
      const read = () => ({ wallMs: performance.now(), timeline: Number(document.timeline.currentTime),
        currentTimes: animations.map(animation => Number(animation.currentTime)),
        startTimes: animations.map(animation => Number(animation.startTime)),
        states: animations.map(animation => animation.playState),
        progress: animations.map(animation => animation.effect!.getComputedTiming().progress),
      });
      const before = read();
      const block = { startWallMs: 0, endWallMs: 0, elapsedMs: 0 };
      // Do not inspect timeline/currentTime inside this stack: browsers are
      // allowed to expose the same sampled timeline time throughout one task.
      // A previously queued rAF may still carry a pre-task timestamp. Wait for
      // the following rendering opportunity before assessing elapsed time.
      await new Promise<void>(done => setTimeout(() => {
        block.startWallMs = performance.now();
        const end = block.startWallMs + blockingMs;
        while (performance.now() < end) { /* deliberate test-only long task */ }
        block.endWallMs = performance.now();
        block.elapsedMs = block.endWallMs - block.startWallMs;
        requestAnimationFrame(() => done());
      }, 0));
      await frame();
      const after = read();
      await frame();
      const following = read();
      const wallElapsedMs = after.wallMs - before.wallMs;
      const timelineElapsedMs = after.timeline - before.timeline;
      return { errors, before, after, following, explicitSeeks, block,
        baselineIntervalsMs, medianFrameMs, frameIntervalMs, samplingAllowanceMs,
        wallElapsedMs, timelineElapsedMs, samplingDriftMs: wallElapsedMs - timelineElapsedMs,
        identitiesKept: roots.every((selector, index) => document.querySelector(selector)!.getAnimations().includes(animations[index])) };
    } finally { engine.stop(); Object.defineProperty(Animation.prototype, 'currentTime', descriptor); }
  }, blockingMs);
  await writeFile(join('.qa', 'native-timeline-long-task.json'), JSON.stringify({ kind: 'synthetic-fixture-long-task', ...evidence }, null, 2));
  expect(evidence.errors).toEqual([]);
  expect(evidence.identitiesKept).toBe(true);
  expect(evidence.explicitSeeks).toBe(0);
  expect(evidence.block.elapsedMs).toBeGreaterThanOrEqual(blockingMs);
  expect(evidence.samplingAllowanceMs).toBeLessThanOrEqual(2 * (1000 / 30) + 1);
  expect(Math.abs(evidence.samplingDriftMs)).toBeLessThanOrEqual(evidence.samplingAllowanceMs);
  expect(evidence.timelineElapsedMs).toBeGreaterThanOrEqual(evidence.block.elapsedMs - evidence.samplingAllowanceMs);
  for (let index = 0; index < 4; index++) {
    expect(evidence.after.currentTimes[index] - evidence.before.currentTimes[index])
      .toBeCloseTo(evidence.after.timeline - evidence.before.timeline, 4);
    expect(evidence.after.startTimes[index]).toBe(evidence.before.startTimes[index]);
    expect(evidence.following.startTimes[index]).toBe(evidence.before.startTimes[index]);
    expect(evidence.following.currentTimes[index]).toBeGreaterThan(evidence.after.currentTimes[index]);
    expect(evidence.after.states[index]).toBe('running');
    expect(evidence.after.currentTimes[index]).toBeCloseTo(evidence.after.currentTimes[0], 5);
  }
});

test('source clock seeks and non-whole-beat loops realign native roots while ordinary time stays continuous', async ({ page }) => {
  const evidence = await page.evaluate(async () => {
    window.__wineFixture.unmount();
    const engineModule = '/src/motion/engine.ts';
    const settingsModule = '/src/settings.ts';
    const [{ WineEngine }, { defaults }] = await Promise.all([import(engineModule), import(settingsModule)]);
    const origin = performance.now();
    let sourceOffset = 2;
    let settings = defaults;
    const sourceTime = () => (performance.now() - origin) / 1000 + sourceOffset;
    const errors: string[] = [];
    const engine = new WineEngine(document, sourceTime, (error: Error) => errors.push(error.message));
    const roots = ['#user-message', '#assistant-message', '#composer-card', '#sidebar-session'];
    const frame = () => new Promise<void>(done => requestAnimationFrame(() => done()));
    const settle = async () => { await frame(); await frame(); };
    engine.start(settings);
    try {
      await settle();
      const animations = roots.map(selector => document.querySelector(selector)!.getAnimations().find(animation => animation.id.startsWith('dsh-dyou-wine:'))!);
      await Promise.all(animations.map(animation => animation.ready));
      const read = (event: string) => ({ event, sourceTime: sourceTime(), bpm: settings.bpm, offsetMs: settings.offsetMs,
        roots: animations.map((animation, index) => ({ position: Number(animation.currentTime), startTime: Number(animation.startTime),
          duration: Number(animation.effect!.getComputedTiming().duration), playState: animation.playState,
          sameAnimation: document.querySelector(roots[index])!.getAnimations().includes(animation) })) });
      const samples = [read('initial')];
      const until = performance.now() + 150;
      while (performance.now() < until) await frame();
      samples.push(read('ordinary time'));
      sourceOffset += 0.37;
      await settle(); samples.push(read('forward seek 370ms'));
      sourceOffset -= 1.71;
      await settle(); samples.push(read('backward loop 1710ms'));
      settings = { ...defaults, bpm: 96, offsetMs: 125 };
      engine.update(settings);
      await settle(); samples.push(read('explicit BPM and offset change'));
      await settle(); samples.push(read('ordinary time after settings'));
      return { errors, samples };
    } finally { engine.stop(); }
  });
  await writeFile('.qa/native-source-clock-alignment.json', JSON.stringify({ kind: 'synthetic-source-clock-discontinuities', ...evidence }, null, 2));
  expect(evidence.errors).toEqual([]);
  for (const sample of evidence.samples) {
    const duration = 60000 / sample.bpm;
    const phase = (time: number) => ((time % duration) + duration) % duration;
    const expected = phase(sample.sourceTime * 1000 - sample.offsetMs);
    for (const root of sample.roots) {
      const delta = Math.abs(phase(root.position) - expected);
      expect(Math.min(delta, duration - delta)).toBeLessThan(20);
      expect(root.duration).toBe(duration);
      expect(root.playState).toBe('running');
      expect(root.sameAnimation).toBe(true);
      expect(root.position).toBeCloseTo(sample.roots[0].position, 5);
    }
  }
  const starts = evidence.samples.map(sample => sample.roots[0].startTime);
  expect(starts[1]).toBe(starts[0]);
  expect(starts[2]).not.toBe(starts[1]);
  expect(starts[3]).not.toBe(starts[2]);
  expect(starts[4]).not.toBe(starts[3]);
  expect(starts[5]).toBe(starts[4]);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('geometry-only pointer boundary events do not interrupt a fixed cycle, while real pointer movement protects controls', async ({ page }) => {
  await start(page);
  const initial = await page.locator('#sidebar-session').evaluate(element => {
    const animation = element.getAnimations().find(animation => animation.id.startsWith('dsh-dyou-wine:'))!;
    Object.assign(window, { __stationaryPointerAnimation: animation });
    return { startTime: Number(animation.startTime) };
  });
  const geometry = await page.locator('#sidebar-session').evaluate(async element => {
    const samples = [];
    const end = performance.now() + 1200;
    while (performance.now() < end) {
      // CSS geometry changes can emit boundary events under an unmoved pointer.
      // They are deliberately not accompanied by a pointermove or pointerdown.
      element.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, relatedTarget: document.body }));
      element.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: document.body }));
      await new Promise<void>(done => requestAnimationFrame(() => done()));
      const animation = element.getAnimations().find(animation => animation.id.startsWith('dsh-dyou-wine:'));
      samples.push({ active: Boolean(animation), sameAnimation: animation === (window as unknown as { __stationaryPointerAnimation: Animation }).__stationaryPointerAnimation,
        startTime: Number(animation?.startTime), currentTime: Number(animation?.currentTime), state: animation?.playState });
    }
    return samples;
  });
  await writeFile('.qa/stationary-pointer-rhythm.json', JSON.stringify({ kind: 'synthetic-boundary-events-without-pointer-movement', initial, samples: geometry }, null, 2));
  expect(geometry.every(state => state.active && state.sameAnimation && state.startTime === initial.startTime && state.state === 'running')).toBe(true);
  expect(geometry.at(-1)!.currentTime).toBeGreaterThan(geometry[0].currentTime + 900);
  await page.locator('#sidebar-session').hover({ force: true });
  await expect.poll(() => motionCountOnChain(page, '#sidebar-session')).toBe(0);
  await page.mouse.move(1, 1);
  await expect.poll(() => motionCountOnChain(page, '#sidebar-session')).toBe(1);
});

test('focus, simulated IME composition and input sending preserve text and freeze its ancestors', async ({ page }) => {
  await start(page);
  await page.locator('[data-action=toggle]').click();
  const input = page.locator('#composer');
  await input.focus();
  await expect.poll(() => motionCountOnChain(page, '#composer')).toBe(0);
  await input.dispatchEvent('compositionstart', { data: '中文' });
  await input.fill('中文输入 English 123');
  await input.dispatchEvent('compositionupdate', { data: '中文输入' });
  await expect.poll(() => motionCountOnChain(page, '#composer')).toBe(0);
  await expect(input).toHaveValue('中文输入 English 123');
  await input.dispatchEvent('compositionend', { data: '中文输入' });
  // Native pointer entry freezes the animated control before Playwright's stable-click check.
  await page.locator('#send-button').hover({ force: true });
  await expect.poll(() => motionCountOnChain(page, '#send-button')).toBe(0);
  await page.locator('#send-button').click();
  await expect(page.locator('[data-chat-flow-key^="appended-"] p')).toHaveText('中文输入 English 123');
  await expect(input).toHaveValue('');
  // The expanded coverage now animates the non-interactive header itself.
  // A native pixel click remains valid while it moves; Locator.click's
  // stable-element precondition is not appropriate for this blur action.
  const header = (await page.locator('header').boundingBox())!;
  await page.mouse.click(header.x + header.width / 2, header.y + header.height / 2);
  await page.mouse.move(1, 1);
  await expect.poll(() => animationCount(page, '#composer-card')).toBeGreaterThan(0);
});

test('selection keeps paragraph and code copy strings unchanged', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const original = await page.locator('#assistant-text').textContent();
  const code = await page.locator('#code-block').textContent();
  await page.locator('#code-block').evaluate(element => {
    const range = document.createRange(); range.selectNodeContents(element);
    const selection = getSelection()!; selection.removeAllRanges(); selection.addRange(range);
  });
  await page.keyboard.press('ControlOrMeta+C');
  const baselineClipboard = await page.evaluate(() => navigator.clipboard.readText());
  await page.evaluate(() => getSelection()?.removeAllRanges());
  await start(page);
  const selected = await page.locator('#assistant-text').evaluate(element => {
    const range = document.createRange(); range.selectNodeContents(element);
    const selection = getSelection()!; selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
    return selection.toString();
  });
  expect(selected).toBe(original);
  await expect.poll(() => motionCountOnChain(page, '#assistant-text')).toBe(0);
  const selectedCode = await page.locator('#code-block').evaluate(element => {
    const range = document.createRange(); range.selectNodeContents(element);
    const selection = getSelection()!; selection.removeAllRanges(); selection.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
    return selection.toString();
  });
  expect(selectedCode).toBe(code);
  await page.keyboard.press('ControlOrMeta+C');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(baselineClipboard);
  await expect(page.locator('#code-block code')).toHaveCount(1);
  expect(await page.locator('#assistant-text').textContent()).toBe(original);
});

test('incremental streaming and new messages keep the original text nodes and structure', async ({ page }) => {
  await page.locator('#stream-text').evaluate(element => { Object.assign(window, { __originalStreamNode: element.firstChild }); });
  await start(page);
  const before = await page.locator('#stream-text').textContent();
  const tail = ' 第二段。第三段 English。';
  for (const token of tail) await page.evaluate(token => window.__wineFixture.appendStream(token), token);
  await expect(page.locator('#stream-text')).toHaveText(before! + tail);
  expect(await page.locator('#stream-text').evaluate(element => element.firstChild === (window as unknown as { __originalStreamNode: Node }).__originalStreamNode)).toBe(true);
  await expect(page.locator('#stream-text *')).toHaveCount(0);
  const key = await page.evaluate(() => window.__wineFixture.appendMessage());
  await expect.poll(() => animationCount(page, `[data-chat-flow-key="${key}"]`)).toBeGreaterThan(0);
  await expect(page.locator(`[data-chat-flow-key="${key}"] p`)).toHaveCount(1);
});

test('host transform and independently running host animation survive stop', async ({ page }) => {
  const originalStyle = await page.locator('#host-transform').getAttribute('style');
  await page.locator('#host-transform').evaluate(element => {
    window.__hostAnimation = element.animate([{ opacity: 0.85 }, { opacity: 1 }], { duration: 2000, iterations: Infinity });
  });
  await start(page);
  expect(await page.locator('#host-transform').evaluate(element => getComputedStyle(element).transform)).toBe('matrix(1, 0, 0, 1, 7, 0)');
  await page.getByRole('button', { name: '醒酒', exact: true }).first().click();
  await expect.poll(() => page.locator('#host-transform').evaluate(element => element.getAnimations().length)).toBe(1);
  expect(await page.locator('#host-transform').getAttribute('style')).toBe(originalStyle);
  expect(await page.evaluate(() => window.__hostAnimation.playState)).toBe('running');
});

test('host rotation retains its origin and zero intensity preserves its original geometry', async ({ page }) => {
  const target = page.locator('#host-transform');
  await target.evaluate(element => {
    (element as HTMLElement).style.transform = 'translateX(7px) rotate(10deg)';
    (element as HTMLElement).style.transformOrigin = '25% 20%';
  });
  const geometry = () => target.evaluate(element => {
    const style = getComputedStyle(element);
    const { top, left, width, height } = element.getBoundingClientRect();
    return { origin: style.transformOrigin, transform: style.transform, top, left, width, height };
  });
  const baseline = await geometry();
  const originalStyle = await target.getAttribute('style');
  await start(page);
  expect((await geometry()).origin).toBe(baseline.origin);
  expect((await geometry()).transform).toBe(baseline.transform);
  await page.evaluate(() => window.__wineFixture.updateSettings({ intensity: 0 }));
  await page.mouse.move(1, 1);
  await expect.poll(geometry).toEqual(baseline);
  await page.getByRole('button', { name: '醒酒', exact: true }).first().click();
  expect(await geometry()).toEqual(baseline);
  expect(await target.getAttribute('style')).toBe(originalStyle);
});

test('host independent scale animation is skipped persistently without stopping other targets', async ({ page }) => {
  await page.locator('#host-transform').evaluate(element => {
    window.__hostAnimation = element.animate([{ scale: '1 1' }, { scale: '1.08 0.94' }], { duration: 2000, iterations: Infinity });
  });
  await start(page);
  await page.waitForTimeout(650);
  expect(await animationCount(page, '#host-transform')).toBe(1);
  expect(await motionCountOnChain(page, '#assistant-text')).toBeGreaterThan(0);
  await page.locator('[data-action=stop]').click();
  expect(await page.evaluate(() => window.__hostAnimation.playState)).toBe('running');
});

test('revealing a hidden ancestor discovers its previously hidden text blocks', async ({ page }) => {
  await page.locator('[data-chat-flow]').evaluate(chat => {
    const wrapper = document.createElement('div'); wrapper.id = 'revealed-wrapper'; wrapper.hidden = true;
    const article = document.createElement('article'); article.dataset.chatFlowKind = 'assistant';
    const paragraph = document.createElement('p'); paragraph.id = 'revealed-text'; paragraph.textContent = '从隐藏区域恢复的新正文。';
    article.append(paragraph); wrapper.append(article); chat.append(wrapper);
  });
  await start(page);
  expect(await animationCount(page, '#revealed-text')).toBe(0);
  await page.locator('#revealed-wrapper').evaluate(element => { (element as HTMLElement).hidden = false; element.scrollIntoView({ block: 'center' }); });
  await expect.poll(() => motionCountOnChain(page, '#revealed-text')).toBeGreaterThan(0);
});

test('approval dialog and emergency stop stay static and Escape reaches the host', async ({ page }) => {
  await start(page);
  await page.evaluate(() => window.__wineFixture.showApproval());
  await expect(page.locator('#approval')).toBeVisible();
  await page.waitForTimeout(200);
  expect(await page.locator('#approval').evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  expect(await page.getByRole('button', { name: '醒酒', exact: true }).first().evaluate(element => element.getAnimations().length)).toBe(0);
  await page.evaluate(() => { document.addEventListener('keydown', event => { if (event.key === 'Escape') document.body.dataset.hostEscape = 'received'; }); });
  await page.keyboard.press('Escape');
  await expect(page.locator('body')).toHaveAttribute('data-host-escape', 'received');
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('30 start-stop cycles and unmount leave no plugin animations or host style mutations', async ({ page }) => {
  const styles = await page.locator('article, article *, aside *, #composer-card, #composer').evaluateAll(elements => elements.map(element => element.getAttribute('style')));
  await openPanel(page);
  for (let cycle = 0; cycle < 30; cycle++) {
    await page.getByRole('button', { name: '开喝', exact: true }).click();
    await page.getByRole('button', { name: '醒酒', exact: true }).first().click();
  }
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  expect(await page.locator('article, article *, aside *, #composer-card, #composer').evaluateAll(elements => elements.map(element => element.getAttribute('style')))).toEqual(styles);
  await page.evaluate(() => window.__wineFixture.unmount());
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await expect(page.locator('#wine-panel button')).toHaveCount(0);
});

test('synthetic visibility events suspend visual work and resume with the same session', async ({ page }) => {
  await start(page);
  await page.evaluate(() => window.__wineFixture.setHidden(true));
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
  await page.evaluate(() => window.__wineFixture.setHidden(false));
  await expect.poll(() => motionCountOnChain(page, '#assistant-text')).toBeGreaterThan(0);
});

test('reduced-motion preference is static by default and supports explicit opt-in', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await openPanel(page);
  await expect(page.getByText(/减少动态|减少动画|reduced.motion/i).first()).toBeVisible();
  await start(page);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('retained internal audio integration plays, pauses, seeks, loops and releases its object URL', async ({ page }) => {
  await openPanel(page);
  const requests: string[] = [];
  page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:4179')) requests.push(request.url()); });
  await page.evaluate(() => {
    window.__fixtureRevokedUrls = [];
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = url => { window.__fixtureRevokedUrls.push(url); revoke(url); };
  });
  // Local audio no longer has production UI. Exercise its compatibility through
  // the synthetic fixture's controller API with our own generated test signal.
  await expect(page.locator('#wine-panel input[type=file], #wine-seek')).toHaveCount(0);
  await page.evaluate(bytes => window.__wineFixture.selectAudio(bytes), [...waveFile()]);
  const objectUrl = await page.evaluate(() => window.__fixtureMedia[0].getAttribute('src'));
  expect(objectUrl).toMatch(/^blob:/);
  await expect.poll(() => page.evaluate(() => window.__fixtureMedia[0]?.duration || 0)).toBeGreaterThan(1.9);
  await page.locator('[data-action=start]').click();
  await expect.poll(() => page.evaluate(() => window.__fixtureMedia[0].paused)).toBe(false);
  await expect.poll(() => page.evaluate(() => window.__fixtureMedia[0].currentTime)).toBeGreaterThan(0.1);
  await page.getByRole('button', { name: '暂停', exact: true }).click();
  const pausedTime = await page.evaluate(() => window.__fixtureMedia[0].currentTime);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.__fixtureMedia[0].currentTime)).toBeCloseTo(pausedTime, 2);
  await page.evaluate(() => window.__wineFixture.seek(1.8));
  await expect.poll(() => page.evaluate(() => window.__fixtureMedia[0].currentTime)).toBeGreaterThan(1.7);
  await page.locator('[data-action=start]').click();
  await page.waitForTimeout(450);
  expect(await page.evaluate(() => window.__fixtureMedia[0].loop)).toBe(true);
  expect(await page.evaluate(() => window.__fixtureMedia[0].currentTime)).toBeLessThan(1.0);
  await page.getByRole('button', { name: '醒酒', exact: true }).first().click();
  expect(await page.evaluate(() => window.__fixtureMedia[0].getAttribute('src'))).toBeNull();
  expect(await page.evaluate(() => window.__fixtureMedia[0].paused)).toBe(true);
  expect(await page.evaluate(() => window.__fixtureRevokedUrls)).toContain(objectUrl);
  expect(requests).toEqual([]);
});

test('300 messages and over 100k characters respect 120 active-target budget while scrolling', async ({ page }) => {
  const inventory = await page.evaluate(() => window.__wineFixture.longHistory());
  expect(inventory.messages).toBeGreaterThanOrEqual(300);
  expect(inventory.characters).toBeGreaterThanOrEqual(100_000);
  await start(page);
  const activeCount = () => page.evaluate(() => document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length);
  expect(await activeCount()).toBeLessThanOrEqual(120);
  await page.locator('#history').evaluate(element => { element.scrollTop = element.scrollHeight; element.dispatchEvent(new Event('scroll')); });
  await expect.poll(() => animationCount(page, '[data-chat-flow-key="long-299"]')).toBeGreaterThan(0);
  expect(await activeCount()).toBeLessThanOrEqual(120);
  await page.locator('#history').evaluate(element => { element.scrollTop = 0; element.dispatchEvent(new Event('scroll')); });
  await expect.poll(() => motionCountOnChain(page, '#assistant-text')).toBeGreaterThan(0);
  const timing = await page.evaluate(async () => {
    const frames: number[] = []; let previous = performance.now();
    for (let frame = 0; frame < 120; frame++) await new Promise<void>(done => requestAnimationFrame(now => { frames.push(now - previous); previous = now; done(); }));
    frames.sort((a, b) => a - b);
    return { frameP95: frames[Math.floor(frames.length * 0.95)], samples: frames.length };
  });
  await mkdir('.qa', { recursive: true });
  await writeFile(join('.qa', 'fixture-performance.json'), JSON.stringify({ kind: 'synthetic-fixture-headless', ...inventory, ...timing, activeAnimations: await activeCount(), limitation: 'Short automated sample; the planned 60-second device-specific performance and native IME acceptance remain separate.' }, null, 2));
});

test('dark theme keeps controls usable', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await start(page);
  await expect(page.getByRole('button', { name: '醒酒', exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: '醒酒', exact: true }).first().click();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});
