/**
 * Generate PNG icons for Chrome extension
 * Uses pngjs to create simple colored square icons
 */

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const iconsDir = path.join(__dirname, 'icons');

function createIcon(size) {
  const png = new PNG({ width: size, height: size });
  
  // Create gradient-like effect with purple colors
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      
      // Gradient from #667eea to #764ba2
      const ratio = (x + y) / (size * 2);
      const r = Math.floor(102 + (118 - 102) * ratio); // 667eea -> 764ba2
      const g = Math.floor(126 + (75 - 126) * ratio);
      const b = Math.floor(234 + (162 - 234) * ratio);
      
      png.data[idx] = r;     // R
      png.data[idx + 1] = g; // G
      png.data[idx + 2] = b; // B
      png.data[idx + 3] = 255; // A
    }
  }
  
  // Add rounded corners by making corners transparent
  const radius = size * 0.2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      
      // Check if pixel is in corner
      let inCorner = false;
      if (x < radius && y < radius) {
        // Top-left corner
        const dx = x - radius;
        const dy = y - radius;
        if (dx * dx + dy * dy > radius * radius) inCorner = true;
      } else if (x >= size - radius && y < radius) {
        // Top-right corner
        const dx = x - (size - radius);
        const dy = y - radius;
        if (dx * dx + dy * dy > radius * radius) inCorner = true;
      } else if (x < radius && y >= size - radius) {
        // Bottom-left corner
        const dx = x - radius;
        const dy = y - (size - radius);
        if (dx * dx + dy * dy > radius * radius) inCorner = true;
      } else if (x >= size - radius && y >= size - radius) {
        // Bottom-right corner
        const dx = x - (size - radius);
        const dy = y - (size - radius);
        if (dx * dx + dy * dy > radius * radius) inCorner = true;
      }
      
      if (inCorner) {
        png.data[idx + 3] = 0; // Make transparent
      }
    }
  }
  
  // Add "U" letter in center
  const centerX = size / 2;
  const centerY = size / 2;
  const letterSize = size * 0.4;
  
  // Simple "U" shape (white)
  for (let y = centerY - letterSize / 2; y < centerY + letterSize / 2; y++) {
    for (let x = centerX - letterSize / 2; x < centerX + letterSize / 2; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const idx = (size * Math.floor(y) + Math.floor(x)) << 2;
        
        // Draw U shape (simplified)
        const relX = x - centerX;
        const relY = y - centerY;
        const absX = Math.abs(relX);
        const absY = Math.abs(relY);
        
        // U shape: left vertical, bottom curve, right vertical
        if ((absX < letterSize * 0.15 && absY < letterSize * 0.4) || // Left vertical
            (absX < letterSize * 0.15 && absY > letterSize * 0.3) ||  // Right vertical (simplified)
            (absY > letterSize * 0.35 && absX < letterSize * 0.25)) { // Bottom curve
          png.data[idx] = 255;     // R
          png.data[idx + 1] = 255; // G
          png.data[idx + 2] = 255; // B
          png.data[idx + 3] = 255; // A
        }
      }
    }
  }
  
  return png;
}

function generateIcons() {
  const sizes = [16, 48, 128];
  
  sizes.forEach(size => {
    const png = createIcon(size);
    const filePath = path.join(iconsDir, `icon${size}.png`);
    
    png.pack().pipe(fs.createWriteStream(filePath))
      .on('finish', () => {
        console.log(`✓ Created ${filePath}`);
      })
      .on('error', (err) => {
        console.error(`✗ Error creating ${filePath}:`, err);
      });
  });
}

// Run
console.log('Generating PNG icons...');
generateIcons();

