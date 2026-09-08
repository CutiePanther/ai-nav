// 分词：中英混合 tokenize
// - 英文/数字/缩写词（GQA、LoRA、vLLM、FlashAttention）用正则完整保留，避免被拆散
// - 中文用 Intl.Segmenter 按词切分（Node 22 内置，零依赖）
// - 过滤停用词

const STOPWORDS = new Set([
  // 中文
  '的', '了', '是', '在', '和', '与', '或', '及', '对', '把', '被', '这', '那', '也', '都', '就',
  '而', '但', '并', '不', '很', '更', '最', '为', '从', '到', '用', '将', '会', '能', '要', '有',
  '我', '你', '他', '它', '我们', '你们', '他们', '一个', '一种', '这个', '那个', '什么', '如何',
  '为什么', '怎么', '哪些', '可以', '需要', '通过', '进行', '以及', '其中', '因为', '所以',
  '一个', '每个', '这个', '这些', '那些', '这样', '那样', '主要', '相关', '本身', '不同',
  // 英文
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'and', 'or', 'of', 'to',
  'in', 'on', 'at', 'for', 'with', 'by', 'as', 'it', 'this', 'that', 'these', 'those', 'do',
  'does', 'did', 'have', 'has', 'had', 'what', 'why', 'how', 'which', 'who', 'when', 'where',
]);

const segmenter = new Intl.Segmenter('zh', { granularity: 'word' });

export function tokenize(text: string): string[] {
  const terms: string[] = [];

  // 英文 / 数字 / 缩写词（保留原样 + 小写版本，兼顾大小写敏感缩写与普通词）
  for (const m of text.matchAll(/[A-Za-z][A-Za-z0-9._+#-]{0,31}/g)) {
    const t = m[0];
    if (t.length > 1 && !STOPWORDS.has(t.toLowerCase())) {
      terms.push(t);
      if (t !== t.toLowerCase()) terms.push(t.toLowerCase());
    }
  }

  // 中文分词
  for (const { segment: s, isWordLike } of segmenter.segment(text)) {
    if (isWordLike && /[\u4e00-\u9fff]/.test(s)) {
      const t = s.trim();
      if (t.length >= 1 && !STOPWORDS.has(t)) terms.push(t);
    }
  }

  return Array.from(new Set(terms));
}
