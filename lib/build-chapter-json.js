const { splitParagraphs } = require('./utils');

function buildChapterJson({ meta, extracted }) {
  const paragraphs = splitParagraphs(extracted.fullText);

  return {
    meta: {
      type: 'chapter',
      id: meta.slug,
      title: meta.title,
      title_en: meta.titleEn || null,
      language: meta.language || 'en',
      source_file: meta.sourceFile,
      page_count: extracted.pageCount,
      extraction_method: extracted.method,
      generated_at: new Date().toISOString(),
      pdf_metadata: extracted.metadata,
    },
    content: {
      full_text: extracted.fullText,
      paragraphs,
      pages: extracted.pages,
    },
  };
}

module.exports = { buildChapterJson };
