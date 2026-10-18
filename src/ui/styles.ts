export const styles = `
[data-dyou-ui] { --wine-bg:var(--dsw-alias-bg-layer-1, light-dark(oklch(99% 0 0), oklch(23% .008 270))); --wine-text:var(--dsw-alias-label-primary,light-dark(oklch(23% .01 270),oklch(94% .004 270))); --wine-muted:var(--dsw-alias-label-secondary,light-dark(oklch(43% .01 270),oklch(77% .008 270))); --wine-border:var(--dsw-alias-border-l2,light-dark(oklch(84% .004 270),oklch(41% .008 270))); --wine-accent:var(--dsw-alias-state-business-primary,light-dark(oklch(44% .16 12),oklch(77% .12 12))); position:fixed; inset:auto 18px 18px auto; z-index:10; pointer-events:auto; color:var(--wine-text); font:13px/1.5 system-ui,sans-serif; color-scheme:inherit; max-width:calc(100vw - 24px); }
[data-dyou-ui] * { box-sizing:border-box; }
[data-dyou-ui] [hidden] { display:none!important; }
[data-dyou-ui] button,[data-dyou-ui] input { font:inherit; accent-color:var(--wine-accent); }
[data-dyou-ui] button { border:1px solid var(--wine-border); border-radius:7px; background:var(--wine-bg); color:var(--wine-text); padding:7px 10px; min-height:36px; }
[data-dyou-ui] button { cursor:pointer; white-space:nowrap; }
[data-dyou-ui] button:hover { background:color-mix(in oklch,var(--wine-text) 7%,var(--wine-bg)); }
[data-dyou-ui] button:active { background:color-mix(in oklch,var(--wine-text) 12%,var(--wine-bg)); }
[data-dyou-ui] :focus-visible { outline:2px solid var(--wine-accent); outline-offset:3px; }
[data-dyou-ui] button:disabled { cursor:default; opacity:.45; }
[data-dyou-ui] .wine-primary { background:var(--wine-accent); color:var(--dsw-alias-label-primary-foreground,light-dark(white,oklch(20% .01 270))); border-color:var(--wine-accent); }
[data-dyou-ui] .wine-primary:hover { filter:brightness(.94); background:var(--wine-accent); }
[data-dyou-ui] .wine-dock { display:flex; align-items:center; justify-content:flex-end; gap:6px; pointer-events:auto; }
[data-dyou-ui] .wine-panel { width:320px; max-width:calc(100vw - 24px); max-height:calc(100dvh - 80px); overflow-y:auto; background:var(--wine-bg); border:1px solid var(--wine-border); border-radius:12px; padding:18px; margin-bottom:8px; pointer-events:auto; }
[data-dyou-ui] .wine-panel[hidden] { display:none; }
[data-dyou-ui] h2 { font-size:18px; font-weight:650; margin:0 0 3px; }
[data-dyou-ui] p { margin:0; color:var(--wine-muted); }
[data-dyou-ui] .wine-subtitle { margin-bottom:16px; }
[data-dyou-ui] fieldset { border:0; border-top:1px solid var(--wine-border); margin:16px 0 0; padding:10px 0 0; min-width:0; }
[data-dyou-ui] legend { padding:0 7px 0 0; font-weight:600; }
[data-dyou-ui] .wine-row { display:flex; align-items:center; gap:12px; margin:12px 0 0; }
[data-dyou-ui] .wine-row input[type=range] { flex:1; width:100%; min-width:0; margin:0; min-height:28px; }
[data-dyou-ui] .wine-row input:disabled { opacity:.45; }
[data-dyou-ui] .wine-actions { margin-top:20px; gap:8px; }
[data-dyou-ui] .wine-actions button { flex:1; }
[data-dyou-ui] .wine-presets { display:flex; gap:6px; }
[data-dyou-ui] .wine-presets button { flex:1; }
[data-dyou-ui] [aria-pressed=true] { border-color:var(--wine-accent); color:var(--wine-accent); background:color-mix(in oklch,var(--wine-accent) 10%,var(--wine-bg)); }
[data-dyou-ui] .wine-checks { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
[data-dyou-ui] .wine-checks label,[data-dyou-ui] .wine-check { display:flex; gap:7px; align-items:center; min-height:32px; cursor:pointer; }
[data-dyou-ui] input[type=checkbox] { margin:0; width:16px; height:16px; flex-shrink:0; }
[data-dyou-ui] .wine-note { font-size:12px; margin:7px 0; overflow-wrap:anywhere; }
[data-dyou-ui] .wine-note a { color:inherit; text-decoration:underline; text-underline-offset:2px; }
[data-dyou-ui] .wine-status { font-size:12px; color:var(--wine-muted); margin:10px 0; }
[data-dyou-ui] .wine-error { color:var(--dsw-alias-state-error-primary,light-dark(oklch(43% .18 25),oklch(80% .12 25))); }
[data-dyou-ui] .wine-footer { font-size:12px; margin-top:12px; }
[data-dyou-ui] kbd { font:11px/1.2 system-ui,sans-serif; border:1px solid var(--wine-border); border-radius:4px; padding:2px 4px; margin-right:3px; }
@media(max-width:480px) { [data-dyou-ui] { right:12px; bottom:12px; } }
@media(prefers-reduced-motion:reduce) { [data-dyou-ui] * { transition:none!important; } }
`;
