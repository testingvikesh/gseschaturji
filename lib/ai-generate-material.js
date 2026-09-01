const {
  MATERIAL_TYPES,
  KNOWLEDGE_LADDER_RULES,
  LINE_TO_LINE_RULES,
  SECTION_BLOCK_ORDER,
  SECTION_CONTENT_RULES,
  ONE_WORD_RULES,
  DESCRIPTIVE_ANSWER_RULES,
  TRUE_FALSE_RULES,
  MATCH_REFERENCE_EXAMPLE,
  EXAM_STRUCTURE_RULES,
  DESCRIPTIVE_QUESTION_COUNTS,
  buildChapterAssessment,
  normalizeSection,
} = require('./material-format-spec');
const { callOpenAIChat, sleep } = require('./openai-client');
const {
  getLanguageName,
  normalizeLanguageCode,
  resolveChapterLanguage,
  getWhatILearnRules,
  buildSectionContentSchema,
  contentLanguageInstruction,
} = require('./language');
const {
  normalizeKnowledgeLadder,
  validateKnowledgeLadderChain,
  KNOWLEDGE_LADDER_COUNT,
} = require('./normalize-knowledge-ladder');
const {
  normalizeLineToLine,
  validateLineToLineChain,
} = require('./normalize-line-to-line');
const { splitParagraphs } = require('./utils');
const { parseAiJson, isJsonParseError } = require('./parse-ai-json');

const PLAN_SCHEMA = `Return JSON:
{
  "sections": [
    {
      "id": "slug",
      "title": "English",
      "title_gu": "Gujarati",
      "order": 1,
      "focus": "exact topic/paragraphs this section covers",
      "paragraph_start": 1,
      "paragraph_end": 5
    }
  ]
}`;

const DEFAULT_MAX_SECTIONS = 1;

function getSectionPlanningRules(maxSections, language = 'gu') {
  const lang = normalizeLanguageCode(language);
  const langName = getLanguageName(lang);
  const fullChapterTitle =
    lang === 'hi' ? 'पूरा पाठ' : lang === 'en' ? 'Full Chapter' : 'સંપૂર્ણ પાઠ';

  if (maxSections === 1) {
    return `
SECTION PLANNING — exactly 1 section:
- Read the ENTIRE ${langName} chapter and create ONE complete material section covering the full chapter.
- Return exactly 1 section in the sections array.
- Section title MUST be in ${langName} (use "title" field${lang === 'gu' ? ' and title_gu' : ''}).
- title / title_gu: full chapter title or "${fullChapterTitle}"
- focus: entire chapter — introduction, story, and language parts combined.`;
  }

  if (!maxSections || maxSections <= 0) {
    return `
SECTION PLANNING — topic-wise (no maximum limit):
- Read the ENTIRE chapter and split into ALL logical topics/parts.
- Create one section per distinct topic (introduction, story parts, language section, etc.).
- Assign order 1, 2, 3... sequentially.
- For each section set paragraph_start and paragraph_end (1-based indices into chapter paragraphs).
- paragraph_start/paragraph_end must cover the full chapter without gaps or overlap.
- Each topic focus must describe exactly which paragraphs it covers.`;
  }

  return `
SECTION PLANNING — maximum ${maxSections} sections:
- Read the ENTIRE chapter and split into at most ${maxSections} logical material sections.
- NEVER return more than ${maxSections} sections.
- Merge related parts if needed — for ${maxSections} sections use this split:
  1. Introduction / author / પ્રસ્તાવના અને લેખક પરિચય
  2. Main subject introduction (e.g. બોડી ગાયનું વર્ણન)
  3. Story part 1 / character & nature
  4. Story part 2 / events & habits
  5. Story part 3 / loyalty & support
  6. Story part 4 / conclusion & memory
  7. Language skills / ભાષાસજ્જતા / writing exercises
  (Adjust titles to match chapter — use all ${maxSections} slots)
- Each section must still be complete with all material blocks.
- Assign order 1 to ${maxSections} sequentially.
- Each section focus must describe which part of the chapter it covers.`;
}

const PRACTICE_EXAM_SCHEMA = `Return JSON for practice_examination ONLY.
CRITICAL: Every question MUST be an object with numeric "id" and string "question". NEVER use plain strings in questions arrays.

MUST include ALL objective types: one_word (section-level OK), mcq, fill_blanks, true_false, match (Jodka Jodo / જોડકા જોડો).
MUST include ALL subjective types: one_mark, two_marks, three_marks, four_marks, five_marks.

{
  "practice_examination": {
    "title": "chapter - section title_gu",
    "total_questions": number,
    "parts": {
      "objective": {
        "title": "Objective",
        "mcq": {
          "marks_per_question": 1,
          "total": number,
          "questions": [
            { "id": 1, "question": "Gujarati question?", "options": ["opt A", "opt B", "opt C", "opt D"], "answer": "opt A" }
          ]
        },
        "fill_blanks": {
          "marks_per_question": 1,
          "total": number,
          "questions": [
            { "id": 1, "question": "શબ્દ ___________ અહીં.", "options": ["opt A", "opt B", "opt C", "opt D"], "answer": "opt B" }
          ]
        },
        "true_false": {
          "marks_per_question": 1,
          "total": number,
          "questions": [
            { "id": 1, "question": "Statement in Gujarati.", "answer": true }
          ]
        },
        "match": {
          "title": "જોડકા જોડો",
          "marks_per_question": 2,
          "total": 1,
          "questions": [{
            "id": 1,
            "question": "નીચેના પદોને સાચી જોડીમાં મેળવો.",
            "column_a": ["A. બોડી", "B. લેખક"],
            "column_b": ["1. ગાય", "2. ચંદ્રકાંત પંડ્યા"],
            "answer": "A-1, B-2"
          }]
        }
      },
      "subjective": {
        "title": "Subjective",
        "one_mark": {
          "marks_per_question": 1,
          "total": ${DESCRIPTIVE_QUESTION_COUNTS.one_mark},
          "questions": [{ "id": 1, "question": "...", "answer": ["exactly 1 point line"] }]
        },
        "two_marks": {
          "marks_per_question": 2,
          "total": ${DESCRIPTIVE_QUESTION_COUNTS.two_marks},
          "questions": [{ "id": 1, "question": "...", "answer": ["point 1", "point 2"] }]
        },
        "three_marks": {
          "marks_per_question": 3,
          "total": ${DESCRIPTIVE_QUESTION_COUNTS.three_marks},
          "questions": [{ "id": 1, "question": "...", "answer": ["p1", "p2", "p3"] }]
        },
        "four_marks": {
          "marks_per_question": 4,
          "total": ${DESCRIPTIVE_QUESTION_COUNTS.four_marks},
          "questions": [{ "id": 1, "question": "...", "answer": ["p1", "p2", "p3", "p4"] }]
        },
        "five_marks": {
          "marks_per_question": 5,
          "total": ${DESCRIPTIVE_QUESTION_COUNTS.five_marks},
          "questions": [{ "id": 1, "question": "...", "answer": ["p1", "p2", "p3", "p4", "p5"] }]
        }
      }
    }
  }
}

${EXAM_STRUCTURE_RULES}

RULES:
- PART I OBJECTIVE: one_word + mcq + fill_blanks + true_false + match (Jodka Jodo)
- PART II SUBJECTIVE: 1, 2, 3, 4, 5 mark questions — answer MUST be array with exact line count

${DESCRIPTIVE_ANSWER_RULES}
${TRUE_FALSE_RULES}
${MATCH_REFERENCE_EXAMPLE}`;


const KNOWLEDGE_LADDER_SCHEMA = `Return JSON ONLY:
{
  "knowledge_ladder": {
    "columns": ["Question", "Answer", "Next Linked Question"],
    "total_questions": ${KNOWLEDGE_LADDER_COUNT},
    "items": [
      { "id": 1, "question": "...", "answer": "...", "next_linked_question": "..." }
    ]
  }
}`;

const LINE_TO_LINE_SCHEMA = `Return JSON ONLY:
{
  "line_to_line": {
    "title": "Line to Line",
    "columns": ["Question", "Answer", "Next Linked Question"],
    "total_questions": number,
    "items": [
      { "id": 1, "question": "...", "answer": "...", "next_linked_question": "..." }
    ]
  }
}`;

const TEXTBOOK_SCHEMA = `Return JSON:
{
  "textbook_exercises": {
    "title": "પાઠયપુસ્તક પ્રવૃત્તિઓ",
    "sections": [
      {
        "id": 1,
        "title": "વાતચીત",
        "type": "conversation",
        "questions": [{ "id": 1, "question": "...", "answer": "..." }]
      },
      {
        "id": 2,
        "title": "પાઠના આધારે સાચા વિકલ્પ સામે ✓ કરો",
        "type": "true_choice",
        "questions": [{ "id": 1, "question": "...", "options": { "A": "...", "B": "...", "C": "..." }, "answer": "B" }]
      },
      {
        "id": 3,
        "title": "વિગત વાંચો અને લેખકે આવું શા માટે કહ્યું હશે?",
        "type": "comprehension",
        "questions": [{ "id": 1, "passage": "...", "answer": "..." }]
      }
    ]
  }
}`;

function getChapterText(chapterJson) {
  const content = chapterJson.content || {};
  return content.full_text || content.paragraphs?.join('\n\n') || '';
}

function getChapterParagraphs(chapterJson) {
  const content = chapterJson.content || {};
  if (Array.isArray(content.paragraphs) && content.paragraphs.length) {
    return content.paragraphs;
  }
  return splitParagraphs(getChapterText(chapterJson));
}

function extractTopicText(chapterJson, plan) {
  const paragraphs = getChapterParagraphs(chapterJson);
  const fullText = getChapterText(chapterJson);
  const total = paragraphs.length;

  if (total && plan.paragraph_start) {
    const start = Math.max(1, Number(plan.paragraph_start) || 1);
    const end = Math.min(total, Number(plan.paragraph_end) || start);
    const slice = paragraphs.slice(start - 1, end);
    if (slice.length) {
      return slice.join('\n\n').slice(0, 16000);
    }
  }

  return fullText.slice(0, 16000);
}

function buildMaterialPrompt(chapterJson) {
  const meta = chapterJson.meta || {};
  const text = getChapterText(chapterJson);
  if (!text || text.replace(/\s+/g, '').length < 30) {
    throw new Error('Chapter has no readable text. OCR may have failed — check the PDF.');
  }
  const language = resolveChapterLanguage(chapterJson);
  return {
    meta: { ...meta, language },
    text,
    title: meta.title || 'Chapter',
    language,
  };
}

async function callOpenAI(config, prompt, options = {}) {
  const maxTokens = options.maxTokens ?? 16000;
  const temperature = options.temperature ?? 0.35;
  const language = normalizeLanguageCode(options.language || 'en');
  const langName = getLanguageName(language);
  return callOpenAIChat(
    config,
    {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: `You output only valid JSON. No markdown fences. Expert in ${langName} educational content matching Material PDF format.`,
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature,
      max_tokens: maxTokens,
    },
    options
  );
}

/**
 * Call OpenAI and parse JSON. On malformed JSON, repair then re-request up to maxParseRetries.
 */
async function callOpenAIJson(config, prompt, options = {}) {
  const maxParseRetries = options.maxParseRetries ?? 3;
  let lastError;
  let currentPrompt = prompt;

  for (let attempt = 1; attempt <= maxParseRetries; attempt++) {
    const raw = await callOpenAI(config, currentPrompt, options);
    try {
      return parseAiJson(raw);
    } catch (err) {
      lastError = err;
      if (!isJsonParseError(err) || attempt >= maxParseRetries) {
        throw err;
      }
      process.stderr.write(
        `AI JSON parse failed (${attempt}/${maxParseRetries}): ${err.message}. Re-requesting...\n`
      );
      currentPrompt =
        `${prompt}\n\nCRITICAL FIX: Your previous reply was INVALID JSON (${err.message}). ` +
        `Return ONLY one complete valid JSON object. Escape all quotes inside strings. ` +
        `Do not truncate. No markdown. No trailing commas.`;
      if (options.delayMs > 0) await sleep(options.delayMs);
      else await sleep(800);
    }
  }

  throw lastError || new Error('AI JSON parse failed');
}

async function planSections(config, title, slug, text, maxSections = DEFAULT_MAX_SECTIONS, language = 'gu', paragraphCount = 0) {
  const limit = maxSections > 0 ? maxSections : 0;
  const langName = getLanguageName(language);
  const paragraphHint =
    paragraphCount > 0
      ? `\nChapter has ${paragraphCount} paragraphs — set paragraph_start/paragraph_end (1 to ${paragraphCount}) for each topic.\n`
      : '';
  const prompt = `Analyze this ${langName} chapter and plan material sections like a Material PDF.

Chapter: ${title}
Slug: ${slug}
Language: ${langName}
${contentLanguageInstruction(language)}
${paragraphHint}
${getSectionPlanningRules(limit, language)}

CHAPTER TEXT (full):
${text.slice(0, 28000)}

${PLAN_SCHEMA}`;

  process.stderr.write(
    limit > 0 ? `AI planning up to ${limit} sections (${langName})...\n` : `AI planning all sections (${langName})...\n`
  );
  const parsed = await callOpenAIJson(config, prompt, { language });
  let sections = parsed.sections || parsed;
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new Error('AI did not return section plan');
  }

  sections = sections
    .map((s, i) => ({
      ...s,
      order: s.order || i + 1,
      id: s.id || `section-${i + 1}`,
    }))
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({ ...s, order: i + 1 }));

  if (limit > 0 && sections.length > limit) {
    process.stderr.write(`Trimming ${sections.length} sections to max ${limit}\n`);
    sections = sections.slice(0, limit);
  }

  process.stderr.write(`Planned ${sections.length} section(s)\n`);
  return sections;
}

async function generateKnowledgeLadder(config, title, plan, sectionText, language = 'gu', retryHint = '') {
  const focus = plan.focus || plan.title_gu || plan.title;
  const langName = getLanguageName(language);

  const prompt = `Create Knowledge Ladder ONLY for this ${langName} material section.

Chapter: ${title}
Section: ${plan.title_gu || plan.title}
Focus: ${focus}
${retryHint}

${contentLanguageInstruction(language)}

${KNOWLEDGE_LADDER_RULES}

Read chapter text. Create EXACTLY ${KNOWLEDGE_LADDER_COUNT} questions.
CRITICAL: Every Q(n) for n>1 MUST include A(n-1) in the question text — verify before returning.

CHAPTER TEXT:
${sectionText}

${KNOWLEDGE_LADDER_SCHEMA}`;

  const parsed = await callOpenAIJson(config, prompt, {
    maxTokens: 6000,
    temperature: 0.25,
    language,
  });
  return normalizeKnowledgeLadder(parsed.knowledge_ladder || parsed);
}

async function generateLineToLine(config, title, plan, sectionText, language = 'gu', retryHint = '') {
  const focus = plan.focus || plan.title_gu || plan.title;
  const langName = getLanguageName(language);

  const prompt = `Create Line to Line chained Q&A ONLY for this ${langName} material section.
Cover the FULL topic line-wise: each answer starts the next question.
Do NOT use a fixed min/max count — generate as many pairs as this topic needs.

Chapter: ${title}
Section: ${plan.title_gu || plan.title}
Focus: ${focus}
${retryHint}

${contentLanguageInstruction(language)}

${LINE_TO_LINE_RULES}

Read the FULL section text. Generate Q&A pairs for the ENTIRE topic (count = whatever the topic requires).
CRITICAL chain rule:
- Q1 → A1
- Q2 must START WITH or contain A1
- A2 → Q3 must START WITH or contain A2
- Continue until the full topic is covered — do not stop early, do not pad with filler.

Do NOT duplicate Knowledge Ladder questions if possible — go deeper / cover more of the topic in order.

CHAPTER TEXT:
${sectionText}

${LINE_TO_LINE_SCHEMA}`;

  const parsed = await callOpenAIJson(config, prompt, {
    maxTokens: 10000,
    temperature: 0.25,
    language,
  });
  return normalizeLineToLine(parsed.line_to_line || parsed);
}

function sectionHasLineToLine(section) {
  return (section?.line_to_line?.items || []).length > 0;
}

async function generateSection(config, title, slug, text, plan, totalSections, language = 'gu', chapterJson = null) {
  const sectionText = chapterJson ? extractTopicText(chapterJson, plan) : text.slice(0, 16000);
  const delayMs = Number(config.request_delay_ms ?? 0);
  // Never generate all blocks in one AI call — models truncate and drop
  // knowledge_ladder / what_i_like / one_word / practice_examination.
  const fast = config.fast_mode === true;
  return generateSectionPhased(
    config,
    title,
    plan,
    totalSections,
    language,
    sectionText,
    delayMs,
    fast
  );
}

function sectionHasLadder(section) {
  return (section?.knowledge_ladder?.items || []).length >= 5;
}

function sectionHasExam(section) {
  const pe = section?.practice_examination;
  if (!pe) return false;
  const parts = pe.parts || {};
  const obj = parts.objective || {};
  const sub = parts.subjective || {};
  const sections = pe.sections || {};
  const hasObj =
    (obj.mcq?.questions || sections.mcq?.questions || []).length > 0 ||
    (obj.fill_blanks?.questions || sections.fill_blanks?.questions || []).length > 0;
  const hasSub =
    (sub.one_mark?.questions || sections.descriptive?.one_mark?.questions || []).length > 0 ||
    (sub.two_marks?.questions || sections.descriptive?.two_marks?.questions || []).length > 0;
  return hasObj && hasSub;
}

function sectionMissingCore(section) {
  const missing = [];
  if (!section?.introduction?.summary) missing.push('introduction');
  if (!(section?.trailer?.points || []).length) missing.push('trailer');
  if (!(section?.importance_of_this_topic?.points || []).length) {
    missing.push('importance_of_this_topic');
  }
  if (!(section?.what_i_like?.points || []).length) missing.push('what_i_like');
  if (!section?.what_i_learn) missing.push('what_i_learn');
  if (!(section?.one_word?.items || []).length) missing.push('one_word');
  return missing;
}

async function generateSectionContent(config, title, plan, totalSections, language, sectionText, fast) {
  const focus = plan.focus || plan.title_gu || plan.title;
  const langName = getLanguageName(language);
  const oneWordCount = fast ? 6 : 8;

  const contentPrompt = `Create section content JSON for Material PDF layout.
You MUST return ALL of these keys — do not skip any:
- introduction { summary }
- trailer { points: exactly 5 }
- importance_of_this_topic { title, points: 5-7 why THIS topic matters }
- what_i_like { points: 5-7 }
- what_i_learn (32 ગુણ = Learning Outcomes | 64 કળા = Business Innovative & Start-up Ideas | 16 સંસ્કાર = Lifelong Entertainment & Family Activities — 5 points each)
- one_word ({ items: ${oneWordCount}+ questions with options[4] + answer })

Chapter: ${title}
Section ${plan.order}/${totalSections}: ${plan.title_gu || plan.title}
Section id: ${plan.id}
Focus ONLY on: ${focus}
Language: ${langName}

${SECTION_BLOCK_ORDER}
${SECTION_CONTENT_RULES}
${ONE_WORD_RULES}
${getWhatILearnRules(language)}

${contentLanguageInstruction(language)}
knowledge_ladder, line_to_line and practice_examination are generated separately — do NOT include them.
Do NOT repeat questions that will appear in knowledge_ladder.

CHAPTER TEXT:
${sectionText.slice(0, fast ? 10000 : 14000)}

${buildSectionContentSchema(language)}`;

  process.stderr.write(`AI section ${plan.order} content: ${plan.title_gu || plan.title}...\n`);
  return callOpenAIJson(config, contentPrompt, {
    maxTokens: 7000,
    language,
  });
}

function examCounts(fast, compact = false) {
  if (compact) {
    return {
      one_mark: 3,
      two_marks: 2,
      three_marks: 2,
      four_marks: 1,
      five_marks: 1,
      mcq: '5',
      fill: '4',
      tf: '4',
      ow: '5',
    };
  }
  if (fast) {
    return {
      one_mark: 3,
      two_marks: 2,
      three_marks: 2,
      four_marks: 1,
      five_marks: 1,
      mcq: '5',
      fill: '4',
      tf: '4',
      ow: '6',
    };
  }
  return {
    one_mark: DESCRIPTIVE_QUESTION_COUNTS.one_mark,
    two_marks: DESCRIPTIVE_QUESTION_COUNTS.two_marks,
    three_marks: DESCRIPTIVE_QUESTION_COUNTS.three_marks,
    four_marks: DESCRIPTIVE_QUESTION_COUNTS.four_marks,
    five_marks: DESCRIPTIVE_QUESTION_COUNTS.five_marks,
    mcq: '6-10',
    fill: '4-8',
    tf: 'minimum 6',
    ow: 'minimum 8',
  };
}

function buildExamPrompt(title, plan, language, sectionText, counts, partMode = 'all') {
  const focus = plan.focus || plan.title_gu || plan.title;
  const langName = getLanguageName(language);
  const textSlice = sectionText.slice(0, 12000);

  const objectiveBlock = `PART I — OBJECTIVE (all required):
- one_word — ${counts.ow} questions, EXACTLY 4 options each
- mcq — ${counts.mcq} questions, EXACTLY 4 options each
- fill_blanks — ${counts.fill} questions, EXACTLY 4 options each
- true_false — ${counts.tf} statements (answer true/false)
- match — Jodka Jodo / જોડકા જોડો (1 block, Left A/B Right 1/2)`;

  const subjectiveBlock = `PART II — SUBJECTIVE (all required):
- one_mark — EXACTLY ${counts.one_mark} questions, answer array with 1 line
- two_marks — EXACTLY ${counts.two_marks} questions, answer array with 2 lines
- three_marks — EXACTLY ${counts.three_marks} questions, answer array with 3 lines
- four_marks — EXACTLY ${counts.four_marks} questions, answer array with 4 lines
- five_marks — EXACTLY ${counts.five_marks} questions, answer array with 5 lines`;

  let partsInstruction = `${objectiveBlock}\n\n${subjectiveBlock}`;
  let schemaNote = PRACTICE_EXAM_SCHEMA;
  if (partMode === 'objective') {
    partsInstruction = `${objectiveBlock}\n\nReturn practice_examination with parts.objective ONLY (parts.subjective may be {}).`;
  } else if (partMode === 'subjective') {
    partsInstruction = `${subjectiveBlock}\n\nReturn practice_examination with parts.subjective ONLY (parts.objective may be {}).`;
  }

  return `Create practice_examination JSON ONLY for this ${langName} material section.
You MUST include EVERY type requested below — do not omit any.
Keep answers SHORT so JSON stays complete and valid.

Chapter: ${title}
Section: ${plan.title_gu || plan.title}
Focus: ${focus}
Practice exam title: "${title} - ${plan.title_gu || plan.title}"

${contentLanguageInstruction(language)}

${partsInstruction}

Set total_questions to sum of included questions.
CRITICAL: Never invent placeholder answers (point 1 / પોઈન્ટ 1 / કારણ 1).
If you cannot write a real answer from the chapter, OMIT that question completely.
CRITICAL JSON: valid complete JSON only — escape quotes inside strings, no trailing commas, do not truncate.

CHAPTER TEXT:
${textSlice}

${schemaNote}`;
}

function mergeExamParts(objectiveExam, subjectiveExam, title, plan) {
  const obj = objectiveExam?.parts?.objective || objectiveExam?.objective || {};
  const sub = subjectiveExam?.parts?.subjective || subjectiveExam?.subjective || {};
  const oneWord = objectiveExam?.one_word || obj.one_word || null;
  const exam = {
    title: `${title} - ${plan.title_gu || plan.title}`,
    total_questions: 0,
    parts: {
      objective: obj,
      subjective: sub,
    },
  };
  if (oneWord) exam.one_word = oneWord;

  const countQs = (block) => {
    if (!block || typeof block !== 'object') return 0;
    let n = 0;
    for (const val of Object.values(block)) {
      if (Array.isArray(val?.questions)) n += val.questions.length;
      else if (Array.isArray(val?.items)) n += val.items.length;
    }
    return n;
  };
  exam.total_questions = countQs(obj) + countQs(sub) + (Array.isArray(oneWord?.items) ? oneWord.items.length : 0);
  return exam;
}

async function generateSectionExam(config, title, plan, language, sectionText, fast) {
  const counts = examCounts(fast, false);

  process.stderr.write(`AI section ${plan.order} practice exam...\n`);
  try {
    const examParsed = await callOpenAIJson(
      config,
      buildExamPrompt(title, plan, language, sectionText, counts, 'all'),
      { maxTokens: 14000, language, maxParseRetries: 3, temperature: 0.3 }
    );
    return examParsed.practice_examination || examParsed;
  } catch (err) {
    if (!isJsonParseError(err)) throw err;
    process.stderr.write(
      `Practice exam JSON failed — splitting into objective + subjective (${err.message})...\n`
    );
  }

  // Fallback: generate objective and subjective separately (avoids truncation), then merge
  const compact = examCounts(true, true);
  const objectiveParsed = await callOpenAIJson(
    config,
    buildExamPrompt(title, plan, language, sectionText, compact, 'objective'),
    { maxTokens: 8000, language, maxParseRetries: 3, temperature: 0.3 }
  );
  await sleep(600);
  const subjectiveParsed = await callOpenAIJson(
    config,
    buildExamPrompt(title, plan, language, sectionText, compact, 'subjective'),
    { maxTokens: 8000, language, maxParseRetries: 3, temperature: 0.3 }
  );

  const objectiveExam = objectiveParsed.practice_examination || objectiveParsed;
  const subjectiveExam = subjectiveParsed.practice_examination || subjectiveParsed;
  return mergeExamParts(objectiveExam, subjectiveExam, title, plan);
}

async function generateSectionPhased(
  config,
  title,
  plan,
  totalSections,
  language,
  sectionText,
  delayMs,
  fast
) {
  let section = await generateSectionContent(
    config,
    title,
    plan,
    totalSections,
    language,
    sectionText,
    fast
  );

  const missingCore = sectionMissingCore(section);
  if (missingCore.length) {
    process.stderr.write(
      `Section ${plan.order} missing [${missingCore.join(', ')}] — regenerating content...\n`
    );
    if (delayMs > 0) await sleep(delayMs);
    const retry = await generateSectionContent(
      config,
      title,
      plan,
      totalSections,
      language,
      sectionText,
      fast
    );
    for (const key of missingCore) {
      if (retry[key]) section[key] = retry[key];
    }
  }

  if (delayMs > 0) await sleep(delayMs);

  process.stderr.write(`AI section ${plan.order} knowledge ladder (strict chain)...\n`);
  let knowledgeLadder = await generateKnowledgeLadder(config, title, plan, sectionText, language);
  let chainCheck = validateKnowledgeLadderChain(knowledgeLadder.items || []);

  const skipRetry = config.skip_ladder_retry === true || fast;
  if (!skipRetry && !chainCheck.valid && chainCheck.brokenAt.length) {
    const fixHint = chainCheck.brokenAt
      .map((qNum) => {
        const idx = qNum - 1;
        const prev = knowledgeLadder.items[idx - 1];
        return `Q${qNum} must include previous answer "${prev?.answer}" but does not. Rewrite Q${qNum} to start with or contain "${prev?.answer}".`;
      })
      .join('\n');

    process.stderr.write(
      `Knowledge ladder chain broken at Q${chainCheck.brokenAt.join(', Q')} — retrying...\n`
    );
    if (delayMs > 0) await sleep(Math.max(delayMs, 500));
    knowledgeLadder = await generateKnowledgeLadder(
      config,
      title,
      plan,
      sectionText,
      language,
      fixHint
    );
    chainCheck = validateKnowledgeLadderChain(knowledgeLadder.items || []);
  }

  section.knowledge_ladder = knowledgeLadder;
  if (!sectionHasLadder(section)) {
    process.stderr.write(`Section ${plan.order} ladder empty — retrying ladder...\n`);
    if (delayMs > 0) await sleep(delayMs);
    section.knowledge_ladder = await generateKnowledgeLadder(
      config,
      title,
      plan,
      sectionText,
      language
    );
  }
  if (!chainCheck.valid) {
    process.stderr.write(
      `Warning: knowledge ladder chain still broken at Q${chainCheck.brokenAt.join(', Q')}\n`
    );
  }

  if (delayMs > 0) await sleep(delayMs);

  process.stderr.write(`AI section ${plan.order} line-to-line (full topic chain)...\n`);
  let lineToLine = await generateLineToLine(config, title, plan, sectionText, language);
  let lineCheck = validateLineToLineChain(lineToLine.items || []);

  const skipLineRetry = config.skip_ladder_retry === true || fast;
  if (!skipLineRetry && (!lineCheck.valid || lineCheck.brokenAt.length)) {
    const fixHint = (lineCheck.brokenAt || [])
      .map((qNum) => {
        const idx = qNum - 1;
        const prev = lineToLine.items[idx - 1];
        return `Q${qNum} must START WITH or contain previous answer "${prev?.answer}". Rewrite Q${qNum} accordingly.`;
      })
      .join('\n')
      || 'Cover the FULL topic with no fixed count. Keep the answer→next-question chain unbroken.';

    process.stderr.write(
      `Line-to-line chain incomplete/broken (count=${(lineToLine.items || []).length}) — retrying...\n`
    );
    if (delayMs > 0) await sleep(Math.max(delayMs, 500));
    lineToLine = await generateLineToLine(
      config,
      title,
      plan,
      sectionText,
      language,
      fixHint
    );
    lineCheck = validateLineToLineChain(lineToLine.items || []);
  }

  section.line_to_line = lineToLine;
  if (!sectionHasLineToLine(section)) {
    process.stderr.write(`Section ${plan.order} line-to-line empty — retrying...\n`);
    if (delayMs > 0) await sleep(delayMs);
    section.line_to_line = await generateLineToLine(
      config,
      title,
      plan,
      sectionText,
      language,
      'Cover the FULL topic. No min/max count. Each answer must start the next question.'
    );
  }

  if (delayMs > 0) await sleep(delayMs);

  try {
    section.practice_examination = await generateSectionExam(
      config,
      title,
      plan,
      language,
      sectionText,
      fast
    );
  } catch (err) {
    if (!isJsonParseError(err)) throw err;
    process.stderr.write(
      `Section ${plan.order} practice exam JSON failed after retries — compact retry...\n`
    );
    if (delayMs > 0) await sleep(delayMs);
    section.practice_examination = await generateSectionExam(
      config,
      title,
      plan,
      language,
      sectionText,
      true
    );
  }

  if (!sectionHasExam(section)) {
    process.stderr.write(`Section ${plan.order} exam incomplete — regenerating exam...\n`);
    if (delayMs > 0) await sleep(delayMs);
    section.practice_examination = await generateSectionExam(
      config,
      title,
      plan,
      language,
      sectionText,
      false
    );
  }

  section.id = section.id || plan.id;
  section.title = section.title || plan.title;
  section.title_gu = section.title_gu || plan.title_gu;
  section.order = plan.order;

  return normalizeSection(section, plan.order, language);
}

async function generateTextbookExercises(config, title, text, language = 'gu') {
  const langName = getLanguageName(language);
  const prompt = `Extract and generate textbook exercises from this ${langName} chapter end activities.
Create textbook_exercises JSON like Material PDF end-of-chapter activities.

${contentLanguageInstruction(language)}

Include ALL exercise types found in chapter — no fixed count, generate maximum relevant items:
- conversation / discussion questions
- true_choice / multiple choice
- comprehension passages
- word/grammar activities

Chapter: ${title}
CHAPTER TEXT (focus on end exercises):
${text.slice(-12000)}

${TEXTBOOK_SCHEMA}`;

  process.stderr.write('AI generating textbook exercises...\n');
  const parsed = await callOpenAIJson(config, prompt, { language });
  return parsed.textbook_exercises || parsed;
}

function enrichMaterial(material, chapterMeta, topicPlans = null) {
  material.meta = material.meta || {};
  material.meta.type = 'material';
  material.meta.language = normalizeLanguageCode(
    material.meta.language || chapterMeta.language || 'en'
  );
  material.meta.generated_by = 'ai';
  material.meta.generated_at = new Date().toISOString();
  material.meta.source_chapter = chapterMeta.source_file || null;
  material.meta.chapter_id = chapterMeta.id || null;
  material.meta.title = material.meta.title || chapterMeta.title || chapterMeta.chapter_name;
  material.meta.id = material.meta.id || chapterMeta.id;
  material.meta.medium = chapterMeta.medium || material.meta.medium || null;
  material.meta.standard = chapterMeta.standard || material.meta.standard || null;
  material.meta.subject = chapterMeta.subject || material.meta.subject || null;
  material.meta.chapter_no = chapterMeta.chapter_no || material.meta.chapter_no || null;
  material.meta.chapter_name =
    chapterMeta.chapter_name || chapterMeta.title || material.meta.chapter_name || null;
  material.meta.material_types = MATERIAL_TYPES;

  const planned = topicPlans?.length || material.topic_plans?.length || material.sections?.length || 0;
  material.meta.planned_sections = planned;
  material.meta.total_sections = material.sections?.length || 0;
  material.meta.generated_topic_orders = (material.sections || [])
    .map((s) => s.order)
    .filter(Boolean)
    .sort((a, b) => a - b);
  material.meta.generation_status =
    material.meta.total_sections >= planned && planned > 0 ? 'complete' : 'partial';

  if (topicPlans?.length) {
    material.topic_plans = topicPlans;
  }

  if (material.sections?.length && material.meta.generation_status === 'complete') {
    material.chapter_assessment = buildChapterAssessment(material.sections);
  }

  return material;
}

function mergeSectionIntoMaterial(material, section) {
  const next = { ...material, sections: [...(material.sections || [])] };
  const idx = next.sections.findIndex((s) => s.order === section.order);
  if (idx >= 0) next.sections[idx] = section;
  else next.sections.push(section);
  next.sections.sort((a, b) => (a.order || 0) - (b.order || 0));
  return next;
}

async function planChapterTopics(chapterJson, aiConfig) {
  const { meta, text, title, language } = buildMaterialPrompt(chapterJson);
  const slug = meta.id || 'chapter';
  const paragraphs = getChapterParagraphs(chapterJson);
  const topicWise = aiConfig.topic_wise !== false;
  const maxSections = topicWise ? 0 : Number(aiConfig.max_sections ?? DEFAULT_MAX_SECTIONS);

  const sectionPlans = await planSections(
    aiConfig,
    title,
    slug,
    text,
    maxSections,
    language,
    paragraphs.length
  );

  chapterJson.topics = sectionPlans;
  chapterJson.meta = chapterJson.meta || {};
  chapterJson.meta.topic_count = sectionPlans.length;
  chapterJson.meta.topics_planned_at = new Date().toISOString();

  return { meta, text, title, language, slug, sectionPlans };
}

async function generateTopicSection(chapterJson, aiConfig, topicIndex, sectionPlans = null) {
  const { meta, text, title, language, slug } = buildMaterialPrompt(chapterJson);
  const plans = sectionPlans || chapterJson.topics || [];
  if (!plans.length) {
    throw new Error('No topic plan found. Run topic planning first.');
  }

  const plan = plans.find((p) => p.order === topicIndex) || plans[topicIndex - 1];
  if (!plan) {
    throw new Error(`Topic ${topicIndex} not found in plan (${plans.length} topics)`);
  }

  process.stderr.write(`Generating topic ${plan.order}/${plans.length}: ${plan.title_gu || plan.title}...\n`);

  const section = await generateSection(
    aiConfig,
    title,
    slug,
    text,
    plan,
    plans.length,
    language,
    chapterJson
  );

  return { section, meta, text, title, language, slug, sectionPlans: plans, plan };
}

async function finalizeChapterMaterial(material, chapterJson, aiConfig) {
  const { meta, text, title, language } = buildMaterialPrompt(chapterJson);
  const plans = material.topic_plans || chapterJson.topics || [];

  let textbookExercises = material.textbook_exercises || null;
  if (!textbookExercises && aiConfig.fast_mode !== true) {
    try {
      textbookExercises = await generateTextbookExercises(aiConfig, title, text, language);
    } catch (err) {
      process.stderr.write(`Textbook exercises skipped: ${err.message}\n`);
    }
  } else if (aiConfig.fast_mode === true) {
    process.stderr.write('Fast mode: skipping textbook exercises finalize call\n');
  }

  const finalized = enrichMaterial(
    {
      ...material,
      ...(textbookExercises ? { textbook_exercises: textbookExercises } : {}),
    },
    meta,
    plans
  );

  finalized.meta.generation_status = 'complete';
  if (finalized.sections?.length) {
    finalized.chapter_assessment = buildChapterAssessment(finalized.sections);
  }

  return finalized;
}

async function generateMaterialFromChapter(chapterJson, aiConfig, options = {}) {
  if (!aiConfig.api_key || aiConfig.api_key === 'YOUR_OPENAI_API_KEY') {
    throw new Error(
      'AI API key not configured. Copy config.example.json to config.json and set ai.api_key.'
    );
  }

  const mode = options.mode || 'all';
  const topicIndex = Number(options.topicIndex || 1);
  const topicWise = options.topicWise ?? aiConfig.topic_wise !== false;

  if (mode === 'plan_only') {
    const planned = await planChapterTopics(chapterJson, aiConfig);
    return {
      meta: {
        id: planned.slug,
        title: planned.title,
        language: planned.language,
        type: 'material',
        planned_sections: planned.sectionPlans.length,
        total_sections: 0,
        generation_status: 'planned',
      },
      topics: planned.sectionPlans,
      sections: [],
      topic_plans: planned.sectionPlans,
    };
  }

  const { meta, text, title, language } = buildMaterialPrompt(chapterJson);
  const slug = meta.id || 'chapter';

  process.stderr.write(`Chapter language: ${language} (${getLanguageName(language)})\n`);

  let sectionPlans = chapterJson.topics?.length ? chapterJson.topics : null;
  if (!sectionPlans?.length) {
    const planned = await planChapterTopics(chapterJson, aiConfig);
    sectionPlans = planned.sectionPlans;
  }

  const maxSections = topicWise ? 0 : Number(aiConfig.max_sections ?? DEFAULT_MAX_SECTIONS);
  if (!chapterJson.topics?.length && !topicWise && maxSections === 1) {
    sectionPlans = await planSections(aiConfig, title, slug, text, 1, language);
  }

  process.stderr.write(
    `AI generating material (${aiConfig.model}) — ${sectionPlans.length} topic(s), mode: ${mode}...\n`
  );

  let material = options.existingMaterial || {
    meta: { id: slug, title, language, generated_by: 'ai' },
    sections: [],
    topic_plans: sectionPlans,
  };

  material.topic_plans = sectionPlans;

  const indicesToGenerate =
    mode === 'first_only'
      ? [1]
      : mode === 'topic'
        ? [topicIndex]
        : sectionPlans.map((p) => p.order);

  for (const idx of indicesToGenerate) {
    const { section } = await generateTopicSection(chapterJson, aiConfig, idx, sectionPlans);
    material = mergeSectionIntoMaterial(material, section);
    const delayMs = Number(aiConfig.request_delay_ms ?? 0);
    if (delayMs > 0) await sleep(delayMs);
  }

  const allDone = material.sections.length >= sectionPlans.length;
  if (allDone && (mode === 'all' || options.finalize)) {
    material = await finalizeChapterMaterial(material, chapterJson, aiConfig);
  } else {
    material = enrichMaterial(material, meta, sectionPlans);
  }

  return material;
}

module.exports = {
  generateMaterialFromChapter,
  buildMaterialPrompt,
  planChapterTopics,
  generateTopicSection,
  finalizeChapterMaterial,
  mergeSectionIntoMaterial,
  extractTopicText,
};
