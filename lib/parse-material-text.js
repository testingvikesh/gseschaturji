const { splitParagraphs } = require('./utils');
const { normalizeWhatILearn } = require('./material-format-spec');

function parseMaterialText(fullText, meta) {
  const sections = [];
  const blocks = fullText.split(/(?=🚀\s*Trailer)/g).filter(Boolean);

  let mainBlock = fullText;
  if (blocks.length > 1) {
    mainBlock = blocks.join('\n');
  }

  const sectionChunks = mainBlock.split(/(?=🚀\s*Trailer)/g).filter((c) => c.trim());

  sectionChunks.forEach((chunk, index) => {
    const section = parseSectionBlock(chunk, index + 1);
    if (section) {
      sections.push(section);
    }
  });

  if (sections.length === 0 && fullText.trim()) {
    sections.push({
      id: 'section-1',
      order: 1,
      title: meta.title,
      raw_text: fullText.trim(),
    });
  }

  return {
    meta: {
      type: 'material',
      id: meta.slug,
      title: meta.title,
      language: meta.language || 'gu',
      source_file: meta.sourceFile,
      total_sections: sections.length,
      generated_at: new Date().toISOString(),
      material_types: [
        'trailer',
        'knowledge_ladder',
        'what_i_like',
        'what_i_learn',
        'one_word',
        'practice_examination',
      ],
    },
    sections,
  };
}

function parseSectionBlock(chunk, order) {
  const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return null;
  }

  const titleLine = lines.find((l) => l.includes('અમાર') || l.includes('Introduction') || l.includes('ભાષા'));
  const sectionTitle = extractSectionTitle(lines) || titleLine || `Section ${order}`;

  const section = {
    id: `section-${order}`,
    order,
    title: sectionTitle,
    trailer: parseTrailer(chunk),
    knowledge_ladder: parseKnowledgeLadder(chunk),
    what_i_like: parseBulletBlock(chunk, 'What I Like'),
    what_i_learn: parseWhatILearn(chunk),
    one_word: parseOneWord(chunk),
    practice_examination: parsePracticeExam(chunk),
    raw_text: chunk.trim(),
  };

  return section;
}

function extractSectionTitle(lines) {
  for (const line of lines) {
    if (line.startsWith('🪬')) {
      const next = lines[lines.indexOf(line) + 1];
      if (next && !next.startsWith('⭐') && !next.startsWith('💡')) {
        return next;
      }
    }
  }
  return null;
}

function parseTrailer(chunk) {
  const match = chunk.match(/🚀\s*Trailer([\s\S]*?)(?=🪬|What I Like|$)/);
  if (!match) {
    return { points: [] };
  }

  const points = [];
  const block = match[1];
  const starLines = block.match(/⭐[^\n⭐]+/g) || [];

  starLines.forEach((line) => {
    const cleaned = line.replace(/^⭐\s*/, '').trim();
    cleaned.split(/\t+/).forEach((part) => {
      const p = part.trim();
      if (p) {
        points.push(p);
      }
    });
  });

  return { points };
}

function isKnowledgeLadderNoise(line) {
  if (!line) {
    return true;
  }
  if (/^[🚀🪬⭐💡📌]/.test(line)) {
    return true;
  }
  if (/^Page\s+\d+/i.test(line)) {
    return true;
  }
  if (/^Knowledge Ladder$/i.test(line)) {
    return true;
  }
  if (/^Introduction$/i.test(line)) {
    return true;
  }
  return false;
}

function isQuestionEnd(line) {
  return /\?$/.test(line) || /\.{2,}$/.test(line);
}

function finalizeQuestion(parts) {
  return parts
    .join(' ')
    .replace(/\.{2,}$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeAnswer(line) {
  if (isKnowledgeLadderNoise(line) || isQuestionEnd(line)) {
    return false;
  }
  return line.length <= 80;
}

function parseKnowledgeLadder(chunk) {
  const match = chunk.match(/🪬\s*Knowledge Ladder([\s\S]*?)(?=What I Like|One Word|P R A C T I C E|$)/);
  if (!match) {
    return { summary: '', columns: ['Question', 'Answer'], items: [] };
  }

  const block = match[1];
  const summaryMatch = block.match(/💡\s*([^\n]+)/);
  const summary = summaryMatch ? summaryMatch[1].trim() : '';

  const items = [];
  const lines = block
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !isKnowledgeLadderNoise(l));

  const summaryIdx = lines.findIndex((l) => l.startsWith('💡'));
  const contentLines = summaryIdx >= 0 ? lines.slice(summaryIdx + 1) : lines;

  let questionParts = [];

  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i];

    if (questionParts.length === 0 && !isQuestionEnd(line)) {
      questionParts.push(line);
      continue;
    }

    if (questionParts.length > 0) {
      questionParts.push(line);
    } else {
      questionParts = [line];
    }

    if (!isQuestionEnd(line)) {
      continue;
    }

    const question = finalizeQuestion(questionParts);
    questionParts = [];

    const answer = contentLines[i + 1];
    if (!looksLikeAnswer(answer)) {
      continue;
    }

    items.push({ question, answer: answer.trim() });
    i++;
  }

  return {
    summary,
    columns: ['Question', 'Answer'],
    items,
  };
}

function parseBulletBlock(chunk, heading) {
  const regex = new RegExp(`${heading}([\\s\\S]*?)(?=What I Learn|One Word|P R A C T I C E|📌|$)`);
  const match = chunk.match(regex);
  if (!match) {
    return { points: [] };
  }

  const points = [];
  (match[1].match(/⭐[^\n⭐]+/g) || []).forEach((line) => {
    line
      .replace(/^⭐\s*/, '')
      .split(/\t+/)
      .forEach((part) => {
        const p = part.trim();
        if (p) {
          points.push(p);
        }
      });
  });

  return { points };
}

function parseWhatILearn(chunk) {
  const match = chunk.match(/What I Learn([\s\S]*?)(?=One Word|P R A C T I C E|સહજીવન|$)/);
  if (!match) {
    return normalizeWhatILearn({ gun: [], kala: [], sanskar: [] });
  }

  const block = match[1];
  return normalizeWhatILearn({
    gun: extractPinBlock(block, '32'),
    kala: extractPinBlock(block, '64'),
    sanskar: extractPinBlock(block, '16'),
  });
}

function extractPinBlock(text, label) {
  const regex = new RegExp(`📌\\s*${label}[\\s\\S]*?(?=📌|One Word|$)`);
  const match = text.match(regex);
  if (!match) {
    return [];
  }

  return (match[0].match(/⭐[^\n⭐]+/g) || [])
    .map((l) => l.replace(/^⭐\s*/, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function parseOneWord(chunk) {
  const match = chunk.match(/One Word[\s\S]*?(\d+\s*Questions)([\s\S]*?)(?=P R A C T I C E|Page \d+ of \d+\s*$|$)/);
  if (!match) {
    return { total_questions: 0, items: [] };
  }

  const totalMatch = match[1].match(/(\d+)/);
  const block = match[2];
  const items = [];

  block.split('\n').forEach((line) => {
    const parts = line.split('\t').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && parts[0].includes('?')) {
      items.push({ question: parts[0], answer: parts[parts.length - 1] });
    }
  });

  return {
    total_questions: totalMatch ? Number(totalMatch[1]) : items.length,
    items,
  };
}

function parsePracticeExam(chunk) {
  const match = chunk.match(/P R A C T I C E E X A M I N A T I O N([\s\S]*?)(?=🚀 Trailer|Page \d+ of \d+\s*--|$)/);
  if (!match) {
    return null;
  }

  const block = match[1];
  const titleMatch = block.match(/^([^\n]+)/);
  const totalMatch = block.match(/Total Questions:\s*(\d+)/);

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    total_questions: totalMatch ? Number(totalMatch[1]) : null,
    raw_text: block.trim(),
  };
}

module.exports = { parseMaterialText, splitParagraphs };
