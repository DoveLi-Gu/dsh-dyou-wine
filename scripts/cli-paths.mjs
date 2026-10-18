import { execFile } from 'node:child_process';
import { stat, readFile, realpath } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, delimiter, dirname, isAbsolute, join, resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

async function existingFile(path) {
  try { return (await stat(path)).isFile() ? await realpath(path) : undefined; }
  catch { return undefined; }
}

async function namedPackageFile(path, name, levels) {
  const file = await existingFile(path);
  if (!file) return undefined;
  let directory = dirname(file);
  for (let index = 0; index < levels; index++) directory = dirname(directory);
  try {
    const pkg = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'));
    return pkg.name === name ? file : undefined;
  } catch { return undefined; }
}

/** Locate the real npm JavaScript entry, without executing PATH shell wrappers. */
export async function findNpmCli({ execPath = process.execPath, env = process.env } = {}) {
  const executable = await existingFile(execPath);
  const directories = new Set([dirname(execPath), executable && dirname(executable)]);
  const candidates = [env.npm_execpath];
  if (env.APPDATA) directories.add(join(env.APPDATA, 'npm'));
  for (const prefix of [env.npm_config_prefix, env.NPM_CONFIG_PREFIX]) {
    if (prefix) { directories.add(prefix); directories.add(join(prefix, 'bin')); }
  }
  for (const directory of (env.PATH ?? env.Path ?? '').split(delimiter).filter(Boolean)) {
    directories.add(directory.replace(/^"(.*)"$/, '$1'));
  }
  for (const directory of directories) {
    if (!directory) continue;
    candidates.push(
      join(directory, 'node_modules', 'npm', 'bin', 'npm-cli.js'),
      resolve(directory, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'),
      resolve(directory, '..', 'share', 'nodejs', 'npm', 'bin', 'npm-cli.js'),
      // On Unix, npm is often a symlink to npm-cli.js in a package directory.
      join(directory, 'npm'),
    );
  }
  for (const candidate of new Set(candidates.filter(Boolean))) {
    const actual = await existingFile(candidate);
    if (actual && basename(actual) === 'npm-cli.js') {
      const verified = await namedPackageFile(actual, 'npm', 1);
      if (verified) return verified;
    }
  }
  throw new Error('Cannot locate npm CLI. Install npm beside Node, add its bin directory to PATH, or run through npm.');
}

/** Prefer an explicit DSH entry, then a local package, then npm's global root. */
export async function findDshCli({ root, explicit, npmCli, execPath = process.execPath, env = process.env }) {
  if (explicit) {
    const file = await existingFile(resolve(root, explicit));
    if (!file) throw new Error(`DSH entry does not exist: ${explicit}`);
    return file;
  }
  const require = createRequire(join(root, 'package.json'));
  try {
    const packagePath = require.resolve('@deepseek-ai/dsh/package.json');
    const local = await namedPackageFile(join(dirname(packagePath), 'lib', 'bin.js'), '@deepseek-ai/dsh', 1);
    if (local) return local;
  } catch {}
  // Only execute the validated npm entry with a read-only command. This does
  // not install packages, run lifecycle scripts, or print npm configuration.
  const roots = [];
  if (npmCli) {
    try {
      const { stdout } = await execFileAsync(execPath, [npmCli, 'root', '--global', '--ignore-scripts'], {
        cwd: root, env, windowsHide: true, timeout: 15_000, maxBuffer: 64 * 1024,
      });
      const globalRoot = stdout.trim();
      if (isAbsolute(globalRoot) && !globalRoot.includes('\n') && !globalRoot.includes('\r')) roots.push(globalRoot);
    } catch {
      // A stale npm prefix must not hide a valid DSH installation on PATH.
    }
  }
  if (env.APPDATA) roots.push(join(env.APPDATA, 'npm', 'node_modules'));
  for (const directory of (env.PATH ?? env.Path ?? '').split(delimiter).filter(Boolean)) {
    const bin = directory.replace(/^"(.*)"$/, '$1');
    roots.push(join(bin, 'node_modules'), resolve(bin, '..', 'lib', 'node_modules'));
  }
  for (const packageRoot of new Set(roots)) {
    const entry = await namedPackageFile(join(packageRoot, '@deepseek-ai', 'dsh', 'lib', 'bin.js'), '@deepseek-ai/dsh', 1);
    if (entry) return entry;
  }
  throw new Error('Cannot locate dsh. Install @deepseek-ai/dsh@0.2.0-rc.2 or pass --dsh-bin <path/to/lib/bin.js>.');
}
