#!/usr/bin/env node
/**
 * Process Chapter / Material PDF → JSON
 * Usage: node process-pdf.js <file.pdf> [--type chapter|material] [--out dir]
 */
const fs = require('fs');
const path = require('path');
const { parsePdfFilename, ensureDir } = require('./lib/utils');
const { loadConfig } = require('./lib/config');
const { extractPdfContent } = require('./lib/extract-pdf');
const { buildChapterJson } = require('./lib/build-chapter-json');
const { parseMaterialText } = require('./lib/parse-material-text');
const { detectLanguage, detectLanguageFromPdfMetadata } = require('./lib/language');

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help')) {
    console.log('Usage: node process-pdf.js <file.pdf> [--type chapter|material] [--out output-dir]');
    process.exit(args.includes('--help') ? 0 : 1);
  }

  const pdfPath = path.resolve(args[0]);
  const typeFlag = getFlag(args, '--type');
  const nameFlag = getFlag(args, '--name');
  const outDir = path.resolve(getFlag(args, '--out') || path.join(__dirname, 'output'));

  if (!fs.existsSync(pdfPath)) {
    fail(`File not found: ${pdfPath}`);
  }

  const filename = nameFlag || path.basename(pdfPath);
  const parsed = parsePdfFilename(filename);
  const fileType = typeFlag || parsed.type;

  ensureDir(outDir);

  const appConfig = loadConfig();
  const buffer = fs.readFileSync(pdfPath);
  process.stderr.write(`Extracting: ${filename} (${fileType})\n`);

  const extracted = await extractPdfContent(buffer, {
    ocrProvider: appConfig.ocr.provider,
    googleVisionApiKey: appConfig.ocr.google_vision_api_key,
    languageHints: appConfig.ocr.language_hints,
    ocrLang: appConfig.ocr.language,
    scale: appConfig.ocr.scale,
  });
  process.stderr.write(`Method: ${extracted.method}, pages: ${extracted.pageCount}, chars: ${extracted.fullText.length}\n`);

  const fromPdfMeta = detectLanguageFromPdfMetadata(extracted.metadata);
  const fromText = detectLanguage(extracted.fullText);
  const detectedLanguage = fromPdfMeta || fromText;
  process.stderr.write(`Detected language: ${detectedLanguage} (pdf meta: ${fromPdfMeta || '—'}, text: ${fromText})\n`);

  const baseMeta = {
    slug: parsed.slug,
    title: parsed.title,
    sourceFile: filename,
    language: detectedLanguage,
  };

  let result;
  let outName;

  if (fileType === 'material') {
    result = parseMaterialText(extracted.fullText, baseMeta);
    result.meta.extraction_method = extracted.method;
    result.meta.page_count = extracted.pageCount;
    outName = `${parsed.slug}-material.json`;
  } else {
    result = buildChapterJson({ meta: baseMeta, extracted });
    outName = `${parsed.slug}-chapter.json`;
  }

  const outPath = path.join(outDir, outName);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');

  const response = {
    success: true,
    type: fileType,
    slug: parsed.slug,
    title: parsed.title,
    extraction_method: extracted.method,
    page_count: extracted.pageCount,
    output_file: outPath,
    output_name: outName,
  };

  console.log(JSON.stringify(response));
}

function getFlag(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return null;
  }
  return args[index + 1] || null;
}

function fail(message) {
  console.error(JSON.stringify({ success: false, error: message }));
  process.exit(1);
}

main().catch((err) => {
  fail(err.message || String(err));
});
