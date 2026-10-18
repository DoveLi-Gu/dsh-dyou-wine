import { createHash } from 'node:crypto';
import { createReadStream, type ReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface AssetRoute {
  kind: 'exact';
  path: string;
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>;
}

/** Structural surface of the optional DSH 0.2 webServer service. */
export interface AssetWebServer {
  register(route: AssetRoute): () => void;
}

const ASSETS = [
  { file: 'BV1hXbN6VEKV.mp3', contentType: 'audio/mpeg' },
  { file: 'whale-girl.png', contentType: 'image/png' },
] as const;
const PREFIX = '/plugins/dsh-dyou-wine/assets/';

interface Metadata { size: number; modified: number; etag: string }
interface ByteRange { start: number; end: number }

/** Unsupported/malformed ranges are ignored; valid unsatisfiable ranges are null. */
function byteRange(header: string | undefined, size: number): ByteRange | null | undefined {
  if (!header) return;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2])) return;
  if (size === 0) return null;
  if (!match[1]) {
    const suffix = Number(match[2]);
    return suffix === 0 ? null : { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return start >= size || start > end ? null : { start, end };
}

function ifRangeMatches(header: string | string[] | undefined, metadata: Metadata): boolean {
  if (!header) return true;
  if (Array.isArray(header)) return false;
  if (header.startsWith('"') || header.startsWith('W/')) return header === metadata.etag;
  const date = Date.parse(header);
  // If-Range date validation uses an exact match, unlike If-Modified-Since.
  return Number.isFinite(date) && date === metadata.modified;
}

function notModified(req: IncomingMessage, metadata: Metadata): boolean {
  const etags = req.headers['if-none-match'];
  if (etags !== undefined) {
    return etags.split(',').some((tag) => {
      const value = tag.trim();
      return value === '*' || value.replace(/^W\//, '') === metadata.etag;
    });
  }
  const date = Date.parse(req.headers['if-modified-since'] ?? '');
  return Number.isFinite(date) && date >= metadata.modified;
}

async function readMetadata(file: URL): Promise<Metadata> {
  const info = await stat(file);
  if (!info.isFile()) throw new Error('Bundled media is not a regular file');
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return {
    size: info.size,
    modified: Math.floor(info.mtimeMs / 1000) * 1000,
    etag: `"${hash.digest('hex')}"`,
  };
}

/** Register only two known files. Request paths never become filesystem paths. */
export function registerAssetRoutes(webServer: AssetWebServer, assets: URL): () => void {
  const unregister: Array<() => void> = [];
  const streams = new Map<ReadStream, ServerResponse>();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const remove of unregister.reverse()) remove();
    for (const [stream, res] of streams) { stream.destroy(); res.destroy(); }
    streams.clear();
  };

  try {
    for (const asset of ASSETS) {
      const file = new URL(asset.file, assets);
      // Hash and stat are asynchronous and shared across concurrent requests.
      // A failed read is retried by a later request after the file is repaired.
      let cached: Promise<Metadata> | undefined;
      unregister.push(webServer.register({
        kind: 'exact', path: `${PREFIX}${asset.file}`,
        async handler(req, res) {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Length': '0' });
            res.end();
            return;
          }
          try {
            const metadata = await (cached ??= readMetadata(file).catch((error: unknown) => {
              cached = undefined;
              throw error;
            }));
            if (res.destroyed) return;
            if (disposed) {
              res.writeHead(503, { 'Content-Length': '0', 'Cache-Control': 'no-store' });
              res.end();
              return;
            }
            res.setHeader('Content-Type', asset.contentType);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('X-Content-Type-Options', 'nosniff');
            // The stable URL must revalidate after package upgrades.
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
            res.setHeader('ETag', metadata.etag);
            res.setHeader('Last-Modified', new Date(metadata.modified).toUTCString());
            if (notModified(req, metadata)) {
              res.writeHead(304);
              res.end();
              return;
            }
            // RFC 9110: Range is defined for GET, and is ignored for HEAD.
            const range = req.method === 'GET' && ifRangeMatches(req.headers['if-range'], metadata)
              ? byteRange(req.headers.range, metadata.size) : undefined;
            if (range === null) {
              res.writeHead(416, { 'Content-Range': `bytes */${metadata.size}`, 'Content-Length': '0' });
              res.end();
              return;
            }
            const status = range ? 206 : 200;
            res.setHeader('Content-Length', range ? range.end - range.start + 1 : metadata.size);
            if (range) res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${metadata.size}`);
            if (req.method === 'HEAD' || metadata.size === 0) {
              res.writeHead(status);
              res.end();
              return;
            }
            const stream = createReadStream(file, range ?? {});
            streams.set(stream, res);
            const close = () => stream.destroy();
            res.once('close', close);
            stream.once('close', () => {
              streams.delete(stream);
              res.removeListener('close', close);
            });
            stream.once('error', () => {
              if (res.destroyed) return;
              if (res.headersSent) res.destroy();
              else {
                res.removeHeader('Content-Range');
                res.writeHead(500, { 'Content-Length': '0', 'Cache-Control': 'no-store' });
                res.end();
              }
            });
            stream.once('open', () => {
              if (disposed || res.destroyed) { stream.destroy(); if (!res.destroyed) res.destroy(); return; }
              res.writeHead(status);
              stream.pipe(res);
            });
          } catch {
            if (res.destroyed) return;
            if (res.headersSent) res.destroy();
            else {
              res.writeHead(500, { 'Content-Length': '0', 'Cache-Control': 'no-store' });
              res.end();
            }
          }
        },
      }));
    }
  } catch (error) {
    dispose();
    throw error;
  }
  return dispose;
}
