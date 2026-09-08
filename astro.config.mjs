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
  // 关闭 Astro 开发工具栏（避免干扰页面预览与自动化测试）
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
    server: {
      // 限制 dev server 只允许访问项目目录，防止 FSWatcher 扫到盘符根部的系统锁定文件
      fs: { allow: [process.cwd()] },
      watch: {
        // 兜底：大幅降低 Windows 下 Vite/chokidar 因 lstat 系统锁定文件导致 EBUSY 崩溃的机率。
        // 1) 忽略盘符根目录（如 D:/），避免进入 D:\ 去扫描 pagefile.sys / DumpStack.log.tmp；
        // 2) 忽略系统级锁定文件本身。项目内路径不匹配以上任何规则，保持正常监听。
        ignored: (p) => {
          const n = String(p).replace(/\\/g, '/');
          if (/^[a-zA-Z]:\/$/i.test(n)) return true; // 盘符根目录
          return /DumpStack[^/]*\.tmp|pagefile\.sys|hiberfil\.sys/i.test(n); // 系统锁定文件
        },
      },
    },
  },
});

