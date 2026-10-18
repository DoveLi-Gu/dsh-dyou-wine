import { WineController } from '../controller';
import { type Preset } from '../settings';
import { zhCN } from './messages';
import { styles } from './styles';
import { musicSource } from '../audio/bundled-music';

export function mountPanel(root: HTMLElement, translate: (key: string) => string = key => zhCN[key] ?? key, controller: WineController = new WineController(root.ownerDocument)): () => void {
  root.dataset.dyouUi = '';
  root.dataset.wineOwned = '';
  const doc = root.ownerDocument;
  let expanded = false;
  const escape = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]!));
  const t = (key: string) => escape(translate(key));
  const $ = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  function render(): void {
    const s = controller.settings;
    root.innerHTML = `<style>${styles}</style>
      <section class="wine-panel" id="dyou-wine-panel" aria-label="${t('title')}" ${expanded ? '' : 'hidden'}>
        <h2>${t('title')}</h2><p class="wine-subtitle">${t('subtitle')}</p>
        <p class="wine-note" data-reduced ${controller.reducedMotion.matches ? '' : 'hidden'}>${t('reduced')}</p>
        <fieldset><legend>${t('effects')}</legend><div class="wine-checks"><label><input id="wine-page-enabled" type="checkbox" data-setting="pageEnabled" ${s.pageEnabled ? 'checked' : ''}> ${t('pageEffect')}</label><label><input id="wine-pet-enabled" type="checkbox" data-setting="petEnabled" ${s.petEnabled ? 'checked' : ''}> ${t('petEffect')}</label></div><p class="wine-note">${t('effectsHint')}</p></fieldset>
        <fieldset><legend>${t('strength')}</legend><div class="wine-presets">${(['tipsy','party','wild'] as Preset[]).map(p => `<button data-preset="${p}" aria-pressed="${s.preset === p}">${t(p)}</button>`).join('')}</div></fieldset>
        <fieldset><legend>${t('music')}</legend><label class="wine-check"><input id="wine-music-enabled" type="checkbox" data-setting="musicEnabled" ${s.musicEnabled ? 'checked' : ''}> ${t('musicEnabled')}</label>
        <p class="wine-note">${t('musicHint')}</p><p class="wine-note">${t('audioCredit')}<a data-wine-music-source href="${musicSource}" target="_blank" rel="noopener noreferrer">BV1hXbN6VEKV</a></p></fieldset>
        <div class="wine-row wine-actions"><button class="wine-primary" data-action="start">${t('start')}</button><button data-action="pause">${t('pause')}</button></div>
        <div class="wine-status" role="status" data-state></div><p class="wine-note wine-error" role="alert" data-error hidden></p>
        <p class="wine-note" data-warning hidden></p><p class="wine-footer"><kbd>${escape(s.shortcut)}</kbd> ${t('stopHint')}</p>
      </section><div class="wine-dock"><button data-action="toggle" aria-controls="dyou-wine-panel" aria-expanded="${expanded}" aria-label="${t(expanded ? 'close' : 'open')}">${t('title')} ▴</button><button data-action="stop">${t('stop')}</button></div>`;
    root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => button.addEventListener('click', () => {
      switch(button.dataset.action) {
        case 'toggle': expanded = !expanded; render(); break;
        case 'start': void controller.start(); break;
        case 'pause': controller.pause(); break;
        case 'stop': controller.stop(); break;
      }
    }));
    root.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => button.addEventListener('click', () => {
      controller.update({ preset: button.dataset.preset as Preset });
      root.querySelectorAll('[data-preset]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
    }));
    root.querySelectorAll<HTMLInputElement>('[data-setting]').forEach(input => input.addEventListener('input', () => {
      const key = input.dataset.setting!;
      const value = input.type === 'checkbox' ? input.checked : Number(input.value);
      controller.update({ [key]: value });
    }));
    refresh();
  }
  function refresh(): void {
    $<HTMLInputElement>('#wine-music-enabled').checked = controller.settings.musicEnabled;
    const translateText = (key: string) => translate(key);
    const effects = [controller.settings.pageEnabled && translateText('pageEffect'), controller.settings.petEnabled && translateText('petEffect')].filter(Boolean).join(' + ') || translateText('noEffects');
    $('[data-state]').textContent = `${translateText(controller.state)} · ${effects}`;
    $<HTMLButtonElement>('[data-action="start"]').textContent = translateText(controller.state === 'paused' ? 'resume' : 'start');
    $<HTMLButtonElement>('[data-action="pause"]').disabled = controller.state !== 'running';
    const error = $('[data-error]'); error.hidden = !controller.error; error.textContent = ['audioTooLarge', 'unsupportedBrowser', 'invalidClock', 'petAssetError', 'musicUnavailable', 'musicLoadError'].includes(controller.error) ? translateText(controller.error) : translateText('error');
    const reduced = $('[data-reduced]'); reduced.hidden = !controller.reducedMotion.matches;
    const snap = controller.engine.snapshot();
    const warning = !controller.settings.pageEnabled && !controller.settings.petEnabled ? translateText('noEffectsHint')
      : controller.settings.pageEnabled && controller.state === 'running' && snap.total === 0 ? translateText('noTargets')
      : controller.settings.pageEnabled && snap.warnings.length ? translateText(zhCN[snap.warnings[0]] ? snap.warnings[0] : 'limits') : '';
    $('[data-warning]').textContent = warning;
    $('[data-warning]').hidden = !warning;
  }
  render();
  const unsubscribe = controller.subscribe(refresh);
  const interval = doc.defaultView!.setInterval(refresh, 500);
  const localeChange = () => render();
  root.addEventListener('dsh-wine-locale-change', localeChange);
  return () => {
    doc.defaultView!.clearInterval(interval); unsubscribe(); controller.dispose();
    root.removeEventListener('dsh-wine-locale-change', localeChange); root.replaceChildren();
    delete root.dataset.dyouUi; delete root.dataset.wineOwned;
  };
}
