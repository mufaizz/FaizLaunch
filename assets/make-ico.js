const fs = require('fs')

// Create minimal valid ICO file with 256x256 icon
// ICO format: header + directory + PNG data
function createICO() {
  // We'll embed a valid PNG as the icon data
  const zlib = require('zlib')
  
  const size = 256
  
  // Create raw image data (orange #F5A623 background with white lightning)
  const raw = []
  for (let y = 0; y < size; y++) {
    raw.push(0) // filter byte
    for (let x = 0; x < size; x++) {
      const cx = x - size/2
      const cy = y - size/2
      // Lightning bolt shape
      const inBolt = (
        (cx >= -25 && cx <= 5 && cy >= -80 && cy <= 10) ||
        (cx >= -5 && cx <= 25 && cy >= -10 && cy <= 80)
      )
      if (inBolt) {
        raw.push(255, 255, 255, 255) // white RGBA
      } else {
        raw.push(245, 166, 35, 255) // orange RGBA
      }
    }
  }

  // PNG with RGBA (color type 6)
  function crc32(buf) {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
      t[i] = c
    }
    let c = 0xFFFFFFFF
    for (const b of buf) c = t[(c ^ b) & 0xFF] ^ (c >>> 8)
    return (c ^ 0xFFFFFFFF) >>> 0
  }

  function chunk(type, data) {
    const tb = Buffer.from(type)
    const lb = Buffer.allocUnsafe(4)
    lb.writeUInt32BE(data.length)
    const cb = Buffer.allocUnsafe(4)
    cb.writeUInt32BE(crc32(Buffer.concat([tb, data])))
    return Buffer.concat([lb, tb, data, cb])
  }

  const header = Buffer.from([137,80,78,71,13,10,26,10])
  
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 6  // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0

  const compressed = zlib.deflateSync(Buffer.from(raw))
  
  const pngData = Buffer.concat([
    header,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ])

  // ICO header
  const icoHeader = Buffer.allocUnsafe(6)
  icoHeader.writeUInt16LE(0, 0)  // reserved
  icoHeader.writeUInt16LE(1, 2)  // type: ICO
  icoHeader.writeUInt16LE(1, 4)  // count: 1 image

  // ICO directory entry
  const dirEntry = Buffer.allocUnsafe(16)
  dirEntry[0] = 0    // width (0 = 256)
  dirEntry[1] = 0    // height (0 = 256)
  dirEntry[2] = 0    // color count
  dirEntry[3] = 0    // reserved
  dirEntry.writeUInt16LE(1, 4)   // color planes
  dirEntry.writeUInt16LE(32, 6)  // bits per pixel
  dirEntry.writeUInt32LE(pngData.length, 8)  // size of image data
  dirEntry.writeUInt32LE(6 + 16, 12) // offset of image data

  const ico = Buffer.concat([icoHeader, dirEntry, pngData])
  fs.writeFileSync('assets/icon.ico', ico)
  
  // Also save png
  fs.writeFileSync('assets/icon.png', pngData)
  
  console.log('✅ icon.ico and icon.png created successfully')
  console.log('   ICO size:', ico.length, 'bytes')
  console.log('   PNG size:', pngData.length, 'bytes')
}

createICO()
