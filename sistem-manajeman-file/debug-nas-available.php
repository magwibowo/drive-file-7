<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Debug isNasAvailable Logic ===\n\n";

$nasDrive = env('NAS_DRIVE_PATH', 'Z:\\');

echo "NAS Drive Path: $nasDrive\n\n";

echo "Step 1: file_exists check\n";
$exists = file_exists($nasDrive);
echo "  Result: " . ($exists ? 'YES' : 'NO') . "\n\n";

if (!$exists) {
    echo "❌ Drive not found! Stopping here.\n";
    exit(1);
}

echo "Step 2: Write permission test\n";
$testFile = $nasDrive . '.nas_health_check';
echo "  Test file: $testFile\n";

$result = @file_put_contents($testFile, 'health_check_' . time());

if ($result !== false) {
    echo "  ✅ Write successful! Bytes: $result\n";
    @unlink($testFile);
    echo "  ✅ Cleanup done\n";
    echo "\n✅ NAS Should be AVAILABLE\n";
} else {
    echo "  ❌ Write failed!\n";
    $readable = is_readable($nasDrive);
    echo "  is_readable: " . ($readable ? 'YES' : 'NO') . "\n";
    echo "\n" . ($readable ? "✅" : "❌") . " NAS Available: " . ($readable ? "true" : "false") . "\n";
}
