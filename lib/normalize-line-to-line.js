function normalizeForMatch(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/[?.,!]/g, '')
    .trim()
    .toLowerCase();
}

function questionContainsClue(question, previousAnswer) {
  const q = normalizeForMatch(question);
  const a = normalizeForMatch(previousAnswer);
  if (!q || !a) return false;
  if (q.includes(a)) return true;

  const answerWords = a.split(' ').filter((w) => w.length > 1);
  if (answerWords.length === 0) return false;

  const matched = answerWords.filter((w) => q.includes(w));
  return matched.length >= Math.min(2, answerWords.length) || matched.length === answerWords.length;
}

function validateLineToLineChain(items) {
  const brokenAt = [];
  const list = Array.isArray(items) ? items : [];

  for (let i = 1; i < list.length; i++) {
    if (!questionContainsClue(list[i].question, list[i - 1].answer)) {
      brokenAt.push(i + 1);
    }
  }

  return {
    valid: brokenAt.length === 0 && list.length > 0,
    brokenAt,
    count: list.length,
  };
}

function normalizeLineToLine(lineToLine) {
  if (!lineToLine || !Array.isArray(lineToLine.items)) {
    return lineToLine;
  }

  lineToLine.title = lineToLine.title || 'Line to Line';
  lineToLine.columns = ['Question', 'Answer', 'Next Linked Question'];

  const seen = new Set();
  const items = [];

  for (const raw of lineToLine.items) {
    const question = String(raw.question || '').trim();
    const answer = String(raw.answer || '').trim();
    if (!question || !answer) continue;

    const key = question.replace(/\s+/g, ' ').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    items.push({
      id: items.length + 1,
      question,
      answer,
      next_linked_question: raw.next_linked_question
        ? String(raw.next_linked_question).trim()
        : null,
    });
  }

  for (let i = 0; i < items.length; i++) {
    if (i < items.length - 1) {
      items[i].next_linked_question =
        items[i].next_linked_question || items[i + 1].question;
    } else {
      items[i].next_linked_question = null;
    }
    items[i].id = i + 1;
  }

  lineToLine.items = items;
  lineToLine.total_questions = items.length;
  lineToLine.chain_valid = validateLineToLineChain(items);

  return lineToLine;
}

module.exports = {
  normalizeLineToLine,
  validateLineToLineChain,
  questionContainsClue,
};
