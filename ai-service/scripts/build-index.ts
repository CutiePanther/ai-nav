// 索引构建脚本：读取主站内容 → 切片 → 分词 → 生成 BM25 倒排索引 + 向量
// 用法：cd ai-service && npm run build:index
// 输出：ai-service/data/index.json（BM25 倒排）+ data/vectors.json（chunk 向量，与 chunks 顺序对齐）

import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvFile } from 'node:process';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { tokenize } from '../src/lib/segment';
import { embedTexts } from '../src/lib/embed';

// 加载 .env（embed 需要 OPENAI_BASE_URL / OPENAI_API_KEY）
try { loadEnvFile(); } catch { /* ignore */ }

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..'); // ai-dev-nav 根目录
const FAQ_DIR = path.join(ROOT, 'src/content/faq');
const ROADMAPS_DIR = path.join(ROOT, 'src/content/roadmaps');
const OUT_DIR = path.resolve(__dirname, '../data');
const OUT_PATH = path.join(OUT_DIR, 'index.json');
const VEC_PATH = path.join(OUT_DIR, 'vectors.json');

interface Chunk {
  id: string;
  type: 'faq' | 'roadmap-stage';
  title: string;
  category: string;
  difficulty?: string;
  text: string;
  url: string;
  textLen: number;
}

function buildFaqChunks(): Chunk[] {
  const files = readdirSync(FAQ_DIR).filter((f) => f.endsWith('.md'));
  const chunks: Chunk[] = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const raw = readFileSync(path.join(FAQ_DIR, file), 'utf-8');
    const { data, content } = matter(raw);

    const title = String(data.title ?? slug);
    const category = String(data.category ?? '未分类');
    const difficulty = data.difficulty ? String(data.difficulty) : undefined;
    // 检索正文 = 标题 + 一句话答案 + 正文（标题带进 text 提升召回）
    const text = `${title}\n${data.answer ? String(data.answer) : ''}\n${content}`.trim();

    chunks.push({
      id: `faq-${slug}`,
      type: 'faq',
      title,
      category,
      difficulty,
      text,
      url: `/faq/${slug}`,
      textLen: text.length,
    });
  }

  return chunks;
}

function buildRoadmapChunks(): Chunk[] {
  const chunks: Chunk[] = [];
  const files = readdirSync(ROADMAPS_DIR).filter((f) => f.endsWith('.yaml'));

  for (const file of files) {
    const slug = file.replace(/\.yaml$/, '');
    const raw = readFileSync(path.join(ROADMAPS_DIR, file), 'utf-8');
    const rm = yaml.load(raw) as {
      title: string;
      stages: Array<{
        name: string;
        desc: string;
        skills?: string[];
        tasks?: string[];
        checkpoint: string;
        project?: string;
      }>;
    };

    for (const stage of rm.stages) {
      const parts = [
        stage.name,
        stage.desc,
        ...(stage.skills ?? []),
        ...(stage.tasks ?? []),
        stage.checkpoint,
        stage.project ?? '',
      ].filter(Boolean);
      const text = `${rm.title} · ${stage.name}\n${parts.join('\n')}`.trim();

      chunks.push({
        id: `roadmap-${slug}-${chunks.filter((c) => c.type === 'roadmap-stage').length + 1}`,
        type: 'roadmap-stage',
        title: `${rm.title} · ${stage.name}`,
        category: '学习路线',
        text,
        url: `/roadmap/${slug}`,
        textLen: text.length,
      });
    }
  }

  return chunks;
}

async function buildVectors(chunks: Chunk[]): Promise<number[][] | null> {
  const texts = chunks.map((c) => c.text);
  const vectors = await embedTexts(texts, false); // doc 端不加 query 前缀
  if (!vectors || vectors.length !== chunks.length) {
    console.warn('[build-index] ⚠️ 向量生成失败或数量不符，vectors.json 不写入，检索将降级为 BM25-only');
    return null;
  }
  return vectors;
}

async function buildIndex() {
  const chunks = [...buildFaqChunks(), ...buildRoadmapChunks()];

  // 分词 + 倒排
  const inverted: Record<string, { c: number; tf: number }[]> = {};
  let totalLen = 0;

  chunks.forEach((chunk, c) => {
    totalLen += chunk.textLen;
    const termCount = new Map<string, number>();
    for (const term of tokenize(chunk.text)) {
      termCount.set(term, (termCount.get(term) ?? 0) + 1);
    }
    for (const [term, tf] of termCount) {
      (inverted[term] ??= []).push({ c, tf });
    }
  });

  const index = {
    version: 1,
    builtAt: Date.now(),
    totalDocs: chunks.length,
    avgLen: totalLen / chunks.length,
    chunks,
    inverted,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(index));

  console.log(`[build-index] 完成：${chunks.length} 个 chunk（faq + roadmap-stage），索引写入 ${OUT_PATH}`);
  console.log(`[build-index] 倒排词条数：${Object.keys(inverted).length}`);

  // 向量生成（走内网 embedding API）
  console.log('[build-index] 开始生成向量（走内网 /v1/embeddings）...');
  const t0 = Date.now();
  const vectors = await buildVectors(chunks);
  if (vectors) {
    writeFileSync(VEC_PATH, JSON.stringify(vectors));
    console.log(`[build-index] 向量完成：${vectors.length} 条 × ${vectors[0].length} 维，写入 ${VEC_PATH}（${((Date.now() - t0) / 1000).toFixed(1)}s）`);
  }
}

buildIndex();
