// src/server/assets.ts
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
var ASSETS = [
  { file: "BV1hXbN6VEKV.mp3", contentType: "audio/mpeg" },
  { file: "whale-girl.png", contentType: "image/png" }
];
var PREFIX = "/plugins/dsh-dyou-wine/assets/";
function byteRange(header, size) {
  if (!header) return;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || !match[1] && !match[2]) return;
  if (size === 0) return null;
  if (!match[1]) {
    const suffix = Number(match[2]);
    return suffix === 0 ? null : { start: Math.max(0, size - suffix), end: size - 1 };
  }
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  return start >= size || start > end ? null : { start, end };
}
function ifRangeMatches(header, metadata) {
  if (!header) return true;
  if (Array.isArray(header)) return false;
  if (header.startsWith('"') || header.startsWith("W/")) return header === metadata.etag;
  const date = Date.parse(header);
  return Number.isFinite(date) && date === metadata.modified;
}
function notModified(req, metadata) {
  const etags = req.headers["if-none-match"];
  if (etags !== void 0) {
    return etags.split(",").some((tag) => {
      const value = tag.trim();
      return value === "*" || value.replace(/^W\//, "") === metadata.etag;
    });
  }
  const date = Date.parse(req.headers["if-modified-since"] ?? "");
  return Number.isFinite(date) && date >= metadata.modified;
}
async function readMetadata(file) {
  const info = await stat(file);
  if (!info.isFile()) throw new Error("Bundled media is not a regular file");
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return {
    size: info.size,
    modified: Math.floor(info.mtimeMs / 1e3) * 1e3,
    etag: `"${hash.digest("hex")}"`
  };
}
function registerAssetRoutes(webServer, assets) {
  const unregister = [];
  const streams = /* @__PURE__ */ new Map();
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const remove of unregister.reverse()) remove();
    for (const [stream, res] of streams) {
      stream.destroy();
      res.destroy();
    }
    streams.clear();
  };
  try {
    for (const asset of ASSETS) {
      const file = new URL(asset.file, assets);
      let cached;
      unregister.push(webServer.register({
        kind: "exact",
        path: `${PREFIX}${asset.file}`,
        async handler(req, res) {
          if (req.method !== "GET" && req.method !== "HEAD") {
            res.writeHead(405, { Allow: "GET, HEAD", "Content-Length": "0" });
            res.end();
            return;
          }
          try {
            const metadata = await (cached ??= readMetadata(file).catch((error) => {
              cached = void 0;
              throw error;
            }));
            if (res.destroyed) return;
            if (disposed) {
              res.writeHead(503, { "Content-Length": "0", "Cache-Control": "no-store" });
              res.end();
              return;
            }
            res.setHeader("Content-Type", asset.contentType);
            res.setHeader("Accept-Ranges", "bytes");
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
            res.setHeader("ETag", metadata.etag);
            res.setHeader("Last-Modified", new Date(metadata.modified).toUTCString());
            if (notModified(req, metadata)) {
              res.writeHead(304);
              res.end();
              return;
            }
            const range = req.method === "GET" && ifRangeMatches(req.headers["if-range"], metadata) ? byteRange(req.headers.range, metadata.size) : void 0;
            if (range === null) {
              res.writeHead(416, { "Content-Range": `bytes */${metadata.size}`, "Content-Length": "0" });
              res.end();
              return;
            }
            const status = range ? 206 : 200;
            res.setHeader("Content-Length", range ? range.end - range.start + 1 : metadata.size);
            if (range) res.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${metadata.size}`);
            if (req.method === "HEAD" || metadata.size === 0) {
              res.writeHead(status);
              res.end();
              return;
            }
            const stream = createReadStream(file, range ?? {});
            streams.set(stream, res);
            const close = () => stream.destroy();
            res.once("close", close);
            stream.once("close", () => {
              streams.delete(stream);
              res.removeListener("close", close);
            });
            stream.once("error", () => {
              if (res.destroyed) return;
              if (res.headersSent) res.destroy();
              else {
                res.removeHeader("Content-Range");
                res.writeHead(500, { "Content-Length": "0", "Cache-Control": "no-store" });
                res.end();
              }
            });
            stream.once("open", () => {
              if (disposed || res.destroyed) {
                stream.destroy();
                if (!res.destroyed) res.destroy();
                return;
              }
              res.writeHead(status);
              stream.pipe(res);
            });
          } catch {
            if (res.destroyed) return;
            if (res.headersSent) res.destroy();
            else {
              res.writeHead(500, { "Content-Length": "0", "Cache-Control": "no-store" });
              res.end();
            }
          }
        }
      }));
    }
  } catch (error) {
    dispose();
    throw error;
  }
  return dispose;
}

// src/host.ts
var name = "dsh-dyou-wine";
function apply(ctx) {
  ctx.inject(["webServer"], (injected) => {
    const { webServer } = injected;
    injected.effect(
      () => registerAssetRoutes(webServer, new URL("./assets/", import.meta.url)),
      "dsh-dyou-wine: bundled media routes"
    );
  });
}
export {
  apply,
  name
};
