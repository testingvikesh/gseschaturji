/** Material JSON format matching Material-*.pdf sample (Gujarat Board style) */

const QUESTION_TYPES = {
  one_word: { label: 'One Word Answer — 4 Option set', key: 'one_word', optionsCount: 4 },
  mcq: { label: 'MCQ — 4 Option set', key: 'mcq', optionsCount: 4 },
  fill_blanks: { label: 'Fill in the Blank — 4 Option set', key: 'fill_blanks', optionsCount: 4 },
  true_false: { label: 'True / False', key: 'true_false', optionsCount: 2 },
  match: { label: 'Jodka Jodo (જોડકા જોડો) — Match', key: 'match', optionsCount: 2 },
  one_mark: { label: '1 Mark Question', key: 'descriptive.one_mark', marks: 1 },
  two_marks: { label: '2 Marks Question', key: 'descriptive.two_marks', marks: 2 },
  three_marks: { label: '3 Marks Question', key: 'descriptive.three_marks', marks: 3 },
  four_marks: { label: '4 Marks Question', key: 'descriptive.four_marks', marks: 4 },
  five_marks: { label: '5 Marks Question', key: 'descriptive.five_marks', marks: 5 },
};

const DESCRIPTIVE_TIERS = ['one_mark', 'two_marks', 'three_marks', 'four_marks', 'five_marks'];

const DESCRIPTIVE_LINE_COUNTS = {
  one_mark: 1,
  two_marks: 2,
  three_marks: 3,
  four_marks: 4,
  five_marks: 5,
};

const DESCRIPTIVE_QUESTION_COUNTS = {
  one_mark: 5,
  two_marks: 4,
  three_marks: 3,
  four_marks: 2,
  five_marks: 2,
};

const MARKS_BY_TIER = {
  one_mark: 1,
  two_marks: 2,
  three_marks: 3,
  four_marks: 4,
  five_marks: 5,
};

function getMarksForTier(tier) {
  return MARKS_BY_TIER[tier] || 1;
}

function migrateLegacyDescriptive(desc) {
  if (!desc) return desc;
  // Keep three_marks / four_marks as-is (valid tiers now)
  return desc;
}

const PRACTICE_EXAM_TYPES = ['mcq', 'fill_blanks', 'true_false', 'match'];

const EXAM_PARTS = {
  objective: {
    title: 'Objective',
    title_gu: 'વસ્તુનિષ્ઠ',
    types: ['one_word', 'mcq', 'fill_blanks', 'true_false', 'match'],
  },
  subjective: {
    title: 'Subjective',
    title_gu: 'વ્યાખ્યાત્મક',
    types: ['one_mark', 'two_marks', 'three_marks', 'four_marks', 'five_marks'],
  },
};

const EXAM_STRUCTURE_RULES = `
EXAM — 2 PARTS structure (mandatory):

PART I — OBJECTIVE (વસ્તુનિષ્ઠ):
  1. one_word — One Word Answer with 4 Option set
  2. mcq — Multiple Choice with 4 Option set
  3. fill_blanks — Fill in the Blank with 4 Option set
  4. true_false — True / False (સાચું / ખોટું)
  5. match — Jodka Jodo / જોડકા જોડો (Match the Following, Left A/B Right 1/2)

PART II — SUBJECTIVE (વ્યાખ્યાત્મક):
  1. one_mark — 1 Mark questions, answer: EXACTLY 1 point line (array)
  2. two_marks — 2 Marks questions, answer: EXACTLY 2 point lines (array)
  3. three_marks — 3 Marks questions, answer: EXACTLY 3 point lines (array)
  4. four_marks — 4 Marks questions, answer: EXACTLY 4 point lines (array)
  5. five_marks — 5 Marks questions, answer: EXACTLY 5 point lines (array)
`;

const MATERIAL_TYPES = [
  'introduction',
  'trailer',
  'importance_of_this_topic',
  'knowledge_ladder',
  'line_to_line',
  'what_i_like',
  'what_i_learn',
  'one_word',
  'practice_examination',
  'textbook_exercises',
  'chapter_assessment',
];

const IMPORTANCE_OF_TOPIC_RULES = `
IMPORTANCE OF THIS TOPIC — why THIS section/topic matters for the student:

JSON structure:
  "importance_of_this_topic": {
    "title": "Importance of this topic",
    "points": ["5-7 real points from THIS section"]
  }

Rules:
- Exactly 5-7 points in the chapter language.
- Explain why this topic is important (exam value, life value, concept clarity, values).
- Points must be specific to THIS section text — no generic filler.
`;

const LINE_TO_LINE_RULES = `
LINE TO LINE — full-topic chained Question/Answer (line-wise).

COVER THE FULL TOPIC (NO fixed min/max count):
- Walk through THIS section/topic from start to end.
- Generate as many Q&A pairs as needed to cover the FULL topic — count depends on the topic length and facts.
- Do NOT stop at a fixed number. Do NOT pad with filler. Cover every important fact/event/idea in order.

STRICT CHAIN (line-wise link):
- Write Q1, then A1.
- Q2 MUST START WITH or contain A1 (previous answer).
- A2 is the next fact.
- Q3 MUST START WITH or contain A2.
- Continue this way until the FULL topic is covered.
- Pattern: Q → A → next Q starts from that A → next A → …

WRONG:
  A3: પત્રકારત્વ → Q4: "તેમણે કઈ ચળવળમાં..." ❌ (missing previous answer)

CORRECT:
  Q1: ...?  A1: ચંદ્રકાંત પંડ્યા
  Q2: ચંદ્રકાંત પંડ્યા નવસારીમાં કયા પદે હતા?  A2: શિક્ષક
  Q3: શિક્ષક હોવા ઉપરાંત તેઓ કયા ક્ષેત્ર સાથે જોડાયા?  A3: પત્રકારત્વ
  … continue until topic end.

JSON:
  "line_to_line": {
    "title": "Line to Line",
    "columns": ["Question", "Answer", "Next Linked Question"],
    "total_questions": N,
    "items": [
      { "id": 1, "question": "...", "answer": "...", "next_linked_question": "..." }
    ]
  }

- Answers: short clue (1–6 words). No duplicate questions.
- next_linked_question = next item's question text (last item: null).
- Do NOT copy Knowledge Ladder questions — cover the topic completely / in order.
`;

const SECTION_BLOCK_ORDER = `
SECTION BLOCK ORDER (mandatory — generate in this exact order):
1. introduction — 💡 one-line Gujarati summary of THIS section
2. trailer — ⭐ exactly 5 highlight points from THIS section
3. importance_of_this_topic — 5-7 points on why THIS topic matters
4. knowledge_ladder — 10 chained Question/Answer pairs (see KNOWLEDGE LADDER rules)
5. line_to_line — full-topic line-wise chained Q&A (answer starts next question; cover entire topic)
6. what_i_like — 5-7 points from THIS section
7. what_i_learn — 📌 32 ગુણ + 📌 64 કળા + 📌 16 સંસ્કાર (5 points each — see WHAT I LEARN rules)
8. one_word — One Word Answer with 4 Option set (minimum 8 questions)
`;

const WHAT_I_LEARN_RULES = `
WHAT I LEARN — Material PDF format with 3 columns (exactly 5 points each):

  📌 32 ગુણ  (gun)   — Learning Outcomes from THIS topic
                      Prompt: "Please provide list of Learning Outcomes from this topic"
  📌 64 કળા  (kala)  — Business Innovative & Start-up Ideas from THIS topic
                      Prompt: "Please provide list of Business Innovative and Start-up Ideas from this topic"
  📌 16 સંસ્કાર (sanskar) — Lifelong Entertainment & Family Activities from THIS topic
                      Prompt: "Please provide list of Lifelong Entertainment and Family Activities from this topic"

JSON structure:
  "what_i_learn": {
    "title": "What I Learn",
    "columns": [
      { "code": "32", "label_gu": "32 ગુણ", "key": "gun", "meaning_gu": "Learning Outcomes from this topic", "points": ["point1", ...5] },
      { "code": "64", "label_gu": "64 કળા", "key": "kala", "meaning_gu": "Business Innovative & Start-up Ideas from this topic", "points": ["point1", ...5] },
      { "code": "16", "label_gu": "16 સંસ્કાર", "key": "sanskar", "meaning_gu": "Lifelong Entertainment & Family Activities from this topic", "points": ["point1", ...5] }
    ],
    "gun": ["same 5 points as column 32"],
    "kala": ["same 5 points as column 64"],
    "sanskar": ["same 5 points as column 16"]
  }

Rules:
- Each column MUST have exactly 5 points in the chapter language (Gujarati/Hindi/English as required).
- 32 ગુણ = clear Learning Outcomes the student gains from THIS topic (what they will know/understand/do).
- 64 કળા = Business Innovative and Start-up Ideas inspired by THIS topic (practical venture / innovation ideas).
- 16 સંસ્કાર = Lifelong Entertainment and Family Activities linked to THIS topic (fun, bonding, home/family activities).
- gun/kala/sanskar arrays must match their column points exactly.
- Points must be specific to THIS section/topic text — do not write generic advice.
`;

const SECTION_SCHEMA = {
  id: 'section-slug',
  title: 'English section name',
  title_gu: 'Gujarati section name',
  order: 1,
  introduction: {
    summary: 'Gujarati one-line section summary (💡 Introduction box)',
  },
  trailer: { points: ['5 Gujarati bullet points'] },
  importance_of_this_topic: {
    title: 'Importance of this topic',
    points: ['5-7 points why this topic matters'],
  },
  knowledge_ladder: {
    columns: ['Question', 'Answer', 'Next Linked Question'],
    total_questions: 10,
    items: [{
      id: 1,
      question: '...?',
      answer: 'short clue',
      next_linked_question: 'next question using previous answer as clue',
    }],
  },
  line_to_line: {
    title: 'Line to Line',
    columns: ['Question', 'Answer', 'Next Linked Question'],
    total_questions: 'as needed for full topic',
    items: [{
      id: 1,
      question: '...?',
      answer: 'short clue',
      next_linked_question: 'next question starting from previous answer',
    }],
  },
  what_i_like: { points: ['5-7 Gujarati points'] },
  what_i_learn: {
    title: 'What I Learn',
    columns: [
      { code: '32', label_gu: '32 ગુણ', key: 'gun', meaning_gu: 'Learning Outcomes from this topic', points: ['5 learning outcome points'] },
      { code: '64', label_gu: '64 કળા', key: 'kala', meaning_gu: 'Business Innovative & Start-up Ideas from this topic', points: ['5 business/startup idea points'] },
      { code: '16', label_gu: '16 સંસ્કાર', key: 'sanskar', meaning_gu: 'Lifelong Entertainment & Family Activities from this topic', points: ['5 entertainment/family activity points'] },
    ],
    gun: ['5 learning outcome points'],
    kala: ['5 business/startup idea points'],
    sanskar: ['5 entertainment/family activity points'],
  },
  one_word: {
    total_questions: 12,
    items: [{
      question: '...?',
      options: ['option A', 'option B', 'option C', 'option D'],
      answer: 'correct option text',
    }],
  },
  practice_examination: {
    title: 'Chapter title - section title_gu',
    total_questions: 32,
    parts: {
      objective: {
        title: 'Objective',
        one_word: {
          total_questions: 12,
          items: [{
            question: '...?',
            options: ['option A', 'option B', 'option C', 'option D'],
            answer: 'correct option text',
          }],
        },
        mcq: { marks_per_question: 1, total: 8, questions: [] },
        fill_blanks: { marks_per_question: 1, total: 6, questions: [] },
        true_false: { marks_per_question: 1, total: 6, questions: [] },
        match: { title: 'જોડકા જોડો', marks_per_question: 2, total: 1, questions: [] },
      },
      subjective: {
        title: 'Subjective',
        one_mark: { marks_per_question: 1, total: 5, questions: [] },
        two_marks: { marks_per_question: 2, total: 4, questions: [] },
        three_marks: { marks_per_question: 3, total: 3, questions: [] },
        four_marks: { marks_per_question: 4, total: 2, questions: [] },
        five_marks: { marks_per_question: 5, total: 2, questions: [] },
      },
    },
    sections: {
      mcq: {
        marks_per_question: 1,
        total: 8,
        questions: [{ id: 1, question: '...', options: ['a', 'b', 'c', 'd'], answer: 'correct text' }],
      },
      fill_blanks: {
        marks_per_question: 1,
        total: 6,
        questions: [{
          id: 1,
          question: '... ___________ ...',
          options: ['option A', 'option B', 'option C', 'option D'],
          answer: 'correct option text',
        }],
      },
      true_false: {
        marks_per_question: 1,
        total: 6,
        questions: [{ id: 1, question: '...', answer: true }],
      },
      match: {
        title: 'જોડકા જોડો',
        marks_per_question: 2,
        total: 1,
        questions: [{
          id: 1,
          question: 'નીચેના પદોને સાચી જોડીમાં મેળવો.',
          column_a: ['A. બોડી', 'B. લેખક'],
          column_b: ['1. ગાય', '2. ચંદ્રકાંત પંડ્યા'],
          answer: 'A-1, B-2',
        }],
      },
      descriptive: {
        one_mark: {
          marks_per_question: 1,
          total: 5,
          questions: [{ id: 1, question: '...', answer: ['exactly 1 point line'] }],
        },
        two_marks: {
          marks_per_question: 2,
          total: 4,
          questions: [{ id: 1, question: '...', answer: ['point 1', 'point 2'] }],
        },
        three_marks: {
          marks_per_question: 3,
          total: 3,
          questions: [{ id: 1, question: '...', answer: ['p1', 'p2', 'p3'] }],
        },
        four_marks: {
          marks_per_question: 4,
          total: 2,
          questions: [{ id: 1, question: '...', answer: ['p1', 'p2', 'p3', 'p4'] }],
        },
        five_marks: {
          marks_per_question: 5,
          total: 2,
          questions: [{ id: 1, question: '...', answer: ['p1', 'p2', 'p3', 'p4', 'p5'] }],
        },
      },
    },
  },
};

const KNOWLEDGE_LADDER_COUNT = 10;

const KNOWLEDGE_LADDER_RULES = `
KNOWLEDGE LADDER — EXACTLY ${KNOWLEDGE_LADDER_COUNT} questions in strict chain.

STRICT CHAIN RULE (every question after Q1):
- Q2 MUST contain A1 (answer of Q1) in the question text.
- Q3 MUST contain A2 (answer of Q2) in the question text.
- Q4 MUST contain A3 ... continue until Q${KNOWLEDGE_LADDER_COUNT} contains A${KNOWLEDGE_LADDER_COUNT - 1}.
- NEVER use "તેમણે", "તેમનું", "લેખક" alone when previous answer should be the clue.
- NEVER jump back to "બોડી" or "લેખક" if previous answer was something else (e.g. A8=આઠ શેર → Q9 must use "આઠ શેર", not "બોડી").

WRONG (breaks chain):
  A3: પત્રકારત્વ → Q4: "તેમણે કઈ ચળવળમાં..." ❌ (missing પત્રકારત્વ)
  A6: અબોલ પ્રાણી → Q7: "લેખકની ગાયનું નામ..." ❌ (missing અબોલ પ્રાણી)
  A8: આઠ શેર → Q9: "બોડી ગાયનો સ્વભાવ..." ❌ (missing આઠ શેર)

CORRECT full chain example:
  Q1: ચરોતરના વતની અને આ પાઠના લેખક કોણ હતા?
  A1: ચંદ્રકાંત પંડ્યા
  Q2: ચંદ્રકાંત પંડ્યા નવસારીની હાઈસ્કૂલમાં કયા પદે કાર્યરત હતા?
  A2: શિક્ષક
  Q3: શિક્ષક હોવા ઉપરાંત તેઓ કયા ક્ષેત્ર સાથે સંકળાયેલા હતા?
  A3: પત્રકારત્વ
  Q4: પત્રકારત્વ સાથે જોડાયેલા લેખકે કઈ ચળવળમાં સક્રિય ભાગ લીધો હતો?
  A4: આઝાદીની ચળવળ
  Q5: આઝાદીની ચળવળમાં ભાગ લેનાર લેખકના કયા પુસ્તકમાંથી આ પાઠ લેવાયો છે?
  A5: બાનો ભીડુ
  Q6: બાનો ભીડુ પુસ્તકના આ પાઠમાં મનુષ્ય અને કયા પ્રાણીના સહજીવનનું નિરૂપણ છે?
  A6: અબોલ પ્રાણી
  Q7: અબોલ પ્રાણી સાથેના સહજીવનમાં લેખકની કઈ ગાયનું વર્ણન છે?
  A7: બોડી
  Q8: બોડી ગાય એક વખતે કેટલું દૂધ આપતી હતી?
  A8: આઠ શેર
  Q9: આઠ શેર દૂધ આપતી બોડી ગાયનો સ્વભાવ કેવો હતો?
  A9: ગરીબડા
  Q10: ગરીબડા સ્વભાવની બોડી ગાયને કઈ વસ્તુ ગમતી હતી?
  A10: ચોખ્ખાઈ

JSON item format:
  { "id": N, "question": "...", "answer": "...", "next_linked_question": "Q(N+1) text or null" }
- Answers: 1-4 words. No duplicate questions. Easy → difficult.
`;

const SECTION_RULES = `
Each section MUST include ALL of these (like Material PDF):
1. trailer — 5 key points (⭐ style highlights from THIS section only)
2. importance_of_this_topic — 5-7 points on why THIS topic is important
3. knowledge_ladder — summary + exactly ${KNOWLEDGE_LADDER_COUNT} chained Q&A items (see KNOWLEDGE LADDER rules)
4. line_to_line — full-topic line-wise chained Q&A (answer starts next question; cover entire topic)
5. what_i_like — 5-7 points from THIS section
6. what_i_learn — What I Learn with 32 ગુણ, 64 કળા, 16 સંસ્કાર (5 points each)
7. one_word — One Word Answer with 4 Option set: minimum 8 questions, EXACTLY 4 options each (same format as mcq)
8. practice_examination — 2 PARTS (see EXAM_STRUCTURE_RULES):
   PART I OBJECTIVE: one_word + mcq + fill_blanks + true_false + match (Jodka Jodo / જોડકા જોડો)
   PART II SUBJECTIVE: one_mark + two_marks + three_marks + four_marks + five_marks
   - Set total_questions to sum of all questions in both parts
`;

const ONE_WORD_RULES = `
ONE WORD ANSWER (one_word) — 4 Option set (same JSON format as mcq):

  { "question": "...", "options": ["opt A", "opt B", "opt C", "opt D"], "answer": "opt A" }

Rules:
- EXACTLY 4 options per question — answer must match one option text
- Minimum 8 unique questions per section
- Do NOT duplicate questions from knowledge_ladder
- Do NOT use plain Q&A without options
`;

const DESCRIPTIVE_ANSWER_RULES = `
DESCRIPTIVE ANSWER — point-wise lines (answer MUST be JSON array):

CRITICAL RULE:
- Only include a question if you can write a REAL answer from the chapter text.
- If answer is unknown / not in chapter → DO NOT include that question at all.
- NEVER use placeholders like "point 1", "p1", "પોઈન્ટ 1", "કારણ 1", "વાર્તાનું નામ".

1 Mark (one_mark) — up to ${DESCRIPTIVE_QUESTION_COUNTS.one_mark} questions:
  { "question": "...", "answer": ["single real point line"] } → EXACTLY 1 line

2 Marks (two_marks) — up to ${DESCRIPTIVE_QUESTION_COUNTS.two_marks} questions:
  { "question": "...", "answer": ["real point 1", "real point 2"] } → EXACTLY 2 lines

3 Marks (three_marks) — up to ${DESCRIPTIVE_QUESTION_COUNTS.three_marks} questions:
  { "question": "...", "answer": ["p1", "p2", "p3"] } → EXACTLY 3 REAL lines

4 Marks (four_marks) — up to ${DESCRIPTIVE_QUESTION_COUNTS.four_marks} questions:
  { "question": "...", "answer": ["p1", "p2", "p3", "p4"] } → EXACTLY 4 REAL lines

5 Marks (five_marks) — up to ${DESCRIPTIVE_QUESTION_COUNTS.five_marks} questions:
  { "question": "...", "answer": ["p1", "p2", "p3", "p4", "p5"] } → EXACTLY 5 REAL lines

Each line = one clear descriptive point from the chapter. Do NOT use single string — always use array.
`;

const TRUE_FALSE_RULES = `
TRUE / FALSE (true_false) — સાચું / ખોટું:

  { "id": 1, "question": "statement...", "answer": true }
  OR
  { "id": 1, "question": "statement...", "answer": false }
  OR answer as "True"/"False" or "સાચું"/"ખોટું"

Rules:
- Minimum 6 unique statements per section
- Mix of true and false answers
- Do NOT use MCQ options for true/false
`;

const MATCH_REFERENCE_EXAMPLE = `
JODKA JODO / જોડકા જોડો (match) — 2 Option set (Left A/B, Right 1/2):

{
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
}

Rules:
- column_a: EXACTLY 2 items — labels A. and B.
- column_b: EXACTLY 2 items — labels 1. and 2.
- answer: pairing format "A-2, B-1"
- Title may be "Jodka Jodo" or "જોડકા જોડો"
`;

const SECTION_CONTENT_RULES = `
Each section content MUST follow this order (knowledge_ladder generated separately):
1. introduction — { "summary": "💡 one-line Gujarati summary" }
2. trailer — exactly 5 points (⭐ highlights from THIS section only)
3. importance_of_this_topic — 5-7 points why THIS topic matters
4. what_i_like — 5-7 points from THIS section
5. what_i_learn — What I Learn with 32 ગુણ, 64 કળા, 16 સંસ્કાર (5 points each)
6. one_word — One Word Answer with 4 Option set (question + options[4] + answer)
${IMPORTANCE_OF_TOPIC_RULES.trim()}
${ONE_WORD_RULES.trim()}
`;

function buildChapterAssessment(sections) {
  const counts = {
    one_word: { total: 0, marks: 0 },
    mcq: { total: 0, marks: 0 },
    fill_blanks: { total: 0, marks: 0 },
    true_false: { total: 0, marks: 0 },
    match: { total: 0, marks: 0 },
    descriptive: {
      one_mark: { total: 0, marks: 0 },
      two_marks: { total: 0, marks: 0 },
      three_marks: { total: 0, marks: 0 },
      four_marks: { total: 0, marks: 0 },
      five_marks: { total: 0, marks: 0 },
    },
  };

  for (const section of sections) {
    const ow = section.one_word;
    if (ow?.items?.length || ow?.total_questions) {
      const n = ow.items?.length || ow.total_questions || 0;
      counts.one_word.total += n;
      counts.one_word.marks += n;
    }

    const pe = section.practice_examination?.sections;
    if (!pe) continue;

    for (const key of PRACTICE_EXAM_TYPES) {
      const block = pe[key];
      if (!block) continue;
      const n = block.questions?.length || block.total || 0;
      const m = block.marks_per_question || (key === 'match' ? 2 : 1);
      counts[key].total += n;
      counts[key].marks += n * m;
    }

    const desc = pe.descriptive || {};
    for (const tier of DESCRIPTIVE_TIERS) {
      const block = desc[tier];
      if (!block) continue;
      const n = block.questions?.length || block.total || 0;
      const m = block.marks_per_question || getMarksForTier(tier);
      counts.descriptive[tier].total += n;
      counts.descriptive[tier].marks += n * m;
    }
  }

  let objectiveQuestions = counts.one_word.total;
  let objectiveMarks = counts.one_word.marks;
  let subjectiveQuestions = 0;
  let subjectiveMarks = 0;

  for (const key of PRACTICE_EXAM_TYPES) {
    objectiveQuestions += counts[key].total;
    objectiveMarks += counts[key].marks;
  }
  for (const tier of DESCRIPTIVE_TIERS) {
    subjectiveQuestions += counts.descriptive[tier].total;
    subjectiveMarks += counts.descriptive[tier].marks;
  }

  return {
    title: 'CHAPTER ASSESSMENT - Practice Examination',
    total_questions: objectiveQuestions + subjectiveQuestions,
    total_marks: objectiveMarks + subjectiveMarks,
    parts: {
      objective: { total_questions: objectiveQuestions, total_marks: objectiveMarks },
      subjective: { total_questions: subjectiveQuestions, total_marks: subjectiveMarks },
    },
    instructions: [
      'Attempt all questions.',
      'Write answers in your notebook.',
      'Marks are indicated next to each section.',
    ],
    sections: counts,
    note: 'Consolidated questions from all section practice_examination objects.',
  };
}

function normalizeWhatILearn(whatILearn, language = 'gu') {
  if (!whatILearn) return whatILearn;

  const { getWhatILearnColumnDefs } = require('./language');
  const defs = getWhatILearnColumnDefs(language).map((def) => ({
    code: def.code,
    label_gu: def.label,
    label: def.label,
    key: def.key,
  }));

  whatILearn.title = whatILearn.title || 'What I Learn';

  for (const def of defs) {
    const fromKey = Array.isArray(whatILearn[def.key])
      ? whatILearn[def.key].map((p) => String(p).trim()).filter(Boolean).slice(0, 5)
      : [];
    whatILearn[def.key] = fromKey;
  }

  whatILearn.columns = defs.map((def) => {
    const existing = whatILearn.columns?.find(
      (c) => c.code === def.code || c.key === def.key
    );
    const points = existing?.points?.length
      ? existing.points.map((p) => String(p).trim()).filter(Boolean).slice(0, 5)
      : whatILearn[def.key];

    whatILearn[def.key] = points;

    return {
      code: def.code,
      label_gu: def.label_gu,
      label: def.label,
      key: def.key,
      points,
    };
  });

  return whatILearn;
}

function pickQuestionText(item) {
  if (typeof item === 'string') return item.trim();
  if (!item || typeof item !== 'object') return '';
  return String(
    item.question ?? item.text ?? item.statement ?? item.prompt ?? item.q ?? ''
  ).trim();
}

function pickAnswer(item) {
  if (typeof item === 'string') return '';
  if (!item || typeof item !== 'object') return '';
  const answer = item.answer ?? item.ans ?? item.correct ?? item.match;
  return answer == null ? '' : answer;
}

/** Detect AI placeholder / empty answer lines (not real chapter content). */
function isPlaceholderAnswerText(text) {
  const raw = String(text || '').trim();
  if (!raw) return true;
  const t = raw
    .toLowerCase()
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    /^(p|pt|point|points|ans|answer|line|reason|કારણ|પોઈન્ટ|પોઇન્ટ|જવાબ|મુદ્દો|मुद्दा|उत्तर|बिंदु)\s*[-.:)]*\s*\d+$/i.test(
      t
    )
  ) {
    return true;
  }
  if (
    /^(વાર્તાનું નામ|story name|name of (the )?story|કારણ|reason|પોઈન્ટ|point|placeholder|\.{2,}|…+)$/i.test(
      t
    )
  ) {
    return true;
  }
  if (/^(n\/?a|nil|none|null|undefined|-|—|–)$/i.test(t)) return true;
  if (/^\[?(point|p|line|reason)\s*\d+\]?$/i.test(t)) return true;
  return false;
}

function hasUsableAnswer(answer, options = null) {
  if (answer === true || answer === false) return true;
  if (Array.isArray(answer)) {
    const points = answer
      .map((p) => String(p).trim())
      .filter((p) => p && !isPlaceholderAnswerText(p));
    return points.length > 0;
  }
  const text = String(answer ?? '').trim();
  if (!text || isPlaceholderAnswerText(text)) return false;
  if (Array.isArray(options) && options.length) {
    const opts = options.map((o) => String(o).trim()).filter(Boolean);
    if (opts.length && !opts.some((o) => o.toLowerCase() === text.toLowerCase())) {
      // Still accept if answer is option letter A/B/C/D mapped later — keep if non-empty real text
      if (!/^[A-Da-d]$/.test(text)) {
        // Prefer matching option text; if no match, still keep non-placeholder answer
      }
    }
  }
  return true;
}

function normalizeQuestionItem(item, index) {
  const id =
    typeof item === 'object' && item != null && item.id != null ? item.id : index + 1;
  return {
    id,
    question: pickQuestionText(item),
    answer: pickAnswer(item),
  };
}

function normalizeMcqQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions
    .map((q, i) => {
      const base = normalizeQuestionItem(q, i);
      const rawOpts = typeof q === 'object' && q != null ? q.options : [];
      const options = Array.isArray(rawOpts)
        ? rawOpts.map((o) => String(o).trim()).filter(Boolean)
        : Object.values(rawOpts || {})
            .map((o) => String(o).trim())
            .filter(Boolean);
      return { ...base, options };
    })
    .filter((q) => q.question && hasUsableAnswer(q.answer, q.options))
    .map((q, i) => ({ ...q, id: q.id != null ? q.id : i + 1 }));
}

function normalizeSimpleQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions
    .map((q, i) => normalizeQuestionItem(q, i))
    .filter((q) => q.question && hasUsableAnswer(q.answer))
    .map((q, i) => ({ ...q, id: q.id != null ? q.id : i + 1 }));
}

function stripListPrefix(text) {
  return String(text)
    .replace(/^\d+\.\s*/, '')
    .replace(/^[A-Za-z]\.\s*/, '')
    .trim();
}

function formatMatchColumnItem(text, label) {
  const clean = stripListPrefix(text);
  return `${label}. ${clean}`;
}

function normalizeMatchAnswer(answer) {
  return String(answer || '')
    .split(/,\s*/)
    .map((pair) => {
      const [left, right] = pair.split('-').map((s) => s.trim());
      if (!left || !right) return '';
      const letter = left.replace(/[^A-Za-z]/g, '').toUpperCase();
      const num = right.replace(/[^\d]/g, '');
      return letter && num ? `${letter}-${num}` : '';
    })
    .filter(Boolean)
    .join(', ');
}

function normalizeMatchQuestion(q, index) {
  const colA = (q.column_a || []).slice(0, 2).map((item, i) =>
    formatMatchColumnItem(item, String.fromCharCode(65 + i))
  );
  const colB = (q.column_b || []).slice(0, 2).map((item, i) =>
    formatMatchColumnItem(item, String(i + 1))
  );

  if (colA.length === 2 && colB.length === 2) {
    const answer = normalizeMatchAnswer(pickAnswer(q));
    if (!answer) return null;
    return {
      id: q.id ?? index + 1,
      question: pickQuestionText(q) || 'નીચેના પદોને સાચી જોડીમાં મેળવો.',
      column_a: colA,
      column_b: colB,
      answer,
    };
  }

  // Legacy MCQ-style match — rebuild 2-item columns from first 2 questions
  if (q.options?.length >= 2) {
    const leftText = stripListPrefix(pickQuestionText(q));
    const answer = normalizeMatchAnswer(pickAnswer(q));
    if (!answer) return null;
    return {
      id: q.id ?? index + 1,
      question: 'નીચેના પદોને સાચી જોડીમાં મેળવો.',
      column_a: [formatMatchColumnItem(leftText, 'A')],
      column_b: q.options.slice(0, 2).map((opt, i) => formatMatchColumnItem(opt, String(i + 1))),
      answer,
    };
  }

  return null;
}

function normalizeMatchBlock(matchBlock) {
  if (!matchBlock?.questions?.length) return matchBlock;

  const first = matchBlock.questions[0];

  // Legacy { item, match } pairs
  if (first?.item != null && first?.match != null) {
    const pairs = matchBlock.questions
      .map((p) => ({
        left: String(p.item ?? '').trim(),
        right: String(p.match ?? '').trim(),
      }))
      .filter((p) => p.left && p.right)
      .slice(0, 2);

    if (pairs.length === 2) {
      matchBlock.questions = [
        {
          id: 1,
          question: 'નીચેના પદોને સાચી જોડીમાં મેળવો.',
          column_a: pairs.map((p, i) => formatMatchColumnItem(p.left, String.fromCharCode(65 + i))),
          column_b: pairs.map((p, i) => formatMatchColumnItem(p.right, String(i + 1))),
          answer: 'A-1, B-2',
        },
      ];
    }
  } else {
    const normalized = matchBlock.questions
      .map((q, i) => normalizeMatchQuestion(q, i))
      .filter((q) => q?.column_a?.length === 2 && q?.column_b?.length === 2);

    if (normalized.length) {
      matchBlock.questions = normalized;
    }
  }

  matchBlock.total = matchBlock.questions.length;
  matchBlock.marks_per_question = matchBlock.marks_per_question || 2;
  return matchBlock;
}

function answerToPoints(answer) {
  if (Array.isArray(answer)) {
    return answer
      .map((p) => String(p).trim())
      .filter((p) => p && !isPlaceholderAnswerText(p));
  }
  return String(answer || '')
    .split(/\n+|(?:\.\s+)|(?:;\s+)|(?:\|\s+)/)
    .map((p) => p.trim())
    .filter((p) => p && !isPlaceholderAnswerText(p));
}

function normalizeDescriptiveQuestions(questions, tier) {
  const lineCount = DESCRIPTIVE_LINE_COUNTS[tier] || 1;
  if (!Array.isArray(questions)) return [];

  return questions
    .map((q, i) => {
      const base = normalizeQuestionItem(q, i);
      let points = answerToPoints(q.points ?? q.answer);
      if (points.length > lineCount) points = points.slice(0, lineCount);
      // Do not invent / pad fake points — keep only real answer lines
      if (!points.length) return null;
      return { ...base, answer: points };
    })
    .filter((q) => q && q.question && hasUsableAnswer(q.answer))
    .map((q, i) => ({ ...q, id: q.id != null ? q.id : i + 1 }));
}

function resolveExamSections(practiceExam) {
  if (practiceExam?.parts) {
    const obj = practiceExam.parts.objective || {};
    const sub = migrateLegacyDescriptive({ ...(practiceExam.parts.subjective || {}) });
    return {
      mcq: obj.mcq,
      fill_blanks: obj.fill_blanks,
      true_false: obj.true_false,
      match: obj.match,
      descriptive: {
        one_mark: sub.one_mark,
        two_marks: sub.two_marks,
        three_marks: sub.three_marks,
        four_marks: sub.four_marks,
        five_marks: sub.five_marks,
      },
    };
  }
  const sections = practiceExam?.sections || {};
  if (sections.descriptive) {
    sections.descriptive = migrateLegacyDescriptive({ ...sections.descriptive });
  }
  return sections;
}

function buildExamParts(sections, oneWord) {
  const desc = migrateLegacyDescriptive({ ...(sections.descriptive || {}) });
  return {
    objective: {
      title: EXAM_PARTS.objective.title,
      title_gu: EXAM_PARTS.objective.title_gu,
      one_word: oneWord || null,
      mcq: sections.mcq || null,
      fill_blanks: sections.fill_blanks || null,
      true_false: sections.true_false || null,
      match: sections.match || null,
    },
    subjective: {
      title: EXAM_PARTS.subjective.title,
      title_gu: EXAM_PARTS.subjective.title_gu,
      one_mark: desc.one_mark || null,
      two_marks: desc.two_marks || null,
      three_marks: desc.three_marks || null,
      four_marks: desc.four_marks || null,
      five_marks: desc.five_marks || null,
    },
  };
}

function countPartQuestions(parts, oneWord) {
  let objective = 0;
  let subjective = 0;

  if (oneWord?.items?.length) objective += oneWord.items.length;
  else if (oneWord?.total_questions) objective += oneWord.total_questions;

  const obj = parts?.objective || {};
  for (const key of ['mcq', 'fill_blanks', 'true_false', 'match']) {
    const block = obj[key];
    if (!block) continue;
    objective += block.questions?.length || block.total || 0;
  }

  const sub = parts?.subjective || {};
  for (const tier of DESCRIPTIVE_TIERS) {
    const block = sub[tier];
    if (!block) continue;
    subjective += block.questions?.length || block.total || 0;
  }

  return { objective, subjective, total: objective + subjective };
}

function normalizePracticeExam(practiceExam, oneWord = null) {
  if (!practiceExam) return practiceExam;

  // Merge one_word from parts.objective if AI put it there
  const partsOneWord = practiceExam.parts?.objective?.one_word;
  if (partsOneWord?.items?.length && !oneWord?.items?.length) {
    oneWord = normalizeOneWord(partsOneWord);
  }

  if (!practiceExam.sections) {
    practiceExam.sections = resolveExamSections(practiceExam);
  }
  if (!practiceExam?.sections) return practiceExam;

  const sections = practiceExam.sections;

  if (sections.mcq) {
    sections.mcq.questions = normalizeMcqQuestions(sections.mcq.questions);
    sections.mcq.total = sections.mcq.questions.length;
  }
  if (sections.fill_blanks) {
    sections.fill_blanks.questions = normalizeMcqQuestions(sections.fill_blanks.questions);
    sections.fill_blanks.total = sections.fill_blanks.questions.length;
  }
  if (sections.match) {
    normalizeMatchBlock(sections.match);
    if (!sections.match.title) sections.match.title = 'જોડકા જોડો';
  }

  if (sections.true_false) {
    sections.true_false.questions = normalizeTrueFalseQuestions(sections.true_false.questions);
    sections.true_false.total = sections.true_false.questions.length;
    sections.true_false.marks_per_question = sections.true_false.marks_per_question || 1;
  }

  sections.descriptive = migrateLegacyDescriptive({ ...(sections.descriptive || {}) });
  const desc = sections.descriptive;
  for (const tier of DESCRIPTIVE_TIERS) {
    const block = desc[tier];
    if (!block) continue;
    block.questions = normalizeDescriptiveQuestions(block.questions, tier);
    block.total = block.questions.length;
    block.marks_per_question = block.marks_per_question || getMarksForTier(tier);
  }

  practiceExam.parts = buildExamParts(sections, oneWord);
  const counts = countPartQuestions(practiceExam.parts, oneWord);
  practiceExam.total_questions = counts.total;
  practiceExam.objective_questions = counts.objective;
  practiceExam.subjective_questions = counts.subjective;

  return practiceExam;
}

function normalizeTrueFalseQuestions(questions) {
  if (!Array.isArray(questions)) return [];
  return questions
    .map((q, i) => {
      const base = normalizeQuestionItem(q, i);
      let answer = q.answer ?? q.ans ?? q.correct;
      if (typeof answer === 'string') {
        const a = answer.trim().toLowerCase();
        if (['true', 'yes', 'સાચું', 'sachu', 't', '1'].includes(a)) answer = true;
        else if (['false', 'no', 'ખોટું', 'khotu', 'f', '0'].includes(a)) answer = false;
      }
      if (answer !== true && answer !== false) return null;
      return { ...base, answer };
    })
    .filter((q) => q && q.question)
    .map((q, i) => ({ ...q, id: q.id != null ? q.id : i + 1 }));
}

function normalizeOneWord(oneWord) {
  if (!oneWord?.items) return oneWord;

  oneWord.items = normalizeMcqQuestions(oneWord.items);
  oneWord.total_questions = oneWord.items.length;
  return oneWord;
}

function normalizeSection(section, order, language = 'gu') {
  section.order = section.order || order;

  if (!section.introduction?.summary && section.knowledge_ladder?.summary) {
    section.introduction = { summary: section.knowledge_ladder.summary };
    delete section.knowledge_ladder.summary;
  }

  if (section.importance_of_this_topic) {
    const points = (section.importance_of_this_topic.points || [])
      .map((p) => String(p || '').trim())
      .filter(Boolean);
    section.importance_of_this_topic = {
      title: section.importance_of_this_topic.title || 'Importance of this topic',
      points,
    };
    if (!points.length) delete section.importance_of_this_topic;
  }

  if (section.knowledge_ladder) {
    const { normalizeKnowledgeLadder } = require('./normalize-knowledge-ladder');
    section.knowledge_ladder = normalizeKnowledgeLadder(section.knowledge_ladder);
  }

  if (section.line_to_line) {
    const { normalizeLineToLine } = require('./normalize-line-to-line');
    section.line_to_line = normalizeLineToLine(section.line_to_line);
  }

  if (section.what_i_learn) {
    section.what_i_learn = normalizeWhatILearn(section.what_i_learn, language);
  }

  if (section.one_word?.items) {
    section.one_word = normalizeOneWord(section.one_word);
  }

  if (section.one_word?.items && section.knowledge_ladder?.items) {
    const ladderQs = new Set(
      section.knowledge_ladder.items.map((i) => i.question.replace(/\s+/g, ' ').toLowerCase())
    );
    section.one_word.items = section.one_word.items.filter((item) => {
      const q = String(item.question || '').replace(/\s+/g, ' ').toLowerCase();
      return q && !ladderQs.has(q);
    });
    section.one_word.total_questions = section.one_word.items.length;
  }

  if (section.one_word?.items) {
    section.one_word.total_questions = section.one_word.items.length;
  }
  if (section.practice_examination) {
    section.practice_examination = normalizePracticeExam(
      section.practice_examination,
      section.one_word
    );
    // Sync one_word from parts if generated inside practice exam
    if (section.practice_examination.parts?.objective?.one_word?.items?.length) {
      section.one_word = section.practice_examination.parts.objective.one_word;
    }
  }
  return section;
}

function countPracticeQuestions(sections, oneWord = null) {
  let n = 0;
  if (oneWord?.items?.length) n += oneWord.items.length;
  for (const key of PRACTICE_EXAM_TYPES) {
    n += sections[key]?.questions?.length || sections[key]?.total || 0;
  }
  const desc = sections.descriptive || {};
  for (const tier of DESCRIPTIVE_TIERS) {
    n += desc[tier]?.questions?.length || desc[tier]?.total || 0;
  }
  return n;
}

module.exports = {
  QUESTION_TYPES,
  EXAM_PARTS,
  EXAM_STRUCTURE_RULES,
  DESCRIPTIVE_TIERS,
  DESCRIPTIVE_LINE_COUNTS,
  DESCRIPTIVE_QUESTION_COUNTS,
  PRACTICE_EXAM_TYPES,
  MATERIAL_TYPES,
  KNOWLEDGE_LADDER_COUNT,
  SECTION_SCHEMA,
  KNOWLEDGE_LADDER_RULES,
  IMPORTANCE_OF_TOPIC_RULES,
  LINE_TO_LINE_RULES,
  WHAT_I_LEARN_RULES,
  ONE_WORD_RULES,
  DESCRIPTIVE_ANSWER_RULES,
  TRUE_FALSE_RULES,
  MATCH_REFERENCE_EXAMPLE,
  SECTION_BLOCK_ORDER,
  SECTION_RULES,
  SECTION_CONTENT_RULES,
  buildChapterAssessment,
  normalizeOneWord,
  normalizeSection,
  normalizeWhatILearn,
  normalizePracticeExam,
  countPracticeQuestions,
};
