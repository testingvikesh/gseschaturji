#!/usr/bin/env node
/**
 * Generate material JSON from chapter JSON using AI
 * Usage:
 *   node generate-material-ai.js <chapter.json> [--out dir]
 *   node generate-material-ai.js <chapter.json> --plan-only
 *   node generate-material-ai.js <chapter.json> --topic 1
 *   node generate-material-ai.js <chapter.json> --topic all
 *   node generate-material-ai.js <chapter.json> --finalize
 */
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('./lib/config');
const {
  generateMaterialFromChapter,
  finalizeChapterMaterial,
} = require('./lib/ai-generate-material');
const { ensureDir } = require('./lib/utils');

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help')) {
    console.log(`Usage: node generate-material-ai.js <chapter.json> [options]

Options:
  --out dir         Output directory (default: output/)
  --plan-only       Plan topics only (save to chapter JSON)
  --topic N|all     Generate topic N or all topics (default: topic-wise first only)
  --finalize        Add textbook exercises + chapter assessment to existing material
  --full-chapter    Generate entire chapter as one section (legacy mode)`);
    process.exit(args.includes('--help') ? 0 : 1);
  }

  const chapterPath = path.resolve(args[0]);
  const outDir = path.resolve(getFlag(args, '--out') || path.join(__dirname, 'output'));
  const planOnly = args.includes('--plan-only');
  const finalizeOnly = args.includes('--finalize');
  const fullChapter = args.includes('--full-chapter');
  const topicFlag = getFlag(args, '--topic');

  if (!fs.existsSync(chapterPath)) {
    fail(`Chapter JSON not found: ${chapterPath}`);
  }

  const chapterJson = JSON.parse(fs.readFileSync(chapterPath, 'utf8'));
  const config = loadConfig();
  const slug = chapterJson.meta?.id || 'chapter';
  const outName = `${slug}-material-ai.json`;
  ensureDir(outDir);
  const outPath = path.join(outDir, outName);
  const htmlName = `${slug}-material-ai.html`;
  const htmlPath = path.join(outDir, htmlName);

  let material;

  if (finalizeOnly) {
    if (!fs.existsSync(outPath)) {
      fail(`Material JSON not found: ${outPath}`);
    }
    material = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    material = await finalizeChapterMaterial(material, chapterJson, config.ai);
  } else if (planOnly) {
    material = await generateMaterialFromChapter(chapterJson, config.ai, {
      mode: 'plan_only',
      topicWise: !fullChapter,
    });
    fs.writeFileSync(chapterPath, JSON.stringify(chapterJson, null, 2), 'utf8');
  } else if (topicFlag === 'all') {
    material = await generateMaterialFromChapter(chapterJson, config.ai, {
      mode: 'all',
      topicWise: !fullChapter,
      finalize: true,
    });
    fs.writeFileSync(chapterPath, JSON.stringify(chapterJson, null, 2), 'utf8');
  } else if (topicFlag) {
    const topicIndex = Number(topicFlag);
    if (!Number.isFinite(topicIndex) || topicIndex < 1) {
      fail(`Invalid --topic value: ${topicFlag}`);
    }

    let existingMaterial = null;
    if (fs.existsSync(outPath)) {
      existingMaterial = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    }

    material = await generateMaterialFromChapter(chapterJson, config.ai, {
      mode: 'topic',
      topicIndex,
      topicWise: !fullChapter,
      existingMaterial,
      finalize: false,
    });

    fs.writeFileSync(chapterPath, JSON.stringify(chapterJson, null, 2), 'utf8');

    const planned = material.topic_plans?.length || chapterJson.topics?.length || 0;
    if (material.sections.length >= planned && planned > 0) {
      material = await finalizeChapterMaterial(material, chapterJson, config.ai);
    }
  } else if (fullChapter) {
    material = await generateMaterialFromChapter(
      { ...chapterJson, topics: undefined },
      { ...config.ai, topic_wise: false, max_sections: 1 },
      { mode: 'all', topicWise: false, finalize: true }
    );
  } else {
    material = await generateMaterialFromChapter(chapterJson, config.ai, {
      mode: 'first_only',
      topicWise: true,
    });
    fs.writeFileSync(chapterPath, JSON.stringify(chapterJson, null, 2), 'utf8');
  }

  // Always write separate JSON+HTML for every generated topic section
  const topicFiles = writeTopicOutputs(outDir, slug, material);

  fs.writeFileSync(outPath, JSON.stringify(material, null, 2), 'utf8');

  const { materialJsonToHtml } = require('./lib/json-to-html');
  fs.writeFileSync(htmlPath, materialJsonToHtml(material), 'utf8');

  const topics = material.topic_plans || chapterJson.topics || [];
  const generated = material.meta?.generated_topic_orders || [];

  console.log(
    JSON.stringify({
      success: true,
      type: 'material',
      generated_by: 'ai',
      slug,
      title: material.meta?.title,
      total_sections: material.meta?.total_sections,
      planned_sections: material.meta?.planned_sections || topics.length,
      generation_status: material.meta?.generation_status,
      topics: topics.map((t) => ({
        order: t.order,
        id: t.id,
        title: t.title,
        title_gu: t.title_gu,
        generated: generated.includes(t.order),
        json_name: t.json_name || null,
        html_name: t.html_name || null,
      })),
      topic_files: topicFiles,
      chapter_json: chapterPath,
      chapter_json_name: path.basename(chapterPath),
      output_file: outPath,
      output_name: outName,
      html_file: htmlPath,
      html_name: htmlName,
    })
  );
}

function safeTopicFileSlug(section, order) {
  const raw = section.id || section.title_gu || section.title || `topic-${order}`;
  return String(raw)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\u0A80-\u0AFF-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || `topic-${order}`;
}

function buildSingleTopicMaterial(fullMaterial, section) {
  const chapterTitle = fullMaterial.meta?.title || 'Chapter';
  const topicTitle = section.title_gu || section.title || `Topic ${section.order}`;
  return {
    meta: {
      ...(fullMaterial.meta || {}),
      type: 'material_topic',
      topic_order: section.order,
      topic_id: section.id || null,
      total_sections: 1,
      planned_sections: 1,
      parent_slug: fullMaterial.meta?.id || null,
      title: `${chapterTitle} — ${topicTitle}`,
      generated_at: new Date().toISOString(),
    },
    sections: [section],
    topic_plan:
      (fullMaterial.topic_plans || []).find((t) => Number(t.order) === Number(section.order)) ||
      null,
  };
}

/**
 * Write separate JSON + HTML for each generated topic.
 * Also attaches json_name / html_name onto material.topic_plans.
 */
function writeTopicOutputs(outDir, slug, material) {
  const { materialJsonToHtml } = require('./lib/json-to-html');
  const sections = material.sections || [];
  if (!sections.length) return [];

  material.topic_plans = material.topic_plans || [];
  material.meta = material.meta || {};
  material.meta.topic_files = material.meta.topic_files || {};

  const written = [];

  for (const section of sections) {
    const order = Number(section.order);
    if (!order) continue;

    const topicSlug = safeTopicFileSlug(section, order);
    const jsonName = `${slug}-topic-${order}-${topicSlug}.json`;
    const htmlName = `${slug}-topic-${order}-${topicSlug}.html`;
    const topicMaterial = buildSingleTopicMaterial(material, section);

    fs.writeFileSync(path.join(outDir, jsonName), JSON.stringify(topicMaterial, null, 2), 'utf8');
    fs.writeFileSync(path.join(outDir, htmlName), materialJsonToHtml(topicMaterial), 'utf8');

    const fileInfo = {
      order,
      id: section.id || null,
      title: section.title || null,
      title_gu: section.title_gu || null,
      json_name: jsonName,
      html_name: htmlName,
      output_name: jsonName,
    };

    material.meta.topic_files[String(order)] = {
      json_name: jsonName,
      html_name: htmlName,
    };

    let plan = material.topic_plans.find((t) => Number(t.order) === order);
    if (!plan) {
      plan = {
        order,
        id: section.id,
        title: section.title,
        title_gu: section.title_gu,
      };
      material.topic_plans.push(plan);
    }
    plan.json_name = jsonName;
    plan.html_name = htmlName;

    written.push(fileInfo);
  }

  return written;
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
  main().catch((err) => fail(err.message || String(err)));
}
