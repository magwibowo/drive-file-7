<?php

/**
 * Simulate API call from frontend
 * Test /admin/server-metrics/latest endpoint
 */

header('Content-Type: application/json');

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Api\ServerMetricsController;
use App\Services\WindowsMetricsService;

try {
    $service = new WindowsMetricsService();
    $controller = new ServerMetricsController($service);
    
    $response = $controller->latest();
    $data = $response->getData(true);
    
    echo json_encode($data, JSON_PRETTY_PRINT);
    
    // Verify TIER 3
    if (isset($data['data']['app_network_bytes_per_sec'])) {
        echo "\n\n✅ TIER 3 is in API response!\n";
    } else {
        echo "\n\n❌ TIER 3 is MISSING from API response!\n";
    }
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
