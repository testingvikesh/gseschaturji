<?php
declare(strict_types=1);

/**
 * Resolve Node.js binary for PHP-FPM.
 * Note: is_file('/usr/bin/node') often fails under open_basedir — use shell tests.
 */
function findNodeBinary(): string
{
    if (PHP_OS_FAMILY === 'Windows') {
        $out = @shell_exec('where node 2>nul');
        if (is_string($out) && trim($out) !== '') {
            $lines = preg_split('/\r?\n/', trim($out));
            $first = trim((string) ($lines[0] ?? ''));
            if ($first !== '') {
                return $first;
            }
        }
        throw new RuntimeException('Node.js not found. Install Node.js to process PDFs.');
    }

    $candidates = [
        '/usr/bin/node',
        '/usr/local/bin/node',
        '/bin/node',
    ];

    foreach ($candidates as $path) {
        // open_basedir may block is_file(); probe via shell instead
        $check = @shell_exec('test -x ' . escapeshellarg($path) . ' && echo OK');
        if (is_string($check) && str_contains(trim($check), 'OK')) {
            return $path;
        }
    }

    // If node runs in this environment, use the command name
    $ver = @shell_exec('node -v 2>&1');
    if (is_string($ver) && preg_match('/v?\d+\.\d+/', $ver)) {
        return 'node';
    }

    foreach (['command -v node', 'type -p node', 'which node'] as $cmd) {
        $out = @shell_exec($cmd . ' 2>/dev/null');
        if (is_string($out) && trim($out) !== '') {
            $bin = trim(explode("\n", trim($out))[0]);
            if ($bin !== '') {
                return $bin;
            }
        }
    }

    throw new RuntimeException('Node.js not found. Install Node.js to process PDFs.');
}
