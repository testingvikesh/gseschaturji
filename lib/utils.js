const fs = require('fs');
const path = require('path');

function parsePdfFilename(filename) {
  const base = path.basename(filename, '.pdf');
  const chapterMatch = base.match(/^Chapter[-_\s]+(.+)$/i);
  const materialMatch = base.match(/^Material[-_\s]+(.+)$/i);

  if (chapterMatch) {
    return { type: 'chapter', title: chapterMatch[1].trim(), slug: slugify(chapterMatch[1]) };
  }
  if (materialMatch) {
    return { type: 'material', title: materialMatch[1].trim(), slug: slugify(materialMatch[1]) };
  }

  return { type: 'chapter', title: base.trim(), slug: slugify(base) };
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\u0A80-\u0AFF\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'chapter';
}

function splitParagraphs(text) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

module.exports = { parsePdfFilename, slugify, splitParagraphs, ensureDir };
