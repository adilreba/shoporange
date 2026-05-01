const fs = require('fs');
const path = require('path');

const ROUTES = [
  '/',
  '/products',
  '/categories',
  '/login',
  '/register',
  '/cart',
  '/profile',
  '/orders',
];

const distDir = path.resolve(__dirname, '../dist');
const indexHtml = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtml)) {
  console.error('dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const html = fs.readFileSync(indexHtml, 'utf-8');

for (const route of ROUTES) {
  if (route === '/') continue; // root zaten var

  const dir = path.join(distDir, route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`Prerendered: ${route}/index.html`);
}

console.log('Static prerender complete.');
