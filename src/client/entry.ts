import * as React from 'react';
import { mountPanel } from '../ui/panel';
import { enUS, zhCN } from '../ui/messages';

const NAMESPACE = 'dyou.wine';
type Dispose = () => void;
type Translate = (key: string) => string;

/** The small structural face is verified against DSH 0.2.0-rc.2 declarations. */
interface ClientContext {
  effect(setup: () => Dispose): Dispose;
  locale: {
    register(namespace: string, dictionaries: Record<string, Record<string, string>>): Dispose;
  };
  slots: {
    inject(name: 'shell.overlay', setup: () => Dispose): Dispose;
    register(
      options: { name: 'shell.overlay'; id: string; order: number; locale: string },
      component: React.ComponentType<{ t: Translate }>,
    ): Dispose;
  };
}

/**
 * React belongs to DSH's browser module table. The build wraps this module in
 * a lazy ModuleLoader factory and leaves `require('react')` to that table.
 */
export const inject = ['slots', 'locale'];

function WineOverlay({ t }: { t: Translate }): React.ReactElement {
  const root = React.useRef<HTMLDivElement>(null);
  const translate = React.useRef(t);
  translate.current = t;

  React.useEffect(() => {
    if (!root.current) return;
    return mountPanel(root.current, (key) => translate.current(key));
  }, []);

  React.useEffect(() => {
    root.current?.dispatchEvent(new Event('dsh-wine-locale-change'));
  }, [t]);

  return React.createElement('div', {
    ref: root,
    'data-dyou-wine': 'overlay',
    // shell.overlay's containing layer is click-through. Only plugin controls
    // opt into pointer events themselves, leaving the host UI usable.
    style: { pointerEvents: 'none' },
  });
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NAMESPACE, { zh: zhCN, en: enUS }));
  // slots.inject and slots.register attach their own disposers to the caller's
  // Cordis fiber, including slot collapse/redeclaration and plugin unload.
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'dsh-dyou-wine', order: 90, locale: NAMESPACE,
  }, WineOverlay));
}
