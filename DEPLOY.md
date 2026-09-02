# 部署指南

站点是纯静态产物（`astro build` 输出到 `dist/`），可部署到任意静态托管平台。

## ⚠️ 上线前必做：改域名

两个文件的域名目前是占位符 `ai-dev-nav.example.com`，上线前必须改成真实域名：

1. `astro.config.mjs` 的 `site` 字段
2. `scripts/gen-sitemap.mjs` 的 `SITE` 常量

改完后重新 `npm run build`，sitemap 和 canonical 才会指向正确域名。

---

## 方案 A：Vercel（推荐，最省事）

1. 把项目推送到 GitHub 仓库。
2. 打开 [vercel.com](https://vercel.com)，用 GitHub 账号登录。
3. **Add New Project** → 导入该仓库。
4. Vercel 会自动识别 Astro 项目，构建命令 `npm run build`、输出目录 `dist`（默认正确，无需改）。
5. 点击 Deploy，完成后获得 `xxx.vercel.app` 子域名。

**特点**：push 到 main 分支即自动构建部署；`prebuild` 的 RSS 抓取会随构建自动运行，资讯自动更新。

---

## 方案 B：Cloudflare Pages

1. 推送 GitHub 仓库。
2. 打开 [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → Connect to Git。
3. 构建配置：框架预设选 **Astro**，构建命令 `npm run build`，输出目录 `dist`。
4. 部署，获得 `xxx.pages.dev` 子域名。

---

## 方案 C：GitHub Pages（纯静态）

> 注意：GitHub Pages 不会跑 `prebuild` 的 RSS 抓取，需本地构建后推送 `dist`，或用 GitHub Actions。

用 GitHub Actions 自动构建（推荐）：

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

然后在仓库 Settings → Pages → Source 选 **GitHub Actions**。

---

## 方案 D：国内平台（腾讯云 COS / 阿里云 OSS）

1. 本地 `npm run build` 得到 `dist/`。
2. 将 `dist/` 内容上传到对象存储桶，开启静态网站托管。
3. 绑定已备案的自定义域名。

> 国内平台需实名 + 域名备案，流程较长，适合正式长期运营。

---

## 自定义域名（可选）

在平台绑定自定义域名后，到 DNS 服务商添加 CNAME 记录指向平台分配的域名即可。同时记得更新 `astro.config.mjs` 和 `gen-sitemap.mjs` 的域名为你的真实域名。
