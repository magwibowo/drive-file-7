<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\WindowsMetricsService;

echo "=== TESTING TIER 1 METRICS ===\n\n";

try {
    $service = new WindowsMetricsService();
    $metrics = $service->getMetrics();
    
    echo "✅ TIER 1 Metrics Retrieved:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "🔴 CPU Usage: " . ($metrics['cpu_usage_percent'] ?? 'NULL') . "%\n";
    echo "🟡 Memory Usage: " . ($metrics['memory_usage_percent'] ?? 'NULL') . "%\n";
    echo "🟢 Memory Available: " . ($metrics['memory_available_mb'] ?? 'NULL') . " MB\n";
    echo "🔵 TCP Connections Total: " . ($metrics['tcp_connections_total'] ?? 'NULL') . "\n";
    echo "🌐 TCP Connections External: " . ($metrics['tcp_connections_external'] ?? 'NULL') . " (excludes localhost)\n";
    echo "� Concurrent Users: " . ($metrics['concurrent_users'] ?? 'NULL') . " (logged-in active users)\n";
    echo "�🟣 Disk Queue Length: " . ($metrics['disk_queue_length'] ?? 'NULL') . "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    
    echo "📊 Full Metrics JSON:\n";
    echo json_encode($metrics, JSON_PRETTY_PRINT) . "\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
