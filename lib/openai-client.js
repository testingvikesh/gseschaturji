function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(err) {
  const msg = err?.message || '';
  const code = err?.cause?.code || '';
  return (
    msg === 'fetch failed' ||
    err?.name === 'AbortError' ||
    err?.name === 'TimeoutError' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'UND_ERR_HEADERS_TIMEOUT' ||
    code === 'UND_ERR_BODY_TIMEOUT'
  );
}

function formatFetchError(err, attempts) {
  const cause = err?.cause?.code || err?.cause?.message;
  const detail = cause ? ` (${cause})` : '';

  if (err?.message === 'fetch failed' || err?.name === 'AbortError') {
    return (
      `Network error calling OpenAI${detail} after ${attempts} attempt(s). ` +
      'Check internet, firewall/antivirus, and that api.openai.com is reachable.'
    );
  }

  return `${err?.message || 'OpenAI request failed'}${detail}`;
}

async function callOpenAIChat(config, body, options = {}) {
  const maxRetries = options.maxRetries ?? config.max_retries ?? 3;
  const timeoutMs = options.timeoutMs ?? config.request_timeout_ms ?? 600000;
  const url = `${config.base_url.replace(/\/$/, '')}/chat/completions`;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.api_key}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });

      const text = await response.text();
      let parsed;

      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(`AI API returned non-JSON (${response.status}): ${text.slice(0, 300)}`);
      }

      if (!response.ok) {
        const apiMsg = parsed.error?.message || response.statusText;
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < maxRetries) {
          throw Object.assign(new Error(`AI API error (${response.status}): ${apiMsg}`), {
            retryable: true,
          });
        }
        throw new Error(`AI API error (${response.status}): ${apiMsg}`);
      }

      const content = parsed.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('AI returned empty response');
      }

      return content;
    } catch (err) {
      lastError = err;
      const canRetry = attempt < maxRetries && (err.retryable || isRetryableError(err));

      if (canRetry) {
        const wait = attempt * 4000;
        process.stderr.write(
          `OpenAI request failed (${attempt}/${maxRetries}): ${err.message}. Retrying in ${wait / 1000}s...\n`
        );
        await sleep(wait);
        continue;
      }

      throw new Error(formatFetchError(err, attempt));
    }
  }

  throw new Error(formatFetchError(lastError, maxRetries));
}

module.exports = { callOpenAIChat, sleep };
