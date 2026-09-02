// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // TODO: 上线前改成真实域名（同步改 scripts/gen-sitemap.mjs 的 SITE）
  site: 'https://ai-dev-nav.example.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
