import type { Context } from '@deepseek-ai/cordis';
import { registerAssetRoutes, type AssetWebServer } from './server/assets';

/** Media stays package-local rather than inflating the browser entry bundle. */
export const name = 'dsh-dyou-wine';

export function apply(ctx: Context): void {
  // Optional injection keeps non-Web compositions loadable. The injected child
  // context owns the registrations, including removal when webServer unloads.
  ctx.inject(['webServer'], (injected) => {
    const { webServer } = injected as Context & { webServer: AssetWebServer };
    injected.effect(
      () => registerAssetRoutes(webServer, new URL('./assets/', import.meta.url)),
      'dsh-dyou-wine: bundled media routes',
    );
  });
}
