<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\Api\NasMetricsController;
use Illuminate\Http\Request;

echo "=== Testing NasMetricsController::latest() ===\n\n";

$nasService = app(\App\Services\NasMonitoringService::class);
$controller = new NasMetricsController($nasService);
$request = new Request();

try {
    $response = $controller->latest();
    $data = $response->getData(true);
    
    echo "Response:\n";
    echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
    
    if ($data['success']) {
        echo "\n✅ API Response OK!\n";
        echo "\nKey Data Points:\n";
        echo "  Available: " . ($data['data']['available'] ? 'YES' : 'NO') . "\n";
        echo "  Storage: " . $data['data']['usage_percent'] . "%\n";
        echo "  Latency: " . $data['data']['latency'] . " ms\n";
        echo "  File Count: " . $data['data']['file_count'] . "\n";
        echo "  Concurrent Users: " . $data['data']['concurrent_users'] . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}
