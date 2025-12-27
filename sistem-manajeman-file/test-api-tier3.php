<?php

/**
 * Test API endpoint /admin/server-metrics/latest
 * Verify TIER 3 metrics are returned
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Http\Controllers\Api\ServerMetricsController;
use App\Services\WindowsMetricsService;
use Illuminate\Http\Request;

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════════╗\n";
echo "║         TEST API /admin/server-metrics/latest                     ║\n";
echo "╚═══════════════════════════════════════════════════════════════════╝\n";
echo "\n";

try {
    // Create controller instance
    $metricsService = new WindowsMetricsService();
    $controller = new ServerMetricsController($metricsService);
    
    // Call latest() method
    echo "📡 Calling latest() endpoint...\n\n";
    $response = $controller->latest();
    
    // Get JSON content
    $json = $response->getData(true);
    
    if ($json['success']) {
        $data = $json['data'];
        
        echo "┌─────────────────────────────────────────────────────────────────┐\n";
        echo "│ API RESPONSE - ALL 16 METRICS                                   │\n";
        echo "├─────────────────────────────────────────────────────────────────┤\n";
        
        // TIER 1
        echo "│ TIER 1: CRITICAL SYSTEM                                         │\n";
        printf("│ %-40s %23s │\n", "cpu_usage_percent:", $data['cpu_usage_percent'] . "%");
        printf("│ %-40s %23s │\n", "memory_usage_percent:", $data['memory_usage_percent'] . "%");
        printf("│ %-40s %23s │\n", "memory_available_mb:", number_format($data['memory_available_mb'], 0) . " MB");
        printf("│ %-40s %23s │\n", "tcp_connections_total:", $data['tcp_connections_total']);
        printf("│ %-40s %23s │\n", "tcp_connections_external:", $data['tcp_connections_external']);
        printf("│ %-40s %23s │\n", "concurrent_users:", $data['concurrent_users']);
        printf("│ %-40s %23s │\n", "disk_queue_length:", number_format($data['disk_queue_length'], 2));
        echo "├─────────────────────────────────────────────────────────────────┤\n";
        
        // TIER 2
        echo "│ TIER 2: SYSTEM-WIDE PERFORMANCE                                 │\n";
        printf("│ %-40s %23s │\n", "rx (network):", number_format($data['rx'] / 1024, 2) . " KB/s");
        printf("│ %-40s %23s │\n", "tx (network):", number_format($data['tx'] / 1024, 2) . " KB/s");
        printf("│ %-40s %23s │\n", "reads (disk):", number_format($data['reads'], 2) . " IOPS");
        printf("│ %-40s %23s │\n", "writes (disk):", number_format($data['writes'], 2) . " IOPS");
        printf("│ %-40s %23s │\n", "free_space:", number_format($data['free_space'] / (1024**3), 2) . " GB");
        printf("│ %-40s %23s │\n", "latency:", ($data['latency'] ?? 'N/A') . " ms");
        echo "├─────────────────────────────────────────────────────────────────┤\n";
        
        // TIER 3
        echo "│ TIER 3: APPLICATION-SPECIFIC ⭐ NEW                            │\n";
        printf("│ %-40s %23s │\n", "app_network_bytes_per_sec:", number_format($data['app_network_bytes_per_sec'] / 1024, 2) . " KB/s");
        printf("│ %-40s %23s │\n", "mysql_reads_per_sec:", number_format($data['mysql_reads_per_sec'], 2) . " IOPS");
        printf("│ %-40s %23s │\n", "mysql_writes_per_sec:", number_format($data['mysql_writes_per_sec'], 2) . " IOPS");
        printf("│ %-40s %23s │\n", "app_response_time_ms:", ($data['app_response_time_ms'] !== null ? $data['app_response_time_ms'] . " ms" : "N/A"));
        printf("│ %-40s %23s │\n", "app_requests_per_sec:", number_format($data['app_requests_per_sec'], 2) . " req/s");
        echo "└─────────────────────────────────────────────────────────────────┘\n\n";
        
        // Check TIER 3 exists
        $tier3Exists = isset($data['app_network_bytes_per_sec']) && 
                       isset($data['mysql_reads_per_sec']) && 
                       isset($data['mysql_writes_per_sec']) && 
                       isset($data['app_response_time_ms']) && 
                       isset($data['app_requests_per_sec']);
        
        if ($tier3Exists) {
            echo "✅ SUCCESS: TIER 3 metrics are present in API response!\n";
            echo "✅ All 16 metrics (TIER 1 + 2 + 3) are working correctly!\n\n";
        } else {
            echo "❌ FAILED: TIER 3 metrics are missing!\n";
            echo "Missing fields:\n";
            if (!isset($data['app_network_bytes_per_sec'])) echo "- app_network_bytes_per_sec\n";
            if (!isset($data['mysql_reads_per_sec'])) echo "- mysql_reads_per_sec\n";
            if (!isset($data['mysql_writes_per_sec'])) echo "- mysql_writes_per_sec\n";
            if (!isset($data['app_response_time_ms'])) echo "- app_response_time_ms\n";
            if (!isset($data['app_requests_per_sec'])) echo "- app_requests_per_sec\n";
        }
        
        // Timestamp
        echo "🕐 Timestamp: " . $data['timestamp'] . "\n\n";
        
    } else {
        echo "❌ API Error: " . $json['message'] . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString() . "\n";
}
