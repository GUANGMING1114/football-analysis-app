const fs = require('fs');
const path = require('path');

function svgIcon(size) {
  const scale = size / 512;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#07111f"/>
  <circle cx="256" cy="256" r="160" fill="#22c55e" opacity="0.2"/>
  <circle cx="256" cy="256" r="120" fill="none" stroke="#22c55e" stroke-width="20"/>
  <path d="M256 136 L256 256 L352 256" stroke="#7dd3fc" stroke-width="24" fill="none" stroke-linecap="round"/>
  <text x="256" y="420" text-anchor="middle" fill="#f8fafc" font-size="48" font-weight="900" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif">足球分析</text>
</svg>`;
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon(512));
console.log('SVG icon generated at public/icon.svg');
