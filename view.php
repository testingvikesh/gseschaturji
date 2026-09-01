<?php
declare(strict_types=1);

/** View material JSON as HTML — view.php?file=slug-material-ai.json */
$baseDir = __DIR__;
require_once $baseDir . DIRECTORY_SEPARATOR . 'lib' . DIRECTORY_SEPARATOR . 'find-node.php';
$outputDir = $baseDir . DIRECTORY_SEPARATOR . 'output';

$file = basename($_GET['file'] ?? '');
if ($file === '' || !preg_match('/\.json$/i', $file)) {
    http_response_code(400);
    echo 'Missing or invalid file parameter.';
    exit;
}

$jsonPath = $outputDir . DIRECTORY_SEPARATOR . $file;
if (!is_file($jsonPath)) {
    http_response_code(404);
    echo 'File not found.';
    exit;
}

$node = findNodeBinary();
$script = $baseDir . DIRECTORY_SEPARATOR . 'json-to-html.js';
$htmlPath = $outputDir . DIRECTORY_SEPARATOR . preg_replace('/\.json$/i', '.html', $file);

$jsonMtime = filemtime($jsonPath);
$htmlMtime = is_file($htmlPath) ? filemtime($htmlPath) : 0;

if ($htmlMtime < $jsonMtime) {
    $cmd = escapeshellarg($node) . ' '
        . escapeshellarg($script) . ' '
        . escapeshellarg($jsonPath) . ' '
        . '--out ' . escapeshellarg($outputDir);
    exec($cmd . ' 2>&1', $output, $code);
    if ($code !== 0 || !is_file($htmlPath)) {
        http_response_code(500);
        echo 'HTML conversion failed.';
        exit;
    }
}

header('Content-Type: text/html; charset=utf-8');
readfile($htmlPath);
