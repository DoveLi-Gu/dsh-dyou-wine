import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
await mkdir(resolve(root, 'lib'), { recursive: true });

await build({
  absWorkingDir: root,
  entryPoints: ['src/host.ts'],
  outfile: 'lib/host.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  legalComments: 'none',
});

const client = await build({
  absWorkingDir: root,
  entryPoints: ['src/client/entry.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  platform: 'browser',
  format: 'cjs',
  target: 'es2022',
  external: ['react'],
  // Keep real program code in the ModuleLoader entry. Media is served by the
  // plugin's two fixed WebServer routes from the files emitted alongside it.
  loader: { '.png': 'file', '.webp': 'file', '.mp3': 'file' },
  assetNames: 'assets/[name]',
  publicPath: 'plugins/dsh-dyou-wine',
  write: false,
  legalComments: 'none',
  metafile: true,
});

const externalImports = Object.values(client.metafile.outputs)
  .flatMap((output) => output.imports)
  .filter((request) => request.external && request.path !== 'react');
if (externalImports.length) {
  throw new Error(`Client has undeclared runtime imports: ${externalImports.map((request) => request.path).join(', ')}`);
}

const js = client.outputFiles.find((file) => file.path.endsWith('.js'));
if (!js) throw new Error('Client build produced no JavaScript.');
const registration = `// DSH lazy browser module. React is supplied by the host.\n` +
  `window.__ModuleLoader__.load({\n  id: ${JSON.stringify(pkg.name)},\n  factory(require) {\n` +
  `    const module = { exports: {} };\n    const exports = module.exports;\n${js.text}\n` +
  `    return module.exports;\n  },\n});\n`;
await writeFile(resolve(root, 'lib/client.js'), registration);
for (const file of client.outputFiles.filter(file => !file.path.endsWith('.js'))) {
  await mkdir(dirname(file.path), { recursive: true });
  await writeFile(file.path, file.contents);
}
console.log(`Built ${pkg.name}@${pkg.version}: lib/host.js, lib/client.js`);
