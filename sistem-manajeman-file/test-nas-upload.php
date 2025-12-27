<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Storage;

echo "=== Testing NAS Upload Storage ===\n\n";

// Test 1: Check if nas_uploads disk is configured
echo "1. Checking nas_uploads disk configuration...\n";
$config = config('filesystems.disks.nas_uploads');
echo "   Root: " . $config['root'] . "\n";
echo "   Visibility: " . $config['visibility'] . "\n";
echo "   ✅ Configuration OK\n\n";

// Test 2: Check if Z:\uploads directory exists and writable
echo "2. Checking Z:\\uploads directory...\n";
$uploadPath = env('NAS_DRIVE_PATH', 'Z:\\') . 'uploads';
if (is_dir($uploadPath)) {
    echo "   ✅ Directory exists: $uploadPath\n";
    if (is_writable($uploadPath)) {
        echo "   ✅ Directory is writable\n";
    } else {
        echo "   ❌ Directory is NOT writable\n";
    }
} else {
    echo "   ❌ Directory does NOT exist: $uploadPath\n";
}
echo "\n";

// Test 3: Try to write a test file using Storage facade
echo "3. Testing file write using Storage::disk('nas_uploads')...\n";
$testContent = "Test content from Laravel - " . date('Y-m-d H:i:s');
$testPath = 'test-folder/test-file.txt';

try {
    Storage::disk('nas_uploads')->put($testPath, $testContent);
    echo "   ✅ File written successfully\n";
    
    // Test 4: Read back the file
    echo "\n4. Testing file read...\n";
    if (Storage::disk('nas_uploads')->exists($testPath)) {
        $content = Storage::disk('nas_uploads')->get($testPath);
        echo "   ✅ File exists and readable\n";
        echo "   Content: $content\n";
        
        // Test 5: Get file size
        echo "\n5. Testing file info...\n";
        $size = Storage::disk('nas_uploads')->size($testPath);
        echo "   File size: $size bytes\n";
        
        // Test 6: Delete test file
        echo "\n6. Testing file deletion...\n";
        Storage::disk('nas_uploads')->delete($testPath);
        if (!Storage::disk('nas_uploads')->exists($testPath)) {
            echo "   ✅ File deleted successfully\n";
        } else {
            echo "   ❌ Failed to delete file\n";
        }
    } else {
        echo "   ❌ File does NOT exist after write\n";
    }
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
