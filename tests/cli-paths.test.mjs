import { afterEach, expect, test } from 'vitest';
import { mkdtemp, mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { findDshCli, findNpmCli } from '../scripts/cli-paths.mjs';

const fixtures = [];
const fixtureBase = await realpath(tmpdir());
afterEach(async () => {
  for (const directory of fixtures.splice(0)) {
    const absolute = resolve(directory);
    if (dirname(absolute) !== fixtureBase || !basename(absolute).startsWith('dyou-cli-paths-')) {
      throw new Error('Refusing to remove a path outside the owned temporary fixtures');
    }
    await rm(absolute, { recursive: true, force: true });
  }
});
async function fixture() {
  const root = await mkdtemp(join(fixtureBase, 'dyou-cli-paths-'));
  fixtures.push(root);
  return root;
}
async function file(path, content = '') {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
  return path;
}
async function npmPackage(root) {
  await file(join(root, 'package.json'), JSON.stringify({ name: 'npm' }));
  return await file(join(root, 'bin', 'npm-cli.js'));
}

test('prefers npm_execpath and verifies that it belongs to npm', async () => {
  const root = await fixture();
  const npm = await npmPackage(join(root, 'npm'));
  expect(await findNpmCli({ execPath: join(root, 'missing-node'), env: { npm_execpath: npm } }))
    .toBe(await realpath(npm));
  const unrelated = await file(join(root, 'unrelated', 'bin', 'npm-cli.js'));
  await file(join(root, 'unrelated', 'package.json'), JSON.stringify({ name: 'other-package' }));
  await expect(findNpmCli({ execPath: join(root, 'missing-node'), env: { npm_execpath: unrelated } }))
    .rejects.toThrow('Cannot locate npm CLI');
});

test.each([
  ['Node-adjacent npm on Windows', ['node_modules', 'npm']],
  ['global lib npm on Unix', ['..', 'lib', 'node_modules', 'npm']],
])('finds %s without npm_execpath or APPDATA', async (_label, npmParts) => {
  const root = await fixture();
  const execPath = await file(join(root, 'prefix', 'bin', 'node'));
  const npm = await npmPackage(join(dirname(execPath), ...npmParts));
  expect(await findNpmCli({ execPath, env: {} })).toBe(await realpath(npm));
});

test('explicit DSH entries take priority over local packages', async () => {
  const root = await fixture();
  await file(join(root, 'package.json'), '{}');
  const packageRoot = join(root, 'node_modules', '@deepseek-ai', 'dsh');
  await file(join(packageRoot, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh' }));
  const local = await file(join(packageRoot, 'lib', 'bin.js'));
  const explicit = await file(join(root, 'chosen', 'bin.js'));
  expect(await findDshCli({ root, explicit: 'chosen/bin.js' })).toBe(await realpath(explicit));
  expect(await findDshCli({ root })).toBe(await realpath(local));
  await expect(findDshCli({ root, explicit: 'missing.js' })).rejects.toThrow('DSH entry does not exist');
});

test('finds a separate Windows user-global DSH installation', async () => {
  const root = await fixture();
  await file(join(root, 'package.json'), '{}');
  const appData = join(root, 'AppData', 'Roaming');
  const packageRoot = join(appData, 'npm', 'node_modules', '@deepseek-ai', 'dsh');
  await file(join(packageRoot, 'package.json'), JSON.stringify({ name: '@deepseek-ai/dsh' }));
  const entry = await file(join(packageRoot, 'lib', 'bin.js'));
  expect(await findDshCli({ root, env: { APPDATA: appData } })).toBe(await realpath(entry));
});
