import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const npmArgs = ['pack', '--dry-run', '--ignore-scripts', '--json'];
const npmExec = process.env.npm_execpath;
const packed = npmExec
  ? spawnSync(process.execPath, [npmExec, ...npmArgs], { cwd: root, encoding: 'utf8' })
  : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', npmArgs, {
    cwd: root, encoding: 'utf8', shell: process.platform === 'win32',
  });
if (packed.error) throw packed.error;
assert.equal(packed.status, 0, packed.stderr || packed.stdout || 'npm pack failed');
const results = JSON.parse(packed.stdout);
assert.equal(results.length, 1, 'Expected exactly one npm package');
const archive = results[0];
assert.equal(archive.name, pkg.name);
assert.equal(archive.version, pkg.version);
assert.match(pkg.name, /^dsh-/);
assert.equal(pkg.license, 'MIT');
assert.equal(pkg.main, './lib/host.js');
assert.equal(pkg.exports?.['.'], './lib/host.js');
assert.equal(pkg.exports?.['./client'], './lib/client.js');
assert.equal(pkg.exports?.['./package.json'], './package.json');
assert.equal(pkg.icon, './assets/icon.svg');
assert.equal(pkg.exports?.['./icon'], pkg.icon);
assert.equal(pkg.exports?.['./locale/*.json'], './locale/*.json');
assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml');
assert.equal(pkg.dsh?.client?.platform, 'web');
assert.equal(pkg.dsh?.client?.immediately, true);
assert.equal(pkg.engines?.dsh, '0.2.0-rc.2');
assert.equal(pkg.publishConfig?.access, 'public');
assert.equal(pkg.publishConfig?.tag, 'alpha');
assert.equal(pkg.repository?.url, 'git+https://github.com/DoveLi-Gu/dsh-dyou-wine.git');
assert(pkg.keywords.includes('dsh-plugin'));
assert.deepEqual(pkg.dsh?.marketplace, { profiles: ['web'], requiresRestart: true, manualSteps: false });
assert(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-ui-layout'));
assert(pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-locale'));

const allowed = new Set([
  'package.json', 'lib/host.js', 'lib/client.js', 'cordis.patch.yml',
  'README.md', 'CHANGELOG.md', 'LICENSE', 'PRODUCT.md', 'DESIGN.md',
  'docs/COMPATIBILITY.md', 'docs/ASSETS.md', 'docs/MOTION-REFERENCE.md', 'docs/TESTING.md', 'docs/RELEASING.md',
  'assets/icon.svg', 'locale/zh.json', 'locale/en.json',
  'docs/RELEASE-NOTES.md', 'docs/MARKETPLACE.md',
]);
const actual = new Set(archive.files.map((entry) => entry.path));
for (const path of allowed) assert(actual.has(path), `Required package file missing: ${path}`);
const secret = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bnpm_[a-zA-Z0-9]{30,}\b|\bgh[pousr]_[a-zA-Z0-9]{30,}\b/;
for (const entry of archive.files) {
  assert(allowed.has(entry.path), `Unexpected public package file: ${entry.path}`);
  assert(!entry.path.includes('\\') && !entry.path.split('/').includes('..'));
  assert(!isAbsolute(entry.path));
  const absolute = await realpath(resolve(root, entry.path));
  const local = relative(root, absolute);
  assert(local !== '..' && !local.startsWith(`..${sep}`) && !isAbsolute(local), `File escapes workspace: ${entry.path}`);
  assert(entry.size > 0, `Empty package file: ${entry.path}`);
  const content = await readFile(absolute, 'utf8');
  assert(!secret.test(content), `Credential-like content in ${entry.path}`);
}
assert.equal(archive.bundled?.length ?? 0, 0, 'Do not ship node_modules or native dependencies');
for (const locale of ['zh', 'en']) {
  const dictionary = JSON.parse(await readFile(resolve(root, `locale/${locale}.json`), 'utf8'));
  assert(dictionary.meta?.title && dictionary.meta?.description, `Missing ${locale} plugin metadata`);
}
const host = await readFile(resolve(root, 'lib/host.js'), 'utf8');
const client = await readFile(resolve(root, 'lib/client.js'), 'utf8');
const patch = await readFile(resolve(root, 'cordis.patch.yml'), 'utf8');
assert.match(host, /apply/);
assert.match(client, /window\.__ModuleLoader__\.load/);
assert(client.includes(JSON.stringify(pkg.name)), 'Browser ModuleLoader id must match package name');
assert.match(client, /shell\.overlay/);
const embeddedAudio = client.match(/data:audio\/mpeg;base64,([A-Za-z0-9+/=]+)/);
assert(embeddedAudio, 'Bundled BGM must be present in the built client');
assert(Buffer.from(embeddedAudio[1], 'base64').equals(await readFile(resolve(root, 'src/assets/BV1hXbN6VEKV.mp3'))),
  'Built BGM must match the declared source recording');
assert(!client.includes('player.bilibili.com/player.html'), 'The old visible video player must not be shipped');
assert(patch.includes(pkg.name), 'Bundle patch must reference this host module');
console.log(`Package checked: ${pkg.name}@${pkg.version}; ${archive.files.length} public files, ${archive.size} packed bytes.`);
console.log(`Tarball: ${archive.filename}; sha512 integrity: ${archive.integrity}`);
