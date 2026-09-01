async function ocrImageWithGoogleVision(imageBuffer, apiKey, languageHints = ['hi', 'gu', 'en']) {
  if (!apiKey) {
    throw new Error('Google Vision API key is not configured.');
  }

  const base64 = Buffer.from(imageBuffer).toString('base64');
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          imageContext: { languageHints },
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const msg = data.error?.message || response.statusText;
    throw new Error(`Google Vision OCR failed (${response.status}): ${msg}`);
  }

  const annotation = data.responses?.[0];
  if (annotation?.error) {
    throw new Error(`Google Vision OCR error: ${annotation.error.message}`);
  }

  const text =
    annotation?.fullTextAnnotation?.text ||
    annotation?.textAnnotations?.[0]?.description ||
    '';

  return text.trim();
}

async function ocrPagesWithGoogleVision(pages, apiKey, languageHints) {
  const results = [];

  for (const page of pages) {
    const pageNum = page.pageNumber ?? page.num ?? results.length + 1;
    process.stderr.write(`Google Vision OCR page ${pageNum}/${pages.length}...\n`);

    const text = await ocrImageWithGoogleVision(Buffer.from(page.data), apiKey, languageHints);
    results.push({ page: pageNum, text });
  }

  return results;
}

module.exports = { ocrImageWithGoogleVision, ocrPagesWithGoogleVision };
