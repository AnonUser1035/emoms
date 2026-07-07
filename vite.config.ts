import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served at the root of its own subdomain (emoms.ryanbohluli.com), so base
// is '/'. See public/CNAME and .github/workflows/deploy.yml.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: { port: 3001 },
});
