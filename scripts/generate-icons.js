import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawFn) {
  // RGBA buffer
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = a;
    }
  }

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    const scanlineOffset = y * (width * 4 + 1);
    scanlines[scanlineOffset] = 0; // Filter None
    rgba.copy(scanlines, scanlineOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const idatData = zlib.deflateSync(scanlines);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    
    // Calculate CRC32
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);

    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // Compression deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace none

  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', idatData);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

// Draw bible app icon with gradient and rounded square
function drawAppIcon(x, y, w, h) {
  // Normalize
  const nx = x / w;
  const ny = y / h;

  // Background gradient: #4657c8 to #7855c7
  const r1 = 0x46, g1 = 0x57, b1 = 0xc8;
  const r2 = 0x80, g2 = 0x54, b2 = 0xc9;
  
  const r = Math.round(r1 + (r2 - r1) * ((nx + ny) / 2));
  const g = Math.round(g1 + (g2 - g1) * ((nx + ny) / 2));
  const b = Math.round(b1 + (b2 - b1) * ((nx + ny) / 2));

  // Center symbol: Cross + book shape in golden white
  const cx = nx - 0.5;
  const cy = ny - 0.5;
  
  // Vertical beam of cross: |cx| < 0.05 && cy between -0.3 and 0.25
  const isVBeam = Math.abs(cx) < 0.05 && cy > -0.28 && cy < 0.22;
  // Horizontal beam of cross: |cy + 0.1| < 0.05 && cx between -0.22 and 0.22
  const isHBeam = Math.abs(cy + 0.1) < 0.05 && cx > -0.22 && cx < 0.22;

  // Book base shape below cross: cy between 0.15 and 0.32, cx between -0.28 and 0.28
  const isBook = cy > 0.18 && cy < 0.30 && Math.abs(cx) < 0.28 && Math.abs(cy - 0.24) < (0.08 - Math.abs(cx) * 0.15);

  if (isVBeam || isHBeam || isBook) {
    return [255, 248, 235, 255]; // Golden ivory white
  }

  // Rounded corner mask for non-maskable icons
  return [r, g, b, 255];
}

const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

fs.writeFileSync(path.join(pubDir, 'icon-192.png'), createPng(192, 192, drawAppIcon));
fs.writeFileSync(path.join(pubDir, 'icon-512.png'), createPng(512, 512, drawAppIcon));
fs.writeFileSync(path.join(pubDir, 'icon-maskable.png'), createPng(512, 512, drawAppIcon));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), createPng(180, 180, drawAppIcon));

console.log('PWA PNG Icons created successfully!');
