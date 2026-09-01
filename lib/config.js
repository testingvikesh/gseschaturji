const fs = require('fs');
const path = require('path');

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  let fileConfig = {};

  if (fs.existsSync(configPath)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      // ignore invalid config
    }
  }

  const ai = fileConfig.ai || {};
  const ocr = fileConfig.ocr || {};

  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.AI_API_KEY ||
    ai.api_key ||
    '';

  const model =
    process.env.OPENAI_AI_MODEL ||
    process.env.AI_MODEL ||
    process.env.OPENAI_MODEL ||
    ai.model ||
    'gpt-4o-mini';

  const ocrProvider =
    process.env.OCR_PROVIDER ||
    ocr.provider ||
    'tesseract';

  const googleVisionKey =
    process.env.GOOGLE_VISION_API_KEY ||
    ocr.google_vision_api_key ||
    '';

  const languageHints = process.env.OCR_LANGUAGE_HINTS
    ? process.env.OCR_LANGUAGE_HINTS.split(',').map((h) => h.trim()).filter(Boolean)
    : (ocr.language_hints || ['hi', 'gu', 'en']);

  return {
    ai: {
      provider: process.env.AI_PROVIDER || ai.provider || 'openai',
      api_key: apiKey,
      model,
      base_url: process.env.AI_BASE_URL || process.env.OPENAI_BASE_URL || ai.base_url || 'https://api.openai.com/v1',
      max_sections: Number(process.env.AI_MAX_SECTIONS ?? ai.max_sections ?? 1),
      topic_wise: process.env.AI_TOPIC_WISE !== undefined
        ? process.env.AI_TOPIC_WISE === '1' || process.env.AI_TOPIC_WISE === 'true'
        : ai.topic_wise !== false,
      max_retries: Number(process.env.AI_MAX_RETRIES ?? ai.max_retries ?? 3),
      request_timeout_ms: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? ai.request_timeout_ms ?? 600000),
      fast_mode: process.env.AI_FAST_MODE !== undefined
        ? process.env.AI_FAST_MODE === '1' || process.env.AI_FAST_MODE === 'true'
        : ai.fast_mode === true,
      request_delay_ms: Number(process.env.AI_REQUEST_DELAY_MS ?? ai.request_delay_ms ?? (ai.fast_mode ? 0 : 400)),
      skip_ladder_retry: process.env.AI_SKIP_LADDER_RETRY !== undefined
        ? process.env.AI_SKIP_LADDER_RETRY === '1' || process.env.AI_SKIP_LADDER_RETRY === 'true'
        : ai.skip_ladder_retry !== false && ai.fast_mode === true,
      combined_section: process.env.AI_COMBINED_SECTION !== undefined
        ? process.env.AI_COMBINED_SECTION === '1' || process.env.AI_COMBINED_SECTION === 'true'
        : ai.combined_section !== false, // default ON for speed
    },
    ocr: {
      provider: ocrProvider,
      language: process.env.OCR_LANGUAGE || ocr.language || 'hin+guj+eng',
      language_hints: languageHints,
      scale: Number(process.env.OCR_SCALE || ocr.scale || 2),
      google_vision_api_key: googleVisionKey,
    },
    auto_generate_material: fileConfig.auto_generate_material !== false,
  };
}

module.exports = { loadConfig };
