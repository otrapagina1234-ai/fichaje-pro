import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

// CRC32 implementation for PNG chunks
function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function generatePngBuffer(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc((width * 4 + 1) * height);

  const cx = width / 2;
  const cy = height / 2;
  const rBg = size * (isMaskable ? 0.48 : 0.46);
  const rClock = size * 0.32;
  const rInner = size * 0.26;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: Dark Teal / Rounded App Icon
      let r = 0x00, g = 0x7d, b = 0x7a, a = 0xff; // #007d7a

      if (!isMaskable) {
        // Rounded corners or circular icon badge
        const cornerDist = Math.max(Math.abs(dx), Math.abs(dy));
        if (cornerDist > size * 0.48) {
          a = 0; // transparent outside
        }
      }

      if (a > 0) {
        // Clock outer ring
        if (dist <= rClock && dist >= rInner) {
          r = 0xff; g = 0xd7; b = 0x00; // Gold ring #ffd700
        } else if (dist < rInner) {
          // Inner clock face: clean off-white
          r = 0xf7; g = 0xf6; b = 0xdd; // #f7f6dd

          // Clock hands
          // Hour hand (pointing to 10 o'clock)
          const hDist = Math.sqrt(Math.pow(dx + dy * 0.5, 2));
          if (dx < 0 && dy < 0 && dist < rInner * 0.6 && hDist < size * 0.02) {
            r = 0x00; g = 0x5a; b = 0x57;
          }
          // Minute hand (pointing to 2 o'clock)
          const mDist = Math.sqrt(Math.pow(dx - dy * 0.5, 2));
          if (dx > 0 && dy < 0 && dist < rInner * 0.8 && mDist < size * 0.015) {
            r = 0x00; g = 0x5a; b = 0x57;
          }
          // Center pin
          if (dist < size * 0.035) {
            r = 0xff; g = 0xd7; b = 0x00;
          }
          // Checkmark at bottom right of clock
          if (dx > size * 0.05 && dy > size * 0.05 && dist < rInner) {
            // green badge
            const bdx = dx - size * 0.12;
            const bdy = dy - size * 0.12;
            if (Math.sqrt(bdx * bdx + bdy * bdy) < size * 0.1) {
              r = 0x28; g = 0xa7; b = 0x45;
            }
          }
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate icons
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), generatePngBuffer(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), generatePngBuffer(512));
fs.writeFileSync(path.join(publicDir, 'icon-maskable-512.png'), generatePngBuffer(512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePngBuffer(180));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePngBuffer(64));

console.log('✅ Icons generated successfully in public/');
