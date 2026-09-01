/**
 * Robust JSON extraction/repair for AI model output.
 * Models with response_format=json_object still occasionally return:
 * truncated JSON, unescaped quotes/newlines, trailing commas, or markdown fences.
 */

function stripFences(raw) {
  let s = String(raw || '').trim();
  if (!s) return '';
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }
  return s;
}

function extractJsonSlice(text) {
  const s = String(text || '').trim();
  if (!s) return '';
  const firstObj = s.indexOf('{');
  const firstArr = s.indexOf('[');
  let start = -1;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);
  if (start < 0) return s;

  const stack = [];
  let inString = false;
  let escape = false;
  let lastGood = -1;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') {
      stack.push('}');
      continue;
    }
    if (ch === '[') {
      stack.push(']');
      continue;
    }
    if (ch === '}' || ch === ']') {
      if (!stack.length || stack[stack.length - 1] !== ch) {
        break;
      }
      stack.pop();
      if (!stack.length) {
        lastGood = i;
        break;
      }
    }
  }

  if (lastGood >= start) return s.slice(start, lastGood + 1);
  return s.slice(start);
}

function removeTrailingCommas(json) {
  return json.replace(/,\s*([}\]])/g, '$1');
}

function escapeControlCharsInStrings(json) {
  let out = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (inString) {
      if (escape) {
        out += ch;
        escape = false;
        continue;
      }
      if (ch === '\\') {
        out += ch;
        escape = true;
        continue;
      }
      if (ch === '"') {
        // Look ahead: end of string vs unescaped quote inside value
        const rest = json.slice(i + 1).match(/^\s*([,}\]:]|:)/);
        if (rest) {
          out += ch;
          inString = false;
          continue;
        }
        // Unescaped quote mid-string — escape it
        out += '\\"';
        continue;
      }
      if (ch === '\n') {
        out += '\\n';
        continue;
      }
      if (ch === '\r') {
        out += '\\r';
        continue;
      }
      if (ch === '\t') {
        out += '\\t';
        continue;
      }
      if (ch.charCodeAt(0) < 0x20) {
        out += `\\u${ch.charCodeAt(0).toString(16).padStart(4, '0')}`;
        continue;
      }
      out += ch;
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    out += ch;
  }
  return out;
}

function closeTruncatedJson(json) {
  let s = String(json || '').trim();
  if (!s) return s;

  // If truncated mid-string, close the string
  let inString = false;
  let escape = false;
  const stack = [];

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') {
      if (stack.length && stack[stack.length - 1] === ch) stack.pop();
    }
  }

  if (inString) s += '"';

  // Drop dangling comma / colon before closing
  s = s.replace(/,\s*$/, '').replace(/:\s*$/, ': null');

  while (stack.length) {
    s += stack.pop();
  }
  return s;
}

function tryParse(jsonStr) {
  return JSON.parse(jsonStr);
}

/**
 * Parse AI JSON with progressive repair. Throws only if all strategies fail.
 */
function parseAiJson(raw) {
  const original = String(raw || '');
  const stripped = stripFences(original);
  const candidates = [];

  const pushUnique = (value) => {
    if (value && !candidates.includes(value)) candidates.push(value);
  };

  pushUnique(stripped);
  pushUnique(extractJsonSlice(stripped));

  let lastError;
  for (const base of [...candidates]) {
    const variants = [
      base,
      removeTrailingCommas(base),
      escapeControlCharsInStrings(base),
      removeTrailingCommas(escapeControlCharsInStrings(base)),
      closeTruncatedJson(base),
      removeTrailingCommas(closeTruncatedJson(base)),
      closeTruncatedJson(escapeControlCharsInStrings(base)),
      removeTrailingCommas(closeTruncatedJson(escapeControlCharsInStrings(base))),
    ];

    for (const variant of variants) {
      if (!variant) continue;
      try {
        return tryParse(variant);
      } catch (err) {
        lastError = err;
      }
    }
  }

  const preview = stripped.slice(0, 180).replace(/\s+/g, ' ');
  const msg = lastError?.message || 'Invalid JSON';
  throw new Error(`${msg} (AI JSON). Preview: ${preview}`);
}

function isJsonParseError(err) {
  const msg = String(err?.message || err || '');
  return (
    /JSON|Unexpected token|Unexpected end|Expected ','|Expected property|position \d+/i.test(msg) ||
    err instanceof SyntaxError
  );
}

module.exports = {
  parseAiJson,
  isJsonParseError,
  stripFences,
  extractJsonSlice,
  closeTruncatedJson,
};
