#!/usr/bin/env node
/**
 * Convert material JSON → HTML
 * Usage: node json-to-html.js <material.json> [--out dir]
 */
const fs = require('fs');
const path = require('path');
const { materialJsonToHtml } = require('./lib/json-to-html');
const { ensureDir } = require('./lib/utils');

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help')) {
    console.log('Usage: node json-to-html.js <material.json> [--out output-dir]');
    process.exit(args.includes('--help') ? 0 : 1);
  }

  const jsonPath = path.resolve(args[0]);
  const outDir = path.resolve(getFlag(args, '--out') || path.dirname(jsonPath));

  if (!fs.existsSync(jsonPath)) {
    fail(`File not found: ${jsonPath}`);
  }

  const material = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const html = materialJsonToHtml(material);

  const base = path.basename(jsonPath, '.json');
  const outName = `${base}.html`;
  ensureDir(outDir);
  const outPath = path.join(outDir, outName);
  fs.writeFileSync(outPath, html, 'utf8');

  console.log(
    JSON.stringify({
      success: true,
      type: 'html',
      title: material.meta?.title,
      output_file: outPath,
      output_name: outName,
    })
  );
}

function getFlag(args, flag) {
  const i = args.indexOf(flag);
  return i === -1 ? null : args[i + 1];
}

function fail(msg) {
  console.log(JSON.stringify({ success: false, error: msg }));
  process.exit(1);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    fail(err.message || String(err));
  }
}
