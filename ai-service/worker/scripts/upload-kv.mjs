// 生成 KV 批量上传用的 bulk.json：wrangler v4 的 kv bulk put 接受「数组」格式 [ { key, value } ]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(dir, '../data');

const indexRaw = readFileSync(path.join(dataDir, 'index.json'), 'utf-8');
const vecRaw = readFileSync(path.join(dataDir, 'vectors.json'), 'utf-8');

// 每个键传到 KV 后，Worker 用 env.AI_DOCS.get('index.json' / 'vectors.json') 读取
writeFileSync(
  path.join(dataDir, 'bulk.json'),
  JSON.stringify([
    { key: 'index.json', value: indexRaw },
    { key: 'vectors.json', value: vecRaw },
  ])
);

console.log(`bulk.json 已生成（index ${indexRaw.length} B + vectors ${vecRaw.length} B）`);
console.log('用下面命令上传到 KV（wrangler v4: kv bulk，--namespace-id / --remote 指线上）：');
console.log('  npx wrangler kv bulk put data/bulk.json --namespace-id=<id> --remote');