function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const LADDER_CARD_COLORS = ['ladder-card-green', 'ladder-card-peach', 'ladder-card-blue'];

function renderIntroduction(section) {
  const summary =
    section.introduction?.summary ||
    section.knowledge_ladder?.summary ||
    '';
  if (!summary) return '';

  return `
    <section class="block introduction">
      <h3 class="block-label">Introduction</h3>
      <div class="intro-box">💡 ${escapeHtml(summary)}</div>
    </section>`;
}

function renderTrailer(section) {
  const points = section.trailer?.points || [];
  if (!points.length) return '';

  const items = points
    .map((p) => `<li><span class="star">⭐</span> ${escapeHtml(p)}</li>`)
    .join('');

  return `
    <section class="block trailer">
      <h3 class="block-label">🚀 Trailer</h3>
      <ul class="star-list">${items}</ul>
    </section>`;
}

function renderImportanceOfThisTopic(section, langConfig) {
  const block = section.importance_of_this_topic;
  const points = block?.points || [];
  if (!points.length) return '';

  const title =
    block.title ||
    langConfig.importanceOfThisTopic ||
    'Importance of this topic';

  const items = points
    .map((p) => `<li><span class="star">⭐</span> ${escapeHtml(p)}</li>`)
    .join('');

  return `
    <section class="block importance-of-topic">
      <h3 class="block-label">${escapeHtml(title)}</h3>
      <ul class="star-list importance-list">${items}</ul>
    </section>`;
}

function renderKnowledgeLadder(section, langConfig) {
  const kl = section.knowledge_ladder;
  if (!kl?.items?.length) return '';

  const { getSectionTitle } = require('./language');
  const topicOrder = section.order || 1;
  const topicTitle = getSectionTitle(section, langConfig) || 'Introduction';
  const queLabel = langConfig.que || 'Que';

  const cards = kl.items
    .map((item, i) => {
      const num = item.id != null ? item.id : i + 1;
      const colorClass = LADDER_CARD_COLORS[i % LADDER_CARD_COLORS.length];
      return `
      <div class="ladder-card ${colorClass}">
        <span class="ladder-dot" aria-hidden="true"></span>
        <p class="ladder-q">${escapeHtml(queLabel)} ${num} : ${escapeHtml(item.question)}</p>
        <div class="ladder-ans">${escapeHtml(item.answer)}</div>
      </div>`;
    })
    .join('');

  return `
    <section class="block knowledge-ladder">
      <h3 class="block-label">${escapeHtml(langConfig.knowledgeLadder || 'Knowledge Ladder')}</h3>
      <p class="ladder-topic">${escapeHtml(langConfig.topic || 'Topic')} : ${topicOrder} ${escapeHtml(topicTitle)}</p>
      <div class="ladder-grid">${cards}</div>
    </section>`;
}

function renderLineToLine(section, langConfig) {
  const block = section.line_to_line;
  if (!block?.items?.length) return '';

  const { getSectionTitle } = require('./language');
  const topicOrder = section.order || 1;
  const topicTitle = getSectionTitle(section, langConfig) || 'Introduction';
  const queLabel = langConfig.que || 'Que';
  const title = block.title || langConfig.lineToLine || 'Line to Line';

  const rows = block.items
    .map((item, i) => {
      const num = item.id != null ? item.id : i + 1;
      return `
      <tr>
        <td class="l2l-num">${num}</td>
        <td class="l2l-q"><strong>${escapeHtml(queLabel)} ${num}:</strong> ${escapeHtml(item.question)}</td>
        <td class="l2l-a">${escapeHtml(item.answer)}</td>
      </tr>`;
    })
    .join('');

  return `
    <section class="block line-to-line">
      <h3 class="block-label">${escapeHtml(title)}</h3>
      <p class="ladder-topic">${escapeHtml(langConfig.topic || 'Topic')} : ${topicOrder} ${escapeHtml(topicTitle)}</p>
      <p class="l2l-hint">Each answer starts the next question — full topic chain</p>
      <table class="data-table l2l-table">
        <thead><tr><th>#</th><th>Question</th><th>Answer</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

function renderWhatILike(section) {
  const points = section.what_i_like?.points || [];
  if (!points.length) return '';

  const items = points
    .map((p) => `<li><span class="star">⭐</span> ${escapeHtml(p)}</li>`)
    .join('');

  return `
    <section class="block what-i-like">
      <h3 class="block-label">What I Like</h3>
      <ul class="star-list">${items}</ul>
    </section>`;
}

function renderWhatILearn(section, langConfig) {
  const wil = section.what_i_learn;
  if (!wil) return '';

  const { getWhatILearnColumnDefs } = require('./language');
  const defaultCols = getWhatILearnColumnDefs(langConfig.code).map((c) => ({
    code: c.code,
    label_gu: c.label,
    label: c.label,
    meaning: c.meaning,
    key: c.key,
    points: wil[c.key] || [],
  }));

  const columns = wil.columns?.length
    ? wil.columns
    : defaultCols;

  const meaningByKey = Object.fromEntries(
    getWhatILearnColumnDefs(langConfig.code).map((c) => [c.key, c.meaning])
  );

  const cols = columns
    .filter((c) => (c.points || wil[c.key] || []).length)
    .map((col) => {
      const points = col.points?.length ? col.points : wil[col.key] || [];
      const items = points
        .map((p) => `<li><span class="star">⭐</span> ${escapeHtml(p)}</li>`)
        .join('');
      const codeClass = `col-${col.code || col.key}`;
      const meaning = col.meaning || col.meaning_gu || meaningByKey[col.key] || '';
      return `
        <div class="learn-col ${codeClass}">
          <h4>📌 ${escapeHtml(col.label || col.label_gu || col.code)}</h4>
          ${meaning ? `<p class="learn-meaning">${escapeHtml(meaning)}</p>` : ''}
          <ul class="star-list">${items}</ul>
        </div>`;
    })
    .join('');

  if (!cols) return '';

  return `
    <section class="block what-i-learn">
      <h3 class="block-label">${escapeHtml(langConfig.whatILearnTitle || 'What I Learn')}</h3>
      <div class="learn-grid">${cols}</div>
    </section>`;
}

function renderOneWord(section) {
  const items = section.one_word?.items || [];
  if (!items.length) return '';

  const rows = items
    .map(
      (item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(item.question)}</td>
        <td>${escapeHtml(item.answer)}</td>
      </tr>`
    )
    .join('');

  const total = section.one_word.total_questions || items.length;

  return `
    <section class="block one-word">
      <h3 class="block-label">One Word Answer <span class="badge-count">${total} Questions</span></h3>
      <table class="data-table">
        <thead><tr><th>#</th><th>Question</th><th>Answer</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </section>`;
}

function questionId(q, index) {
  return q?.id != null && q.id !== '' ? q.id : index + 1;
}

function questionText(q) {
  if (typeof q === 'string') return q.trim();
  return String(
    q?.question ?? q?.text ?? q?.statement ?? q?.prompt ?? q?.q ?? ''
  ).trim();
}

function hasAnswer(q) {
  if (!q) return false;
  const answer = q.answer;
  if (answer === true || answer === false) return true;
  if (Array.isArray(answer)) {
    return answer.some((p) => {
      const t = String(p || '').trim();
      if (!t) return false;
      return !/^(p|pt|point|points|ans|answer|line|reason|કારણ|પોઈન્ટ|પોઇન્ટ|જવાબ)\s*[-.:)]*\s*\d+$/i.test(t)
        && !/^(વાર્તાનું નામ|story name|placeholder|\.{2,}|…+)$/i.test(t);
    });
  }
  const text = String(answer ?? '').trim();
  if (!text) return false;
  if (/^(p|pt|point|કારણ|પોઈન્ટ)\s*[-.:)]*\s*\d+$/i.test(text)) return false;
  if (/^(વાર્તાનું નામ|n\/?a|nil|none|-)$/i.test(text)) return false;
  return true;
}

function renderMcq(questions) {
  if (!questions?.length) return '';
  return questions
    .map((q, i) => {
      const text = questionText(q);
      if (!text || !hasAnswer(q)) return '';
      const opts = (q.options || [])
        .map((o) => `<li>${escapeHtml(o)}</li>`)
        .join('');
      const ans = `<p class="ans">Ans: ${escapeHtml(String(q.answer))}</p>`;
      return `
        <div class="exam-q">
          <p><strong>${questionId(q, i)}.</strong> ${escapeHtml(text)}</p>
          <ul class="options">${opts}</ul>
          ${ans}
        </div>`;
    })
    .filter(Boolean)
    .join('');
}

function formatAnswerPoints(answer) {
  const points = Array.isArray(answer)
    ? answer.map((p) => String(p).trim()).filter((p) => p && hasAnswer({ answer: p }))
    : String(answer || '')
        .split(/\n+/)
        .map((p) => p.trim())
        .filter((p) => p && hasAnswer({ answer: p }));
  if (!points.length) return '';
  return `<ul class="answer-points">${points.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>`;
}

function renderDescriptiveQuestions(title, questions) {
  if (!questions?.length) return '';
  const items = questions
    .map((q, i) => {
      const text = questionText(q);
      if (!text || !hasAnswer(q)) return '';
      const ans = formatAnswerPoints(q.answer);
      if (!ans) return '';
      return `<div class="exam-q"><p><strong>${questionId(q, i)}.</strong> ${escapeHtml(text)}</p>${ans}</div>`;
    })
    .filter(Boolean)
    .join('');
  if (!items) return '';
  return `<div class="exam-section"><h4>${escapeHtml(title)}</h4>${items}</div>`;
}

function renderSimpleQuestions(title, questions, showAnswer = true) {
  if (!questions?.length) return '';
  const items = questions
    .map((q, i) => {
      const text = questionText(q);
      if (!text || !hasAnswer(q)) return '';
      const ans =
        showAnswer
          ? `<p class="ans">Ans: ${escapeHtml(String(q.answer))}</p>`
          : '';
      return `<div class="exam-q"><p><strong>${questionId(q, i)}.</strong> ${escapeHtml(text)}</p>${ans}</div>`;
    })
    .filter(Boolean)
    .join('');
  if (!items) return '';
  return `<div class="exam-section"><h4>${escapeHtml(title)}</h4>${items}</div>`;
}

function renderOneWordBlock(oneWord) {
  const items = (oneWord?.items || []).filter((item) => item?.question && hasAnswer(item));
  if (!items.length) return '';

  const total = items.length;
  const hasOptions = items.some((q) => q.options?.length);

  if (hasOptions) {
    return `<div class="exam-section"><h4>One Word Answer — 4 Option set (${total})</h4>${renderMcq(items)}</div>`;
  }

  const rows = items
    .map(
      (item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(item.question)}</td>
        <td>${escapeHtml(item.answer)}</td>
      </tr>`
    )
    .join('');

  return `
    <div class="exam-section">
      <h4>One Word Answer (${total})</h4>
      <table class="data-table">
        <thead><tr><th>#</th><th>Question</th><th>Answer</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderPracticeExam(section) {
  const pe = section.practice_examination;
  if (!pe?.sections && !pe?.parts) return '';

  const parts = pe.parts || {};
  const obj = parts.objective || {};
  const sub = parts.subjective || {};
  const s = pe.sections || {};

  const oneWord = obj.one_word || section.one_word;
  const mcq = obj.mcq || s.mcq;
  const fillBlanks = obj.fill_blanks || s.fill_blanks;
  const trueFalse = obj.true_false || s.true_false;
  const match = obj.match || s.match;
  const oneMark = sub.one_mark || s.descriptive?.one_mark;
  const twoMarks = sub.two_marks || s.descriptive?.two_marks;
  const threeMarks = sub.three_marks || s.descriptive?.three_marks;
  const fourMarks = sub.four_marks || s.descriptive?.four_marks;
  const fiveMarks = sub.five_marks || s.descriptive?.five_marks;

  let objectiveBody = '';
  let subjectiveBody = '';

  if (oneWord?.items?.length) {
    objectiveBody += renderOneWordBlock(oneWord);
  }
  if (mcq?.questions?.length) {
    objectiveBody += `<div class="exam-section"><h4>MCQ — 4 Option set (${mcq.total || mcq.questions.length})</h4>${renderMcq(mcq.questions)}</div>`;
  }
  if (fillBlanks?.questions?.length) {
    const hasOptions = fillBlanks.questions.some((q) => q.options?.length);
    if (hasOptions) {
      objectiveBody += `<div class="exam-section"><h4>Fill in the Blank — 4 Option set (${fillBlanks.total || fillBlanks.questions.length})</h4>${renderMcq(fillBlanks.questions)}</div>`;
    } else {
      objectiveBody += renderSimpleQuestions('Fill in the Blank', fillBlanks.questions);
    }
  }
  if (trueFalse?.questions?.length) {
    const rows = trueFalse.questions
      .filter((q) => q?.question && (q.answer === true || q.answer === false || q.answer === 'True' || q.answer === 'False' || q.answer === 'સાચું' || q.answer === 'ખોટું'))
      .map((q, i) => {
        const ans =
          q.answer === true || q.answer === 'True' || q.answer === 'સાચું'
            ? 'True / સાચું'
            : 'False / ખોટું';
        return `<tr><td>${q.id ?? i + 1}</td><td>${escapeHtml(q.question || '')}</td><td class="ans">${escapeHtml(ans)}</td></tr>`;
      })
      .join('');
    if (rows) {
      objectiveBody += `
      <div class="exam-section">
        <h4>True / False — સાચું / ખોટું (${trueFalse.total || trueFalse.questions.length})</h4>
        <table class="data-table"><thead><tr><th>#</th><th>Statement</th><th>Answer</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
    }
  }
  if (match?.questions?.length) {
    const matchTitle = match.title || 'જોડકા જોડો (Jodka Jodo)';
    for (const q of match.questions) {
      if (!q?.answer) continue;
      const colA = (q.column_a || []).map((c) => `<li>${escapeHtml(c)}</li>`).join('');
      const colB = (q.column_b || []).map((c) => `<li>${escapeHtml(c)}</li>`).join('');
      objectiveBody += `
        <div class="exam-section">
          <h4>${escapeHtml(matchTitle)}</h4>
          <p>${escapeHtml(q.question || 'નીચેના પદોને સાચી જોડીમાં મેળવો.')}</p>
          <div class="match-cols"><div><strong>Left (A, B)</strong><ul>${colA}</ul></div><div><strong>Right (1, 2)</strong><ul>${colB}</ul></div></div>
          <p class="ans">Ans: ${escapeHtml(q.answer)}</p>
        </div>`;
    }
  }

  for (const [block, label, marks] of [
    [oneMark, '1 Mark questions', 1],
    [twoMarks, '2 Marks questions', 2],
    [threeMarks, '3 Marks questions', 3],
    [fourMarks, '4 Marks questions', 4],
    [fiveMarks, '5 Marks questions', 5],
  ]) {
    if (block?.questions?.length) {
      const total = block.total || block.questions.length;
      const m = block.marks_per_question || marks;
      subjectiveBody += renderDescriptiveQuestions(
        `${label} (${total} × ${m} mark${m > 1 ? 's' : ''} — ${m} line answer)`,
        block.questions
      );
    }
  }

  if (!objectiveBody && !subjectiveBody) return '';

  const objTitle = obj.title || 'Objective';
  const subTitle = sub.title || 'Subjective';
  const objCount = pe.objective_questions ?? '—';
  const subCount = pe.subjective_questions ?? '—';

  return `
    <section class="block practice-exam">
      <h3 class="block-label">P R A C T I C E &nbsp; E X A M I N A T I O N</h3>
      <h4 class="exam-title">${escapeHtml(pe.title || section.title_gu || '')}</h4>
      <p class="exam-meta">Total Questions: ${pe.total_questions || '—'} (Objective: ${objCount}, Subjective: ${subCount})</p>
      ${objectiveBody ? `<div class="exam-part"><h3 class="exam-part-title">Part I — ${escapeHtml(objTitle)}</h3>${objectiveBody}</div>` : ''}
      ${subjectiveBody ? `<div class="exam-part"><h3 class="exam-part-title">Part II — ${escapeHtml(subTitle)}</h3>${subjectiveBody}</div>` : ''}
    </section>`;
}

function renderSection(section, chapterTitle, langConfig) {
  const { getSectionTitle } = require('./language');
  const heading = getSectionTitle(section, langConfig) || `Section ${section.order || ''}`;

  return `
    <article class="material-section" id="section-${escapeHtml(section.id || section.order)}">
      <header class="section-header">
        <h2>${escapeHtml(chapterTitle)}</h2>
        <p class="section-title">${escapeHtml(heading)}</p>
      </header>
      ${renderIntroduction(section)}
      ${renderTrailer(section)}
      ${renderImportanceOfThisTopic(section, langConfig)}
      ${renderKnowledgeLadder(section, langConfig)}
      ${renderLineToLine(section, langConfig)}
      ${renderWhatILike(section)}
      ${renderWhatILearn(section, langConfig)}
      ${renderOneWord(section)}
      ${renderPracticeExam(section)}
    </article>`;
}

function buildHtmlStyles(langConfig) {
  return `
  :root {
    --blue: #2563eb;
    --purple: #e9d5ff;
    --orange: #ffedd5;
    --sky: #dbeafe;
    --yellow-bg: #fef9c3;
    --intro-bg: #eff6ff;
    --border: #cbd5e1;
    --text: #1e293b;
    --muted: #64748b;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: ${langConfig.fontFamily};
    color: var(--text);
    background: #f8fafc;
    line-height: 1.6;
  }
  .page { max-width: 960px; margin: 0 auto; padding: 1.5rem; }
  .page-title {
    color: var(--blue);
    font-size: 1.75rem;
    margin: 0 0 0.25rem;
    border-bottom: 2px solid var(--blue);
    padding-bottom: 0.5rem;
  }
  .meta { color: var(--muted); font-size: 0.9rem; margin-bottom: 2rem; }
  .material-section {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .section-header h2 { color: var(--blue); margin: 0; font-size: 1.35rem; }
  .section-title { color: var(--muted); margin: 0.25rem 0 1.25rem; }
  .block { margin-bottom: 1.75rem; }
  .block-label {
    font-size: 1.05rem;
    margin: 0 0 0.75rem;
    color: #334155;
  }
  .intro-box {
    background: var(--intro-bg);
    border: 1px solid #93c5fd;
    border-radius: 8px;
    padding: 1rem 1.25rem;
  }
  .star-list { list-style: none; padding: 0; margin: 0; }
  .star-list li {
    background: var(--yellow-bg);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.4rem;
  }
  .star { margin-right: 0.35rem; }
  .importance-of-topic .importance-list li {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
  }
  .l2l-hint {
    color: var(--muted);
    font-size: 0.9rem;
    margin: -0.5rem 0 1rem;
  }
  .l2l-table td.l2l-a {
    color: #15803d;
    font-weight: 600;
    white-space: nowrap;
  }
  .l2l-table td.l2l-num { width: 2.5rem; text-align: center; }
  .ladder-topic {
    text-align: center;
    font-weight: 700;
    font-size: 1.1rem;
    color: #334155;
    margin: 0 0 1.25rem;
  }
  .ladder-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
  }
  .ladder-card {
    border-radius: 16px;
    padding: 1.25rem 1rem 1rem;
    position: relative;
    min-height: 150px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }
  .ladder-card-green { background: #d9f0d9; }
  .ladder-card-peach { background: #fde8d0; }
  .ladder-card-blue { background: #d6ebfc; }
  .ladder-dot {
    position: absolute;
    top: 12px;
    left: 12px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #bdbdbd;
    border: 2px solid #9e9e9e;
  }
  .ladder-q {
    margin: 0.5rem 0.75rem 1rem;
    font-size: 0.95rem;
    color: #37474f;
    flex: 1;
    line-height: 1.5;
  }
  .ladder-ans {
    background: #fff;
    border-radius: 12px;
    padding: 0.75rem 1rem;
    font-weight: 700;
    width: calc(100% - 0.5rem);
    margin-top: auto;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    color: #1e293b;
  }
  @media (max-width: 900px) {
    .ladder-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 560px) {
    .ladder-grid { grid-template-columns: 1fr; }
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }
  .data-table th {
    background: #f1f5f9;
    text-align: left;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--border);
  }
  .data-table td {
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--border);
    vertical-align: top;
  }
  .data-table td:last-child {
    font-weight: 600;
    background: #fafafa;
  }
  .learn-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }
  .learn-col {
    border-radius: 10px;
    padding: 1rem;
    border: 1px solid var(--border);
  }
  .learn-col.col-32, .learn-col.col-gun { background: var(--purple); }
  .learn-col.col-64, .learn-col.col-kala { background: var(--orange); }
  .learn-col.col-16, .learn-col.col-sanskar { background: var(--sky); }
  .learn-col h4 { margin: 0 0 0.35rem; font-size: 1rem; }
  .learn-col .learn-meaning {
    margin: 0 0 0.75rem;
    font-size: 0.78rem;
    font-weight: 600;
    opacity: 0.9;
    line-height: 1.35;
  }
  .learn-col .star-list li { background: rgba(255,255,255,0.65); }
  .badge-count {
    font-size: 0.8rem;
    background: #e2e8f0;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-weight: 500;
  }
  .exam-title { color: var(--blue); margin: 0.5rem 0; }
  .exam-meta { color: var(--muted); font-size: 0.9rem; }
  .exam-section { margin-top: 1.25rem; }
  .exam-section h4 { margin: 0 0 0.75rem; color: #475569; }
  .exam-q {
    border-left: 3px solid #94a3b8;
    padding: 0.5rem 0 0.5rem 0.75rem;
    margin-bottom: 0.75rem;
  }
  .exam-q .options { margin: 0.35rem 0; padding-left: 1.25rem; }
  .ans { color: #15803d; font-size: 0.9rem; margin: 0.25rem 0 0; }
  .match-cols { display: flex; gap: 2rem; flex-wrap: wrap; }
  .answer-points { margin: 0.35rem 0 0; padding-left: 1.25rem; color: var(--muted); }
  .exam-part { margin-top: 1.25rem; padding-top: 0.5rem; border-top: 2px solid var(--border); }
  .exam-part-title { font-size: 1.05rem; color: var(--blue); margin: 0 0 0.75rem; }
  .section-sub { color: var(--muted); margin: -0.25rem 0 0.75rem; }
  @media print {
    body { background: #fff; }
    .material-section { box-shadow: none; page-break-inside: avoid; }
    .ladder-grid { grid-template-columns: repeat(3, 1fr); }
  }
`;
}

function collectMaterialText(material) {
  const parts = [];
  for (const section of material.sections || []) {
    for (const item of section.knowledge_ladder?.items || []) {
      parts.push(item.question, item.answer);
    }
    parts.push(section.introduction?.summary);
    for (const p of section.trailer?.points || []) parts.push(p);
  }
  return parts.filter(Boolean).join('\n');
}

function materialJsonToHtml(material) {
  const { normalizeSection } = require('./material-format-spec');
  const { getHtmlLanguageConfig, resolveChapterLanguage, normalizeLanguageCode } = require('./language');
  const meta = material.meta || {};
  const title = meta.title || 'Material';
  const language = meta.language
    ? normalizeLanguageCode(meta.language)
    : normalizeLanguageCode(resolveChapterLanguage({ meta, content: { full_text: collectMaterialText(material) } }));
  const langConfig = getHtmlLanguageConfig(language);
  const sections = (material.sections || []).map((section, index) =>
    normalizeSection({ ...section }, section.order || index + 1, language)
  );

  const sectionsHtml = sections
    .map((s) => renderSection(s, title, langConfig))
    .join('\n');

  const styles = buildHtmlStyles(langConfig);

  return `<!DOCTYPE html>
<html lang="${escapeHtml(langConfig.htmlLang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — Material</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="${langConfig.fontUrl}" rel="stylesheet">
  <style>${styles}</style>
</head>
<body>
  <div class="page">
    <h1 class="page-title">${escapeHtml(title)}</h1>
    <p class="meta">
      ${meta.generated_by === 'ai' ? 'AI Generated' : 'Material'}
      ${meta.total_sections ? ` · ${meta.total_sections} section(s)` : ''}
      ${meta.generated_at ? ` · ${escapeHtml(meta.generated_at)}` : ''}
    </p>
    ${sectionsHtml || '<p>No sections found.</p>'}
  </div>
</body>
</html>`;
}

module.exports = { materialJsonToHtml, escapeHtml };
