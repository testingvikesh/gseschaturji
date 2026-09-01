const LANGUAGE_NAMES = {
  gu: 'Gujarati',
  hi: 'Hindi',
  en: 'English',
};

const DEFAULT_OCR_HINTS = ['hi', 'gu', 'en'];
const DEFAULT_TESSERACT_LANG = 'hin+guj+eng';

const WHAT_I_LEARN_COLUMNS = {
  gu: [
    {
      code: '32',
      label: '32 ગુણ',
      key: 'gun',
      meaning: 'Please provide list of Learning Outcomes from this topic',
    },
    {
      code: '64',
      label: '64 કળા',
      key: 'kala',
      meaning: 'Please provide list of Business Innovative and Start-up Ideas from this topic',
    },
    {
      code: '16',
      label: '16 સંસ્કાર',
      key: 'sanskar',
      meaning: 'Please provide list of Lifelong Entertainment and Family Activities from this topic',
    },
  ],
  hi: [
    {
      code: '32',
      label: '32 गुण',
      key: 'gun',
      meaning: 'Please provide list of Learning Outcomes from this topic',
    },
    {
      code: '64',
      label: '64 कला',
      key: 'kala',
      meaning: 'Please provide list of Business Innovative and Start-up Ideas from this topic',
    },
    {
      code: '16',
      label: '16 संस्कार',
      key: 'sanskar',
      meaning: 'Please provide list of Lifelong Entertainment and Family Activities from this topic',
    },
  ],
  en: [
    {
      code: '32',
      label: '32 Gun',
      key: 'gun',
      meaning: 'Please provide list of Learning Outcomes from this topic',
    },
    {
      code: '64',
      label: '64 Kala',
      key: 'kala',
      meaning: 'Please provide list of Business Innovative and Start-up Ideas from this topic',
    },
    {
      code: '16',
      label: '16 Sanskar',
      key: 'sanskar',
      meaning: 'Please provide list of Lifelong Entertainment and Family Activities from this topic',
    },
  ],
};

const HTML_LANGUAGE_CONFIG = {
  gu: {
    code: 'gu',
    htmlLang: 'gu',
    fontUrl:
      'https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;600;700&display=swap',
    fontFamily: '"Noto Sans Gujarati", "Segoe UI", sans-serif',
    knowledgeLadder: 'Knowledge Ladder',
    importanceOfThisTopic: 'Importance of this topic',
    lineToLine: 'Line to Line',
    topic: 'વિષય',
    que: 'પ્રશ્ન',
    sectionTitleField: 'title_gu',
    whatILearnTitle: 'What I Learn',
  },
  hi: {
    code: 'hi',
    htmlLang: 'hi',
    fontUrl:
      'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap',
    fontFamily: '"Noto Sans Devanagari", "Segoe UI", sans-serif',
    knowledgeLadder: 'Knowledge Ladder',
    importanceOfThisTopic: 'Importance of this topic',
    lineToLine: 'Line to Line',
    topic: 'विषय',
    que: 'प्रश्न',
    sectionTitleField: 'title',
    whatILearnTitle: 'What I Learn',
  },
  en: {
    code: 'en',
    htmlLang: 'en',
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    knowledgeLadder: 'Knowledge Ladder',
    importanceOfThisTopic: 'Importance of this topic',
    lineToLine: 'Line to Line',
    topic: 'Topic',
    que: 'Que',
    sectionTitleField: 'title',
    whatILearnTitle: 'What I Learn',
  },
};

function countMatches(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function detectLanguage(text) {
  const sample = String(text || '').slice(0, 30000);
  if (!sample.trim()) return 'en';

  const gu = countMatches(sample, /[\u0A80-\u0AFF]/g);
  const hi = countMatches(sample, /[\u0900-\u097F]/g);
  const en = countMatches(sample, /[A-Za-z]/g);

  const scores = [
    { lang: 'gu', score: gu },
    { lang: 'hi', score: hi },
    { lang: 'en', score: en },
  ].sort((a, b) => b.score - a.score);

  const top = scores[0];
  const second = scores[1];

  if (top.score === 0) return 'en';
  if (top.score >= second.score * 1.15) return top.lang;
  if (hi > gu && hi >= 20) return 'hi';
  if (gu > hi && gu >= 20) return 'gu';
  return top.lang;
}

function detectLanguageFromPdfMetadata(metadata) {
  const raw = String(metadata?.lang || metadata?.language || '').toLowerCase();
  if (!raw) return null;
  if (raw.startsWith('hi') || raw.includes('hindi')) return 'hi';
  if (raw.startsWith('gu') || raw.includes('gujarati')) return 'gu';
  if (raw.startsWith('en') || raw.includes('english')) return 'en';
  return null;
}

function resolveChapterLanguage(chapterJson) {
  const meta = chapterJson?.meta || {};
  const content = chapterJson?.content || {};
  const text =
    content.full_text ||
    (Array.isArray(content.paragraphs) ? content.paragraphs.join('\n\n') : '') ||
    '';

  const fromPdf = detectLanguageFromPdfMetadata(meta.pdf_metadata);
  if (fromPdf) return fromPdf;

  const hi = countMatches(text, /[\u0900-\u097F]/g);
  const gu = countMatches(text, /[\u0A80-\u0AFF]/g);
  const fromText = detectLanguage(text);
  const fromMeta = meta.language ? normalizeLanguageCode(meta.language) : null;

  if (hi >= 15 && hi > gu) return 'hi';
  if (gu >= 15 && gu > hi) return 'gu';

  const textLen = text.replace(/\s+/g, '').length;
  if (textLen > 60) return fromText;

  return fromMeta || fromText || 'en';
}

function normalizeLanguageCode(code) {
  const raw = String(code || '').toLowerCase().trim();
  if (!raw) return 'en';
  if (raw.startsWith('gu')) return 'gu';
  if (raw.startsWith('hi')) return 'hi';
  if (raw.startsWith('en')) return 'en';
  return 'en';
}

function getLanguageName(code) {
  return LANGUAGE_NAMES[normalizeLanguageCode(code)] || LANGUAGE_NAMES.en;
}

function getHtmlLanguageConfig(code) {
  return HTML_LANGUAGE_CONFIG[normalizeLanguageCode(code)] || HTML_LANGUAGE_CONFIG.en;
}

function getWhatILearnColumnDefs(code) {
  const lang = normalizeLanguageCode(code);
  return WHAT_I_LEARN_COLUMNS[lang] || WHAT_I_LEARN_COLUMNS.en;
}

function getSectionTitle(section, langConfig) {
  const field = langConfig.sectionTitleField || 'title';
  return section[field] || section.title || section.title_gu || '';
}

function getWhatILearnRules(language) {
  const lang = normalizeLanguageCode(language);
  const cols = getWhatILearnColumnDefs(lang);
  const langName = getLanguageName(lang);

  const columnLines = cols
    .map(
      (c) =>
        `  📌 ${c.label} (${c.key}) — ${c.meaning}\n     Write exactly 5 points in ${langName} answering that question for THIS section.`
    )
    .join('\n');

  const jsonColumns = cols
    .map(
      (c) =>
        `      { "code": "${c.code}", "label": "${c.label}", "key": "${c.key}", "meaning": "${c.meaning}", "points": ["point1", ...5] }`
    )
    .join(',\n');

  return `
WHAT I LEARN — 3 columns (exactly 5 points each), ALL text in ${langName}:

Meanings (mandatory — answer these prompts for THIS topic only):
  📌 32 Gun   = Please provide list of Learning Outcomes from this topic
  📌 64 Kala  = Please provide list of Business Innovative and Start-up Ideas from this topic
  📌 16 Sanskar = Please provide list of Lifelong Entertainment and Family Activities from this topic

${columnLines}

JSON structure:
  "what_i_learn": {
    "title": "What I Learn",
    "columns": [
${jsonColumns}
    ],
    "gun": ["same 5 as column 32"],
    "kala": ["same 5 as column 64"],
    "sanskar": ["same 5 as column 16"]
  }

Rules:
- Each column MUST have exactly 5 points in ${langName}.
- 32 = Learning Outcomes from THIS topic.
- 64 = Business Innovative and Start-up Ideas from THIS topic.
- 16 = Lifelong Entertainment and Family Activities from THIS topic.
- gun/kala/sanskar arrays must match their column points exactly.
- Do NOT use Gujarati if language is Hindi. Do NOT use Hindi if language is Gujarati.
`;
}

function buildSectionContentSchema(language) {
  const lang = normalizeLanguageCode(language);
  const langName = getLanguageName(lang);
  const cols = getWhatILearnColumnDefs(lang);
  const colJson = cols
    .map(
      (c) =>
        `      { "code": "${c.code}", "label": "${c.label}", "key": "${c.key}", "points": ["5 ${langName} points"] }`
    )
    .join(',\n');

  if (lang === 'gu') {
    return `Return JSON for section content ONLY — NO knowledge_ladder, NO practice_examination.
Order: introduction → trailer → importance_of_this_topic → what_i_like → what_i_learn → one_word
Language: ${langName} ONLY

{
  "id": "slug",
  "title": "English",
  "title_gu": "${langName} section title",
  "order": number,
  "introduction": { "summary": "💡 one-line ${langName} summary" },
  "trailer": { "points": ["5 points"] },
  "importance_of_this_topic": {
    "title": "Importance of this topic",
    "points": ["5-7 points why this topic matters"]
  },
  "what_i_like": { "points": ["5-7 points"] },
  "what_i_learn": {
    "title": "What I Learn",
    "columns": [
${colJson}
    ],
    "gun": ["same 5 as column 32"],
    "kala": ["same 5 as column 64"],
    "sanskar": ["same 5 as column 16"]
  },
  "one_word": { "total_questions": number, "items": [{ "question": "...", "options": ["opt A", "opt B", "opt C", "opt D"], "answer": "opt A" }] }
}`;
  }

  return `Return JSON for section content ONLY — NO knowledge_ladder, NO practice_examination.
Order: introduction → trailer → importance_of_this_topic → what_i_like → what_i_learn → one_word
Language: ${langName} ONLY — every string field in ${langName}

{
  "id": "slug",
  "title": "${langName} section title",
  "order": number,
  "introduction": { "summary": "💡 one-line ${langName} summary" },
  "trailer": { "points": ["5 points in ${langName}"] },
  "importance_of_this_topic": {
    "title": "Importance of this topic",
    "points": ["5-7 points why this topic matters"]
  },
  "what_i_like": { "points": ["5-7 points in ${langName}"] },
  "what_i_learn": {
    "title": "What I Learn",
    "columns": [
${colJson}
    ],
    "gun": ["same 5 as column 32"],
    "kala": ["same 5 as column 64"],
    "sanskar": ["same 5 as column 16"]
  },
  "one_word": { "total_questions": number, "items": [{ "question": "...", "options": ["opt A", "opt B", "opt C", "opt D"], "answer": "opt A" }] }
}`;
}

function contentLanguageInstruction(language) {
  const lang = normalizeLanguageCode(language);
  const name = getLanguageName(lang);
  if (lang === 'hi') {
    return `CRITICAL: ALL content MUST be in Hindi using Devanagari script only. Never output Gujarati script or English (except proper nouns).`;
  }
  if (lang === 'en') {
    return `CRITICAL: ALL content MUST be in English only. Never output Gujarati or Hindi.`;
  }
  return `CRITICAL: ALL content MUST be in Gujarati script only. Never output Devanagari/Hindi or English (except proper nouns).`;
}

function getDefaultOcrHints() {
  return DEFAULT_OCR_HINTS;
}

function getDefaultTesseractLang() {
  return DEFAULT_TESSERACT_LANG;
}

module.exports = {
  detectLanguage,
  detectLanguageFromPdfMetadata,
  resolveChapterLanguage,
  normalizeLanguageCode,
  getLanguageName,
  getHtmlLanguageConfig,
  getSectionTitle,
  getWhatILearnColumnDefs,
  getWhatILearnRules,
  buildSectionContentSchema,
  contentLanguageInstruction,
  getDefaultOcrHints,
  getDefaultTesseractLang,
  LANGUAGE_NAMES,
};
