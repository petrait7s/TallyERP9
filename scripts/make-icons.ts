/** Draws the app icon (original artwork, no Tally assets): npx vite-node scripts/make-icons.ts */
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const N = 256;
const px = new Uint8Array(N * N * 4);
const rect = (x0: number, y0: number, x1: number, y1: number, [r, g, b]: number[]) => {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * N + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255; }
};
rect(0, 0, N, N, [27, 79, 114]);                 // deep blue
rect(8, 8, N - 8, N - 8, [255, 251, 232]);       // cream panel
rect(8, 8, N - 8, 52, [27, 79, 114]);            // title strip
rect(40, 80, 216, 108, [27, 79, 114]);           // T bar
rect(114, 80, 142, 200, [27, 79, 114]);          // T stem
rect(40, 214, 216, 226, [0, 168, 232]);          // selection bar (cyan)
rect(60, 20, 196, 40, [255, 255, 255]);          // title text hint

function crc32(buf: Uint8Array): number {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; }
  return (crc ^ 0xffffffff) >>> 0;
}
const chunk = (type: string, data: Uint8Array) => {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  out.set(new TextEncoder().encode(type), 4);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
};
const raw = new Uint8Array(N * (N * 4 + 1));
for (let y = 0; y < N; y++) { raw[y * (N * 4 + 1)] = 0; raw.set(px.subarray(y * N * 4, (y + 1) * N * 4), y * (N * 4 + 1) + 1); }
const ihdr = new Uint8Array(13);
const dv = new DataView(ihdr.buffer);
dv.setUint32(0, N); dv.setUint32(4, N); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array(0))]);

// ICO container with one 256x256 PNG image
const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0); ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4);
ico[6] = 0; ico[7] = 0; ico[8] = 0; ico[9] = 0; ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png.length, 14); ico.writeUInt32LE(22, 18);
mkdirSync('build', { recursive: true });
writeFileSync('build/icon.png', png);
writeFileSync('build/icon.ico', Buffer.concat([ico, png]));
console.log(`icon.png ${png.length} bytes`);
