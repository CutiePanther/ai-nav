// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

// https://astro.build/config
// 站点域名：上线时在部署平台配置 SITE_URL 环境变量即可，无需改代码
// 未配置时回退到占位域名（仅供本地/预览，勿用于生产）
const SITE_URL = process.env.SITE_URL || 'https://ai-dev-nav.example.com';

export default defineConfig({
  site: SITE_URL,
  integrations: [icon()],
  vite: {
    plugins: [tailwindcss()],
  },
});
