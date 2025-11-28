/**
 * Script to create simple placeholder icons for the extension
 * Run with: node create-icons.js
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create a simple SVG icon
function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" 
        fill="white" text-anchor="middle" dominant-baseline="central">U</text>
</svg>`;
}

// Convert SVG to PNG using a simple approach
// For production, you'd use a library like sharp or canvas
// For now, we'll create SVG files and note that Chrome can use SVG in manifest v3

const sizes = [16, 48, 128];

sizes.forEach(size => {
  const svg = createSVGIcon(size);
  const svgPath = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`Created ${svgPath}`);
});

console.log('\nIcons created! Note: Chrome extensions typically use PNG files.');
console.log('For production, convert these SVG files to PNG using:');
console.log('  - Online tools: https://convertio.co/svg-png/');
console.log('  - ImageMagick: convert icon.svg -resize 16x16 icon16.png');
console.log('  - Or use a design tool like Figma, Sketch, etc.');

