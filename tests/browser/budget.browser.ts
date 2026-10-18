import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('more than 120 simultaneous visible targets are capped while preserving region coverage', async ({ page }) => {
  await page.goto('/tests/fixture/');
  await page.evaluate(() => {
    const group = document.createElement('div');
    group.id = 'dense-controls';
    group.style.cssText = 'position:absolute;top:80px;left:260px;width:700px;display:grid;grid-template-columns:repeat(20,32px);grid-auto-rows:24px;gap:2px';
    for (let i = 0; i < 180; i++) {
      const button = document.createElement('button'); button.textContent = String(i); group.append(button);
    }
    document.body.append(group);
  });
  await page.locator('[data-action=toggle]').click();
  await page.locator('[data-action=start]').click();
  await page.mouse.move(1, 1);
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a => a.id.startsWith('dsh-dyou-wine:')).length)).toBe(120);
  const samples = await page.evaluate(async () => {
    const counts: number[] = [];
    for (let i = 0; i < 45; i++) await new Promise<void>(done => requestAnimationFrame(() => {
      counts.push(document.getAnimations().filter(a => a.id.startsWith('dsh-dyou-wine:')).length); done();
    }));
    return counts;
  });
  expect(Math.max(...samples)).toBeLessThanOrEqual(120);
  for (const selector of ['#user-message','#assistant-text','#composer-card','#sidebar-session','#tool-card']) {
    expect(await page.locator(selector).evaluate(element => {
      let count = 0;
      for (let current: Element | null = element; current; current = current.parentElement) {
        count += current.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length;
      }
      return count;
    })).toBe(1);
  }
  await page.locator('[data-action=stop]').click();
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a => a.id.startsWith('dsh-dyou-wine:')).length)).toBe(0);
});

test('performance tiers reduce target count without changing an existing root waveform, period or phase', async ({ page }) => {
  await page.goto('/tests/fixture/');
  const evidence = await page.evaluate(async () => {
    (window as unknown as { __wineFixture: { unmount(): void } }).__wineFixture.unmount();
    const group = document.createElement('div');
    group.style.cssText = 'position:absolute;top:80px;left:260px;width:700px;display:grid;grid-template-columns:repeat(20,32px);grid-auto-rows:24px;gap:2px';
    for (let index = 0; index < 180; index++) {
      const button = document.createElement('button'); button.textContent = String(index); group.append(button);
    }
    document.body.append(group);
    const engineModule = '/src/motion/engine.ts';
    const settingsModule = '/src/settings.ts';
    const governorModule = '/src/motion/governor.ts';
    const [{ WineEngine }, { defaults }, { PerformanceGovernor }] = await Promise.all([
      import(engineModule), import(settingsModule), import(governorModule),
    ]);
    const record = PerformanceGovernor.prototype.record;
    let level = 0;
    let injectSlowTelemetry = false;
    // This test supplies telemetry at the governor boundary. It does not add
    // production debug hooks or claim to benchmark a genuinely slow device.
    PerformanceGovernor.prototype.record = function (frameMs: number, callbackMs: number) {
      const changed = record.call(this, injectSlowTelemetry ? 30 : frameMs, injectSlowTelemetry ? 4 : callbackMs);
      level = this.level;
      return changed;
    };
    const errors: string[] = [];
    const origin = performance.now();
    const engine = new WineEngine(document, () => (performance.now() - origin) / 1000, (error: Error) => errors.push(error.message));
    const frame = () => new Promise<void>(done => requestAnimationFrame(() => done()));
    const root = document.querySelector('#assistant-message')!;
    engine.start(defaults);
    try {
      await frame(); await frame();
      const animation = root.getAnimations().find(animation => animation.id.startsWith('dsh-dyou-wine:'))!;
      await animation.ready;
      const read = () => {
        const active = root.getAnimations().find(candidate => candidate.id.startsWith('dsh-dyou-wine:'))!;
        return { level, sameAnimation: active === animation,
          waveform: JSON.stringify((active.effect as KeyframeEffect).getKeyframes()),
          duration: Number(active.effect!.getComputedTiming().duration), startTime: Number(active.startTime),
          currentTime: Number(active.currentTime), timeline: Number(document.timeline.currentTime), playState: active.playState,
          activeCount: document.getAnimations().filter(candidate => candidate.id.startsWith('dsh-dyou-wine:')).length };
      };
      const samples = [read()];
      injectSlowTelemetry = true;
      const deadline = performance.now() + 12_000;
      while (level < 3 && performance.now() < deadline) {
        await frame();
        if (level !== samples.at(-1)!.level) {
          // Allow the next reconciliation to apply the new bounded selection.
          await frame(); await frame(); samples.push(read());
        }
      }
      return { errors, samples };
    } finally {
      engine.stop(); PerformanceGovernor.prototype.record = record; group.remove();
    }
  });
  await mkdir('.qa', { recursive: true });
  await writeFile('.qa/fixed-period-performance-levels.json', JSON.stringify({ kind: 'synthetic-injected-governor-telemetry', ...evidence }, null, 2));
  expect(evidence.errors).toEqual([]);
  expect(evidence.samples.map(sample => sample.level)).toEqual([0, 1, 2, 3]);
  expect(evidence.samples.map(sample => sample.activeCount)).toEqual([120, 80, 48, 28]);
  for (const sample of evidence.samples) {
    expect(sample.sameAnimation).toBe(true);
    expect(sample.waveform).toBe(evidence.samples[0].waveform);
    expect(sample.duration).toBe(500);
    expect(sample.startTime).toBe(evidence.samples[0].startTime);
    expect(sample.playState).toBe('running');
    expect(sample.currentTime).toBeCloseTo(sample.timeline - sample.startTime, 4);
  }
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});
