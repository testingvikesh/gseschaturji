const { PDFParse } = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { ocrPagesWithGoogleVision } = require('./ocr-google-vision');

const MIN_TEXT_CHARS = 80;
const PAGE_MARKER = /^--\s*\d+\s+of\s+\d+\s*--$/i;

function isMeaningfulText(fullText, pages) {
  const withoutMarkers = fullText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !PAGE_MARKER.test(l))
    .join('\n')
    .trim();

  if (withoutMarkers.length < 40) {
    return false;
  }

  if (pages.length > 0) {
    const withContent = pages.filter((p) => (p.text || '').replace(/\s+/g, '').length > 15);
    if (withContent.length === 0) {
      return false;
    }
  }

  return true;
}

const { getDefaultOcrHints, getDefaultTesseractLang } = require('./language');

async function runOcr(shotPages, options) {
  const provider = (options.ocrProvider || 'tesseract').toLowerCase();

  if (provider === 'google_vision' || provider === 'google') {
    const ocrPages = await ocrPagesWithGoogleVision(
      shotPages,
      options.googleVisionApiKey,
      options.languageHints || getDefaultOcrHints()
    );
    return { ocrPages, method: 'ocr_google_vision' };
  }

  const ocrLang = options.ocrLang ?? getDefaultTesseractLang();
  const ocrPages = [];
  for (const page of shotPages) {
    const pageNum = page.pageNumber ?? page.num ?? ocrPages.length + 1;
    process.stderr.write(`Tesseract OCR page ${pageNum}/${shotPages.length}...\n`);

    const result = await Tesseract.recognize(Buffer.from(page.data), ocrLang, {
      logger: () => {},
    });

    ocrPages.push({ page: pageNum, text: (result.data.text || '').trim() });
  }

  return { ocrPages, method: 'ocr_tesseract' };
}

async function extractPdfContent(buffer, options = {}) {
  const minText = options.minTextLength ?? MIN_TEXT_CHARS;
  const parser = new PDFParse({ data: buffer, verbosity: 0 });

  try {
    const info = await parser.getInfo();
    const textResult = await parser.getText();
    const pageTexts = normalizePages(textResult);
    const fullText = (textResult.text || pageTexts.map((p) => p.text).join('\n\n')).trim();

    if (fullText.length >= minText && isMeaningfulText(fullText, pageTexts)) {
      return {
        method: 'text',
        pageCount: pageTexts.length || info.total || 0,
        fullText,
        pages: pageTexts,
        metadata: pickMetadata(info),
      };
    }

    process.stderr.write(`Using OCR provider: ${options.ocrProvider || 'tesseract'}\n`);

    const screenshots = await parser.getScreenshot({
      scale: options.scale ?? 2,
      imageBuffer: true,
    });

    const shotPages = screenshots.pages || [];
    if (shotPages.length === 0) {
      throw new Error('PDF has no extractable text and screenshot rendering failed.');
    }

    const { ocrPages, method } = await runOcr(shotPages, options);
    const parts = ocrPages.map((p) => p.text).filter(Boolean);

    return {
      method,
      pageCount: shotPages.length,
      fullText: parts.join('\n\n').trim(),
      pages: ocrPages,
      metadata: pickMetadata(info),
    };
  } finally {
    await parser.destroy();
  }
}

function normalizePages(textResult) {
  if (!textResult.pages?.length) {
    return [];
  }

  return textResult.pages.map((page, index) => ({
    page: page.num ?? page.pageNumber ?? index + 1,
    text: (page.text || '').trim(),
  }));
}

function pickMetadata(info) {
  const meta = info.info || info.metadata || {};
  return {
    title: meta.Title || meta.title || null,
    author: meta.Author || meta.author || null,
    creator: meta.Creator || meta.creator || null,
    producer: meta.Producer || meta.producer || null,
  };
}

module.exports = { extractPdfContent, MIN_TEXT_CHARS, isMeaningfulText };
