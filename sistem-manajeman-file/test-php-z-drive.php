<?php

echo "=== Testing PHP Access to Z: Drive ===\n\n";

$drive = 'Z:\\';

echo "1. file_exists('Z:\\'): " . (file_exists($drive) ? 'YES' : 'NO') . "\n";
echo "2. is_dir('Z:\\'): " . (is_dir($drive) ? 'YES' : 'NO') . "\n";
echo "3. is_readable('Z:\\'): " . (is_readable($drive) ? 'YES' : 'NO') . "\n";
echo "4. is_writable('Z:\\'): " . (is_writable($drive) ? 'YES' : 'NO') . "\n\n";

// Test write
$testFile = $drive . '.php_test_write';
echo "5. Testing write to Z:\\.php_test_write...\n";
$result = @file_put_contents($testFile, 'test_' . time());

if ($result !== false) {
    echo "   ✅ Write successful! Bytes written: $result\n";
    @unlink($testFile);
    echo "   ✅ Cleanup successful\n";
} else {
    echo "   ❌ Write failed!\n";
    echo "   Error: " . error_get_last()['message'] ?? 'Unknown error' . "\n";
}

echo "\n6. Testing disk_free_space...\n";
$free = disk_free_space($drive);
$total = disk_total_space($drive);

if ($free !== false && $total !== false) {
    echo "   ✅ Free: " . number_format($free / 1024 / 1024 / 1024, 2) . " GB\n";
    echo "   ✅ Total: " . number_format($total / 1024 / 1024 / 1024, 2) . " GB\n";
} else {
    echo "   ❌ Failed to get disk space info\n";
}

echo "\n7. Listing files...\n";
$files = scandir($drive);
if ($files !== false) {
    echo "   ✅ File count: " . count($files) . "\n";
    echo "   Files: " . implode(', ', array_slice($files, 0, 5)) . "\n";
} else {
    echo "   ❌ Failed to list files\n";
}

echo "\nDone!\n";
