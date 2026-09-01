const KNOWLEDGE_LADDER_COUNT = 10;

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

function validateKnowledgeLadderChain(items) {
  const brokenAt = [];

  for (let i = 1; i < items.length; i++) {
    if (!questionContainsClue(items[i].question, items[i - 1].answer)) {
      brokenAt.push(i + 1);
    }
  }

  return {
    valid: brokenAt.length === 0 && items.length === KNOWLEDGE_LADDER_COUNT,
    brokenAt,
    count: items.length,
  };
}

function normalizeKnowledgeLadder(knowledgeLadder) {
  if (!knowledgeLadder || !Array.isArray(knowledgeLadder.items)) {
    return knowledgeLadder;
  }

  knowledgeLadder.columns = ['Question', 'Answer', 'Next Linked Question'];

  const seen = new Set();
  const items = [];

  for (const raw of knowledgeLadder.items) {
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

    if (items.length >= KNOWLEDGE_LADDER_COUNT) break;
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

  knowledgeLadder.items = items;
  knowledgeLadder.total_questions = items.length;
  knowledgeLadder.chain_valid = validateKnowledgeLadderChain(items);

  return knowledgeLadder;
}

module.exports = {
  KNOWLEDGE_LADDER_COUNT,
  normalizeKnowledgeLadder,
  validateKnowledgeLadderChain,
  questionContainsClue,
};
