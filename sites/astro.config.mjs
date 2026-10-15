// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Troque pelo domínio real quando houver (usado em canonical e og:url).
  site: 'https://demos.example.com',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
