import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('plain interface text and inline media participate once without moving layout or scroll roots', async ({ page }) => {
  await page.goto('/tests/fixture/');
  const evidence = await page.evaluate(async () => {
    window.__wineFixture.unmount();
    const wrapper = document.createElement('section');
    wrapper.id = 'coverage-fixture';
    wrapper.style.cssText = 'position:absolute;top:90px;left:260px;width:600px;background:white';
    wrapper.innerHTML = `
      <div id="plain-status">正在准备插件</div>
      <div id="wrapped-title"><span>工作区标题</span><small>已连接</small></div>
      <div id="inline-media"><img id="inline-picture" width="35" height="25" alt="验收图标" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='35' height='25'%3E%3Crect width='35' height='25' fill='blue'/%3E%3C/svg%3E"><svg id="inline-svg" width="30" height="25"><rect width="30" height="25" fill="blue"/></svg></div>
      <div id="scroll-label" style="overflow:auto;max-height:40px"><div id="scroll-content">滚动内容也有自己的稳定根</div></div>
      <div id="sticky-title" style="position:sticky;top:0"><div id="sticky-title-content">固定标题内的文字</div></div>
      <button id="icon-control"><svg id="button-icon" width="20" height="20"><rect width="20" height="20"/></svg>普通按钮</button>
      <div id="late-status"></div>`;
    document.body.append(wrapper);
    const selectors = ['header strong', '.fixture-note', '#plain-status', '#wrapped-title span', '#inline-picture', '#inline-svg', '#scroll-content', '#sticky-title-content', '#button-icon'];
    const styles = Object.fromEntries(selectors.map(selector => [selector, document.querySelector(selector)!.getAttribute('style')]));
    const engineModule = '/src/motion/engine.ts';
    const settingsModule = '/src/settings.ts';
    const [{ WineEngine }, { defaults }] = await Promise.all([import(engineModule), import(settingsModule)]);
    const errors: string[] = [];
    const origin = performance.now();
    const engine = new WineEngine(document, () => (performance.now() - origin) / 1000, (error: Error) => errors.push(error.message));
    const frame = () => new Promise<void>(done => requestAnimationFrame(() => done()));
    const owned = (element: Element) => element.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:'));
    const chainCount = (element: Element) => {
      let count = 0;
      for (let current: Element | null = element; current; current = current.parentElement) count += owned(current).length;
      return count;
    };
    engine.start(defaults);
    try {
      await frame(); await frame(); await frame();
      const counts = Object.fromEntries(selectors.map(selector => [selector, chainCount(document.querySelector(selector)!)]));
      const untouchedRoots = ['html', 'body', '.fixture-shell', '.fixture-main', '#coverage-fixture', '#scroll-label', '#sticky-title']
        .map(selector => ({ selector, active: owned(document.querySelector(selector)!).length }));
      // A new text-only status must be discovered without a document rescan.
      document.querySelector('#late-status')!.append(document.createTextNode('新状态'));
      await frame(); await frame(); await frame();
      const late = document.querySelector('#late-status')!;
      const lateAnimation = owned(late)[0];
      late.append(document.createTextNode('：持续追加'));
      await frame(); await frame(); await frame();
      const streamedWithoutRestart = owned(late)[0] === lateAnimation;
      const periods = document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:'))
        .map(animation => ({ duration: animation.effect!.getComputedTiming().duration, start: animation.startTime }));
      engine.stop();
      return { errors, counts, untouchedRoots, streamedWithoutRestart, lateActive: Boolean(lateAnimation), periods,
        stylesPreserved: selectors.every(selector => document.querySelector(selector)!.getAttribute('style') === styles[selector]),
        remaining: document.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:')).length };
    } finally { engine.stop(); wrapper.remove(); }
  });
  await mkdir('.qa', { recursive: true });
  await writeFile('.qa/expanded-interface-coverage.json', JSON.stringify({ kind: 'synthetic-interface-content-and-media-coverage', ...evidence }, null, 2));
  expect(evidence.errors).toEqual([]);
  for (const count of Object.values(evidence.counts)) expect(count).toBe(1);
  expect(evidence.untouchedRoots.every(root => root.active === 0)).toBe(true);
  expect(evidence.lateActive).toBe(true);
  expect(evidence.streamedWithoutRestart).toBe(true);
  expect(evidence.periods.every(period => period.duration === 500 && period.start === evidence.periods[0].start)).toBe(true);
  expect(evidence.stylesPreserved).toBe(true);
  expect(evidence.remaining).toBe(0);
});

test('expanded text coverage keeps approvals, host independent transforms and interactive branches protected', async ({ page }) => {
  await page.goto('/tests/fixture/');
  const evidence = await page.evaluate(async () => {
    window.__wineFixture.unmount();
    const section = document.createElement('section');
    section.style.cssText = 'position:absolute;top:90px;left:260px;width:600px';
    section.innerHTML = `<div id="protected-copy"><label>选择设置 <input id="protected-input" aria-label="保护输入" value="原文"></label></div>
      <div id="free-status">其余状态继续跳动</div>
      <div id="host-scale-label" style="scale:1.15 0.9">已有宿主缩放</div>
      <div data-wine-approval><div id="approval-label">需要审批</div></div>`;
    document.body.append(section);
    const engineModule = '/src/motion/engine.ts';
    const settingsModule = '/src/settings.ts';
    const [{ WineEngine }, { defaults }] = await Promise.all([import(engineModule), import(settingsModule)]);
    const errors: string[] = [];
    const engine = new WineEngine(document, () => performance.now() / 1000, (error: Error) => errors.push(error.message));
    const frame = () => new Promise<void>(done => requestAnimationFrame(() => done()));
    const owned = (element: Element) => element.getAnimations().filter(animation => animation.id.startsWith('dsh-dyou-wine:'));
    const chainCount = (selector: string) => {
      let count = 0;
      for (let current: Element | null = document.querySelector(selector); current; current = current.parentElement) count += owned(current).length;
      return count;
    };
    engine.start(defaults);
    try {
      await frame(); await frame();
      (document.querySelector('#protected-input') as HTMLInputElement).focus();
      await frame(); await frame();
      return { errors, protected: chainCount('#protected-input'), free: chainCount('#free-status'),
        approval: chainCount('#approval-label'), host: chainCount('#host-scale-label'),
        hostScale: getComputedStyle(document.querySelector('#host-scale-label')!).scale,
        text: (document.querySelector('#protected-input') as HTMLInputElement).value };
    } finally { engine.stop(); section.remove(); }
  });
  expect(evidence).toEqual({ errors: [], protected: 0, free: 1, approval: 0, host: 0, hostScale: '1.15 0.9', text: '原文' });
});
