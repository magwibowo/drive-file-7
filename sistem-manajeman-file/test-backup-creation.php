<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Http\Controllers\Api\BackupController;
use Illuminate\Http\Request;

echo "=== Testing Backup to Z:\\backups ===\n\n";

echo "1. Creating test backup...\n";
try {
    $controller = new BackupController();
    $request = new Request();
    
    $response = $controller->run($request);
    $data = json_decode($response->getContent(), true);
    
    if ($response->getStatusCode() === 200) {
        echo "   ✅ Backup created successfully!\n";
        echo "   File: " . ($data['file'] ?? 'Unknown') . "\n";
        echo "\n";
        
        // Verify file exists
        echo "2. Verifying backup file...\n";
        $filePath = $data['file'] ?? '';
        if ($filePath && file_exists($filePath)) {
            echo "   ✅ File exists at: $filePath\n";
            echo "   Size: " . number_format(filesize($filePath)) . " bytes\n";
            
            // Check if it's in Z:\backups
            if (strpos($filePath, 'Z:\\backups') !== false) {
                echo "   ✅ Correctly saved to Z:\\backups\n";
            } else {
                echo "   ❌ WARNING: File not in Z:\\backups!\n";
            }
        } else {
            echo "   ❌ File does not exist\n";
        }
        
    } else {
        echo "   ❌ Backup failed\n";
        echo "   Error: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
    
} catch (\Exception $e) {
    echo "   ❌ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . "\n";
    echo "   Line: " . $e->getLine() . "\n";
}

echo "\n";
echo "3. Listing Z:\\backups contents...\n";
$backupFiles = glob('Z:\\backups\\*.zip');
if (count($backupFiles) > 0) {
    echo "   Found " . count($backupFiles) . " backup file(s):\n";
    foreach ($backupFiles as $file) {
        $size = filesize($file);
        $time = date('Y-m-d H:i:s', filemtime($file));
        echo "   - " . basename($file) . " (" . number_format($size) . " bytes, $time)\n";
    }
} else {
    echo "   No backup files found\n";
}

echo "\n=== Test Complete ===\n";
