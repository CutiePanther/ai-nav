// 生成 KV 批量上传用的 bulk.json：{ "index.json": <字符串>, "vectors.json": <字符串> }
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(dir, '../data');

const indexRaw = readFileSync(path.join(dataDir, 'index.json'), 'utf-8');
const vecRaw = readFileSync(path.join(dataDir, 'vectors.json'), 'utf-8');

writeFileSync(
  path.join(dataDir, 'bulk.json'),
  JSON.stringify({ 'index.json': indexRaw, 'vectors.json': vecRaw })
);

console.log(`bulk.json 已生成（index ${indexRaw.length} B + vectors ${vecRaw.length} B）`);
console.log('用下面命令上传到 KV：');
console.log('  npx wrangler kv:bulk put --binding=AI_DOCS --namespace-id=<id> data/bulk.json');