import { Context } from '@deepseek-ai/cordis';
import { mkdtemp, rm, rmdir, writeFile } from 'node:fs/promises';
import { createServer, request, type IncomingHttpHeaders, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apply } from '../src/host';
import { registerAssetRoutes, type AssetRoute, type AssetWebServer } from '../src/server/assets';

const prefix = '/plugins/dsh-dyou-wine/assets/';
const music = `${prefix}BV1hXbN6VEKV.mp3`;
const contents = Buffer.from('0123456789');

function registry(): AssetWebServer & { routes: Map<string, AssetRoute> } {
  const routes = new Map<string, AssetRoute>();
  return {
    routes,
    register(route) {
      if (routes.has(route.path)) throw new Error('Duplicate route');
      routes.set(route.path, route);
      return () => { routes.delete(route.path); };
    },
  };
}

describe('package-local Host media routes over node:http', () => {
  let directory: string;
  let server: Server;
  let port: number;
  let routes: ReturnType<typeof registry>;
  let dispose: () => void;

  function get(path = music, headers: Record<string, string> = {}, method = 'GET') {
    return new Promise<{ status: number; headers: IncomingHttpHeaders; body: Buffer }>((resolve, reject) => {
      const req = request({ hostname: '127.0.0.1', port, path, method, headers }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('error', reject);
        res.on('end', () => resolve({ status: res.statusCode!, headers: res.headers, body: Buffer.concat(chunks) }));
      });
      req.on('error', reject);
      req.end();
    });
  }

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'dsh-wine-assets-'));
    await writeFile(join(directory, 'BV1hXbN6VEKV.mp3'), contents);
    await writeFile(join(directory, 'whale-girl.png'), contents);
    routes = registry();
    dispose = registerAssetRoutes(routes, pathToFileURL(`${directory}/`));
    server = createServer((req, res) => {
      const route = routes.routes.get(new URL(req.url!, 'http://localhost').pathname);
      if (route) void route.handler(req, res);
      else { res.writeHead(404); res.end(); }
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server address');
    port = address.port;
  });

  afterEach(async () => {
    dispose();
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    // Only the two exact files created above are removed; no recursive cleanup.
    await rm(join(directory, 'BV1hXbN6VEKV.mp3'), { force: true });
    await rm(join(directory, 'whale-girl.png'), { force: true });
    await rmdir(directory);
  });

  it('serves exact local media with correct types and cache validators', async () => {
    const audio = await get();
    expect(audio.status).toBe(200);
    expect(audio.body).toEqual(contents);
    expect(audio.headers['content-type']).toBe('audio/mpeg');
    expect(audio.headers['content-length']).toBe('10');
    expect(audio.headers['accept-ranges']).toBe('bytes');
    expect(audio.headers['x-content-type-options']).toBe('nosniff');
    expect(audio.headers['cache-control']).toBe('public, max-age=0, must-revalidate');
    expect(audio.headers.etag).toMatch(/^"[a-f0-9]{64}"$/);
    const image = await get(`${prefix}whale-girl.png?rev=1`);
    expect(image.status).toBe(200);
    expect(image.headers['content-type']).toBe('image/png');
  });

  it.each([
    ['bytes=2-5', '2345', 'bytes 2-5/10'],
    ['bytes=7-', '789', 'bytes 7-9/10'],
    ['bytes=-3', '789', 'bytes 7-9/10'],
    ['bytes=-999999999999999999999', '0123456789', 'bytes 0-9/10'],
    ['bytes=8-999999999999999999999', '89', 'bytes 8-9/10'],
    ['bytes=0-0', '0', 'bytes 0-0/10'],
  ])('supports bounded, open-ended and suffix ranges: %s', async (range, body, contentRange) => {
    const response = await get(music, { Range: range });
    expect(response.status).toBe(206);
    expect(response.body.toString()).toBe(body);
    expect(response.headers['content-range']).toBe(contentRange);
    expect(response.headers['content-length']).toBe(String(body.length));
  });

  it.each(['bytes=10-', 'bytes=999999999999999999999-', 'bytes=6-3', 'bytes=-0'])(
    'returns 416 without leaking bytes for unsatisfiable range: %s', async (range) => {
      const response = await get(music, { Range: range });
      expect(response.status).toBe(416);
      expect(response.headers['content-range']).toBe('bytes */10');
      expect(response.headers['content-length']).toBe('0');
      expect(response.body.length).toBe(0);
    },
  );

  it('ignores malformed, unsupported and multipart ranges', async () => {
    for (const range of ['bytes=-', 'bytes=abc', 'items=0-1', 'bytes=0-1,4-5']) {
      const response = await get(music, { Range: range });
      expect(response.status).toBe(200);
      expect(response.headers['content-range']).toBeUndefined();
      expect(response.body).toEqual(contents);
    }
  });

  it('honors strong If-Range validators and dates, ignoring stale or weak validators', async () => {
    const full = await get();
    for (const validator of [full.headers.etag!, full.headers['last-modified']!]) {
      expect((await get(music, { Range: 'bytes=1-2', 'If-Range': validator })).status).toBe(206);
    }
    for (const validator of [
      '"stale"', `W/${full.headers.etag}`, 'Thu, 01 Jan 1970 00:00:00 GMT',
      new Date(Date.now() + 86_400_000).toUTCString(), 'invalid',
    ]) {
      const response = await get(music, { Range: 'bytes=100-', 'If-Range': validator });
      expect(response.status).toBe(200);
      expect(response.body).toEqual(contents);
    }
  });

  it('revalidates cached bytes without a body, and gives If-None-Match precedence', async () => {
    const first = await get();
    const validations: Array<Record<string, string>> = [
      { 'If-None-Match': first.headers.etag! },
      { 'If-None-Match': `"old", W/${first.headers.etag}` },
      { 'If-None-Match': '*' },
      { 'If-Modified-Since': first.headers['last-modified']! },
    ];
    for (const headers of validations) {
      const response = await get(music, headers);
      expect(response.status).toBe(304);
      expect(response.body.length).toBe(0);
    }
    expect((await get(music, {
      'If-None-Match': '"different"', 'If-Modified-Since': first.headers['last-modified']!,
    })).status).toBe(200);
  });

  it('HEAD sends full resource headers without a body and ignores Range', async () => {
    const response = await get(music, { Range: 'bytes=2-4' }, 'HEAD');
    expect(response.status).toBe(200);
    expect(response.headers['content-length']).toBe('10');
    expect(response.headers['content-range']).toBeUndefined();
    expect(response.body.length).toBe(0);
  });

  it('rejects writes and exposes neither directory indexes nor arbitrary paths', async () => {
    const response = await get(music, {}, 'POST');
    expect(response.status).toBe(405);
    expect(response.headers.allow).toBe('GET, HEAD');
    for (const path of [prefix, `${prefix}package.json`, `${prefix}../host.js`, `${prefix}whale-girl.png/extra`]) {
      expect((await get(path)).status).toBe(404);
    }
  });

  it('handles empty files and missing-file failures, and retries metadata reads after repair', async () => {
    const imagePath = join(directory, 'whale-girl.png');
    await rm(imagePath);
    expect((await get(`${prefix}whale-girl.png`)).status).toBe(500);
    await writeFile(imagePath, '');
    const response = await get(`${prefix}whale-girl.png`);
    expect(response.status).toBe(200);
    expect(response.headers['content-length']).toBe('0');
    expect((await get(`${prefix}whale-girl.png`, { Range: 'bytes=0-' })).status).toBe(416);
  });

  it('handles a stream read failure after cached metadata without hanging or crashing', async () => {
    expect((await get()).status).toBe(200);
    await rm(join(directory, 'BV1hXbN6VEKV.mp3'));
    const response = await get();
    expect(response.status).toBe(500);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.length).toBe(0);
  });

  it('unregisters every route on disposal and can register again', async () => {
    expect(routes.routes.size).toBe(2);
    dispose(); dispose();
    expect(routes.routes.size).toBe(0);
    expect((await get()).status).toBe(404);
    dispose = registerAssetRoutes(routes, pathToFileURL(`${directory}/`));
    expect((await get()).status).toBe(200);
  });

  it('terminates active streams when their registration is disposed', async () => {
    await writeFile(join(directory, 'BV1hXbN6VEKV.mp3'), Buffer.alloc(16 * 1024 * 1024, 7));
    await new Promise<void>((resolve, reject) => {
      const req = request({ hostname: '127.0.0.1', port, path: music }, (res) => {
        expect(res.statusCode).toBe(200);
        res.pause();
        res.on('error', () => {}); // A deliberate server shutdown aborts the client stream.
        res.once('close', resolve);
        dispose();
        // Drain any socket-buffered data so the remote abort becomes observable.
        res.resume();
      });
      req.on('error', reject);
      req.end();
    });
    expect(routes.routes.size).toBe(0);
  });

  it('rolls back earlier registrations when a later registration fails', () => {
    dispose();
    const occupied: AssetRoute = { kind: 'exact', path: `${prefix}whale-girl.png`, handler: async () => {} };
    routes.routes.set(occupied.path, occupied);
    expect(() => registerAssetRoutes(routes, pathToFileURL(`${directory}/`))).toThrow('Duplicate route');
    expect([...routes.routes.values()]).toEqual([occupied]);
    routes.routes.clear();
  });
});

it('Cordis optional injection waits for Web service and cleans up on service or plugin unload', async () => {
  const ctx = new Context();
  const web = registry();
  const plugin = await ctx.plugin({ apply });
  try {
    expect(web.routes.size).toBe(0);
    const removeWeb = ctx.provide('webServer', web);
    await vi.waitFor(() => expect(web.routes.size).toBe(2));
    await removeWeb();
    await vi.waitFor(() => expect(web.routes.size).toBe(0));
    ctx.provide('webServer', web);
    await vi.waitFor(() => expect(web.routes.size).toBe(2));
    await plugin.dispose();
    expect(web.routes.size).toBe(0);
  } finally {
    await ctx.fiber.dispose();
  }
});
