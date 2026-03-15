const fs = require('fs')

function createPNG(width, height, bgR, bgG, bgB) {
  const PNG_HEADER = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  
  function crc32(buf) {
    const table = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
      table[i] = c
    }
    let crc = 0xFFFFFFFF
    for (const byte of buf) crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8)
    return (crc ^ 0xFFFFFFFF) >>> 0
  }

  function chunk(type, data) {
    const typeBuffer = Buffer.from(type)
    const lenBuffer = Buffer.allocUnsafe(4)
    lenBuffer.writeUInt32BE(data.length)
    const crcBuffer = Buffer.allocUnsafe(4)
    const crcData = Buffer.concat([typeBuffer, data])
    crcBuffer.writeUInt32BE(crc32(crcData))
    return Buffer.concat([lenBuffer, typeBuffer, data, crcBuffer])
  }

  // IHDR
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 2   // color type RGB
  ihdr[10] = 0  // compression
  ihdr[11] = 0  // filter
  ihdr[12] = 0  // interlace

  // Image data — solid color
  const raw = []
  for (let y = 0; y < height; y++) {
    raw.push(0) // filter type
    for (let x = 0; x < width; x++) {
      // Draw lightning bolt shape
      const cx = x - width / 2
      const cy = y - height / 2
      const inBolt = (
        (cx > -20 && cx < 5 && cy > -60 && cy < 10) ||
        (cx > -5 && cx < 20 && cy > -10 && cy < 60)
      )
      if (inBolt) {
        raw.push(255, 255, 255) // white bolt
      } else {
        raw.push(bgR, bgG, bgB) // background
      }
    }
  }

  const zlib = require('zlib')
  const rawBuffer = Buffer.from(raw)
  const compressed = zlib.deflateSync(rawBuffer)

  return Buffer.concat([
    PNG_HEADER,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const png = createPNG(256, 256, 245, 166, 35) // orange background
fs.writeFileSync('assets/icon.png', png)
console.log('✅ icon.png created — 256x256 orange with lightning bolt')
