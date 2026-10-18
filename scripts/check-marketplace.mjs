import assert from 'node:assert/strict';
import { readFile, realpath, access } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const pkg = await json('package.json');
const lock = await json('package-lock.json');
assert.equal(lock.version, pkg.version);
assert.equal(lock.packages[''].version, pkg.version);
assert(pkg.keywords.includes('dsh-plugin'), 'npm discovery keyword is required');
assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml');
assert.deepEqual(pkg.dsh.marketplace, { profiles: ['web'], requiresRestart: true, manualSteps: false });
assert.equal(pkg.publishConfig.tag, 'alpha', 'Discovery must not promote Alpha to latest');
assert.equal(pkg.engines.dsh, '0.2.0-rc.2', 'Keep the tested compatibility range');

const screenshots = await json('screenshots.json');
assert(Array.isArray(screenshots) && screenshots.length >= 1 && screenshots.length <= 8);
assert.equal(new Set(screenshots).size, screenshots.length);
for (const path of screenshots) {
  assert.equal(typeof path, 'string');
  assert(!isAbsolute(path) && !path.startsWith('/') && !path.includes('..') && !path.includes('\\'));
  assert(!/pigeon-logo/i.test(path), 'Sponsor logos are not plugin screenshots');
  const file = await realpath(resolve(root, path));
  const local = relative(root, file);
  assert(local !== '..' && !local.startsWith(`..${sep}`) && !isAbsolute(local));
  const bytes = await readFile(file);
  const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const gif = /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString('ascii'));
  assert(png || gif, `Screenshot is not the declared PNG/GIF: ${path}`);
  if (png) assert(bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0);
}
const topics = (await json('marketplace/github-topics.json')).names;
assert(Array.isArray(topics) && topics.length <= 20 && new Set(topics).size === topics.length);
assert(topics.every(topic => /^[a-z0-9][a-z0-9-]{0,49}$/.test(topic)));
for (const name of ['dsh-plugin', 'deepseek-harness', 'dsh-category-ui']) assert(topics.includes(name));
const repo = 'https://github.com/DoveLi-Gu/dsh-dyou-wine';
const awesome = await readFile(resolve(root, 'marketplace/awesome-dsh-plugin/data/plugins/DoveLi-Gu__dsh-dyou-wine.yml'), 'utf8');
assert(awesome.includes(`url: ${repo}\n`) && awesome.includes('name: DoveLi-Gu/dsh-dyou-wine\n'));
assert.match(awesome, /^category: fun$/m);
assert(!/^npm:/m.test(awesome), 'Awesome derives npm identity; do not supply its forbidden npm field');
const pub = await json('marketplace/dsh-pub/submissions/doveli-gu--dsh-dyou-wine.json');
assert.deepEqual(pub, { schemaVersion: 1, repository: repo });
const entry = await json('marketplace/ydhrdh/registry/plugins/dsh-dyou-wine/plugin.json');
assert.equal(entry.id, pkg.name);
assert.equal(entry.version, pkg.version);
assert.equal(entry.verified, false, 'Only upstream maintainers can verify a listing');
assert.equal(entry.compatibility.dsh, pkg.engines.dsh);
assert.deepEqual(entry.compatibility.platforms, ['windows']);
assert.equal(entry.repository, repo);
assert.equal(entry.install.target, 'git');
assert.equal(entry.install.spec, `github:DoveLi-Gu/dsh-dyou-wine#v${pkg.version}`);
assert.equal(entry.install.command, `dsh plugin --profile {profile} add ${entry.install.spec}`);
for (const field of ['name', 'description', 'descriptionZh', 'license', 'category']) assert.equal(typeof entry[field], 'string');
assert.equal(entry.category, 'web');
await access(resolve(root, 'docs/MARKETPLACE.md'));

// Check the real, reproducible distribution entries, not a stub delegating to
// an oversized JavaScript file. Media is intentionally separate package data.
const distribution = ['lib/host.js', 'lib/client.js', 'lib/assets/whale-girl.png', 'lib/assets/BV1hXbN6VEKV.mp3'];
const tracked = spawnSync('git', ['ls-files', '--', ...distribution], { cwd: root, encoding: 'utf8' });
if (tracked.error || tracked.status !== 0) throw new Error('Cannot verify committed runtime entries');
const committed = tracked.stdout.trim().split(/\r?\n/).filter(Boolean);
assert.equal(committed.length, distribution.length, 'Stage and commit real entry files and packaged assets for GitHub-source admission');
for (const path of distribution) {
  const bytes = await readFile(resolve(root, path));
  if (path.endsWith('.js')) assert(bytes.length <= 1_000_000, `dsh.pub entry limit exceeded: ${path}`);
  const recorded = spawnSync('git', ['show', `:${path}`], { cwd: root, maxBuffer: 16 * 1024 * 1024 });
  assert.equal(recorded.status, 0, `Cannot read staged distribution: ${path}`);
  assert(bytes.equals(recorded.stdout), `Rebuilt file differs from committed/staged distribution: ${path}`);
}
const clientBytes = (await readFile(resolve(root, 'lib/client.js'))).length;
console.log(`Discovery preparation checked: ${topics.length} topics, ${screenshots.length} real screenshots and 3 submission drafts; nothing submitted.`);
console.log(`dsh.pub local distribution gate passed: client ${clientBytes} bytes, 4 reproducible distribution files; remote submission and approval remain pending.`);
