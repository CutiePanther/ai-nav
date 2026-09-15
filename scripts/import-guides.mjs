// 一次性迁移：把 agentscope/knowledge/*.md 转为本站 guides collection 条目
// 处理：H1 → frontmatter title，正文去掉 H1，补 description / order / category
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'D:/ai/agentscope/knowledge';
const DEST = 'D:/AI/workspace/ai-dev-nav/src/content/guides';

// 文件名 → { slug, title 覆盖, description, tags }
const MAP = {
  '01-quickstart.md': {
    slug: 'agentscope-01-quickstart',
    description: 'AgentScope 2.0 安装与第一个 Agent：相对 1.0 的破坏性重构、最小可运行代码、流式事件消费与三个高频坑。',
    tags: ['AgentScope', '快速开始', 'Agent'],
  },
  '02-model.md': {
    slug: 'agentscope-02-model',
    description: '模型与凭证：DashScope / OpenAI / Ollama 三种接入写法、通用构造参数，以及换供应商时该改哪一处。',
    tags: ['AgentScope', '模型', '凭证'],
  },
  '03-toolkit.md': {
    slug: 'agentscope-03-toolkit',
    description: '工具体系：ToolBase 接口契约、内置工具清单、FunctionTool 把普通函数变工具、自定义子类与 Toolkit 组装。',
    tags: ['AgentScope', '工具', 'Toolkit'],
  },
  '04-mcp-skill.md': {
    slug: 'agentscope-04-mcp-skill',
    description: 'MCP 与技能：接入 MCP 服务的完整写法、工具组（Tool Group）如何收敛工具面、技能（Skill）的封装方式。',
    tags: ['AgentScope', 'MCP', 'Skill'],
  },
  '05-message-event.md': {
    slug: 'agentscope-05-message-event',
    description: '消息与事件：Msg 与 AgentEvent 两套体系的分工、流式事件分发写法，以及多实体对话的组织方式。',
    tags: ['AgentScope', '消息', '事件'],
  },
  '06-context-memory.md': {
    slug: 'agentscope-06-context-memory',
    description: '上下文与记忆：上下文压缩配置、长期记忆的落地选型，Agentic Memory 零依赖方案与 ReMe 自动写回实践。',
    tags: ['AgentScope', '上下文', '长期记忆'],
  },
  '07-rag.md': {
    slug: 'agentscope-07-rag',
    description: 'RAG 全流程：解析 → 切片 → 入库三步、检索与文档管理、metadata_filter 多租户隔离、RAGMiddleware 两种模式与 Rerank。',
    tags: ['AgentScope', 'RAG', '向量检索'],
  },
  '08-middleware-permission.md': {
    slug: 'agentscope-08-middleware-permission',
    description: '中间件与权限：Agent 级与工具级中间件、PermissionMode 权限模式、PermissionDecision 安全契约及人机协同（HITL）。',
    tags: ['AgentScope', '中间件', '权限'],
  },
  '09-deploy.md': {
    slug: 'agentscope-09-deploy',
    description: '服务化部署：从自己的代码起服务、六步标准调用链、调度与渠道对接，以及仓库自带示例和终端调试台。',
    tags: ['AgentScope', '部署', '服务化'],
  },
};

if (!existsSync(DEST)) mkdirSync(DEST, { recursive: true });

const report = [];
let order = 0;

for (const [file, meta] of Object.entries(MAP)) {
  const src = readFileSync(join(SRC, file), 'utf8');
  const lines = src.split('\n');

  // 第 1 行应为 H1
  let title = '';
  let bodyStart = 0;
  if (lines[0]?.startsWith('# ')) {
    title = lines[0].slice(2).trim();
    // 跳过 H1 及其后的空行
    bodyStart = 1;
    while (bodyStart < lines.length && lines[bodyStart].trim() === '') bodyStart++;
  }

  const body = lines.slice(bodyStart).join('\n').trimEnd();
  order += 1;

  const fm = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(meta.description)}`,
    `order: ${order}`,
    `category: AgentScope`,
    `tags: [${meta.tags.map((t) => JSON.stringify(t)).join(', ')}]`,
    `updated: 2026-09-15`,
    '---',
    '',
  ].join('\n');

  const out = join(DEST, `${meta.slug}.md`);
  writeFileSync(out, fm + body + '\n', 'utf8');
  report.push(`${meta.slug}.md  ←  ${file}  (${title}, ${body.length} 字符)`);
}

console.log(report.join('\n'));
console.log(`\n共迁移 ${report.length} 篇 → ${DEST}`);
