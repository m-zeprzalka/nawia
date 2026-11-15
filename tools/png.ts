// Minimal PNG writer (RGBA8), no dependencies.
import { deflateSync, crc32 } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { PixelBuffer } from '../src/core/PixelBuffer.ts';

function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

export function encodePng(buf: PixelBuffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(buf.w, 0);
  ihdr.writeUInt32BE(buf.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const stride = buf.w * 4;
  const raw = Buffer.alloc((stride + 1) * buf.h);
  for (let y = 0; y < buf.h; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(buf.data.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

export function writePng(path: string, buf: PixelBuffer): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, encodePng(buf));
}
