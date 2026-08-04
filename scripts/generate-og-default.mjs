import { mkdir, writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';

// Generate the OGP PNG during builds so the GitHub web conflict editor never
// has to handle a binary source file. No image library is required.
const width = 1200;
const height = 630;
const pixels = Buffer.alloc(width * height * 4);

const rgba = (hex, alpha = 255) => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
  alpha
];

function setPixel(x, y, color) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const index = (y * width + x) * 4;
  pixels[index] = color[0];
  pixels[index + 1] = color[1];
  pixels[index + 2] = color[2];
  pixels[index + 3] = color[3];
}

function rectangle(x, y, rectangleWidth, rectangleHeight, color) {
  for (let row = y; row < y + rectangleHeight; row += 1) {
    for (let column = x; column < x + rectangleWidth; column += 1) setPixel(column, row, color);
  }
}

function circle(centerX, centerY, radius, color) {
  for (let y = -radius; y <= radius; y += 1) {
    const halfWidth = Math.floor(Math.sqrt(radius * radius - y * y));
    rectangle(centerX - halfWidth, centerY + y, halfWidth * 2 + 1, 1, color);
  }
}

const glyphs = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  N: ['10001', '11001', '11001', '10101', '10011', '10011', '10001'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100']
};

function text(value, x, y, scale, color) {
  let cursor = x;
  for (const character of value) {
    const glyph = glyphs[character];
    if (!glyph) {
      cursor += scale * 3;
      continue;
    }
    glyph.forEach((row, rowIndex) => {
      [...row].forEach((bit, columnIndex) => {
        if (bit === '1') rectangle(cursor + columnIndex * scale, y + rowIndex * scale, scale, scale, color);
      });
    });
    cursor += scale * 6;
  }
}

// Soft diagonal background.
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    const blend = (x + y) / (width + height);
    setPixel(x, y, [
      Math.round(248 - blend * 10),
      Math.round(249 - blend * 11),
      255,
      255
    ]);
  }
}

const blue = rgba('#4f6ef7');
const purple = rgba('#a855f7');
const navy = rgba('#24304f');
const muted = rgba('#71809f');
const pale = rgba('#dce5ff');

rectangle(92, 92, 120, 120, blue);
circle(182, 120, 38, purple);
rectangle(126, 124, 34, 52, rgba('#ffffff'));
rectangle(117, 157, 52, 16, rgba('#ffffff'));
text('INTERNBASE', 270, 110, 14, navy);
rectangle(100, 284, 1000, 5, pale);
rectangle(100, 330, 660, 12, blue);
rectangle(100, 368, 865, 12, purple);
rectangle(100, 438, 370, 13, muted);
rectangle(100, 472, 550, 10, rgba('#9aa8c1'));

for (const [x, color] of [[820, blue], [920, purple], [1020, rgba('#22c55e')]]) {
  rectangle(x, 430, 72, 72, rgba('#ffffff'));
  circle(x + 36, 466, 17, color);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(width, 0);
header.writeUInt32BE(height, 4);
header.set([8, 6, 0, 0, 0], 8); // 8-bit RGBA, no interlace.

const scanlines = Buffer.alloc((width * 4 + 1) * height);
for (let y = 0; y < height; y += 1) {
  const outputOffset = y * (width * 4 + 1);
  scanlines[outputOffset] = 0;
  pixels.copy(scanlines, outputOffset + 1, y * width * 4, (y + 1) * width * 4);
}

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', header),
  chunk('IDAT', deflateSync(scanlines, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);

await mkdir(new URL('../public/', import.meta.url), { recursive: true });
await writeFile(new URL('../public/og-default.png', import.meta.url), png);
console.log(`Generated public/og-default.png (${width}x${height}, ${png.length} bytes)`);
