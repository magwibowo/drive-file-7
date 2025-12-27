<?php

/**
 * Test script untuk TIER 3 Application-Specific Metrics
 * 
 * Menguji:
 * 1. Application Network Traffic (Laravel port 8000)
 * 2. MySQL Disk IOPS
 * 3. API Response Time
 * 4. Request Rate
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\WindowsMetricsService;

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════════╗\n";
echo "║         TIER 3: APPLICATION-SPECIFIC METRICS TEST                 ║\n";
echo "╚═══════════════════════════════════════════════════════════════════╝\n";
echo "\n";

$metricsService = new WindowsMetricsService();

try {
    echo "🔄 Mengambil semua metrics (TIER 1 + 2 + 3)...\n\n";
    
    $allMetrics = $metricsService->getMetrics();
    
    // Display TIER 1: Critical System
    echo "┌─────────────────────────────────────────────────────────────────┐\n";
    echo "│ TIER 1: CRITICAL SYSTEM METRICS                                 │\n";
    echo "├─────────────────────────────────────────────────────────────────┤\n";
    printf("│ %-35s %29s │\n", "CPU Usage:", $allMetrics['cpu_usage_percent'] . "%");
    printf("│ %-35s %29s │\n", "Memory Usage:", $allMetrics['memory_usage_percent'] . "%");
    printf("│ %-35s %29s │\n", "Memory Available:", number_format($allMetrics['memory_available_mb'], 0) . " MB");
    printf("│ %-35s %29s │\n", "TCP Connections (Total):", $allMetrics['tcp_connections_total']);
    printf("│ %-35s %29s │\n", "TCP Connections (External):", $allMetrics['tcp_connections_external']);
    printf("│ %-35s %29s │\n", "Concurrent Users:", $allMetrics['concurrent_users']);
    printf("│ %-35s %29s │\n", "Disk Queue Length:", number_format($allMetrics['disk_queue_length'], 2));
    echo "└─────────────────────────────────────────────────────────────────┘\n\n";
    
    // Display TIER 2: System-wide Performance
    echo "┌─────────────────────────────────────────────────────────────────┐\n";
    echo "│ TIER 2: SYSTEM-WIDE PERFORMANCE                                 │\n";
    echo "├─────────────────────────────────────────────────────────────────┤\n";
    printf("│ %-35s %29s │\n", "Network RX (System):", number_format($allMetrics['network_rx_bytes_per_sec'] / 1024, 2) . " KB/s");
    printf("│ %-35s %29s │\n", "Network TX (System):", number_format($allMetrics['network_tx_bytes_per_sec'] / 1024, 2) . " KB/s");
    printf("│ %-35s %29s │\n", "Internet Latency:", $allMetrics['latency_ms'] . " ms");
    printf("│ %-35s %29s │\n", "Disk Reads (System):", number_format($allMetrics['disk_reads_per_sec'], 2) . " IOPS");
    printf("│ %-35s %29s │\n", "Disk Writes (System):", number_format($allMetrics['disk_writes_per_sec'], 2) . " IOPS");
    printf("│ %-35s %29s │\n", "Disk Free Space:", number_format($allMetrics['disk_free_space'] / (1024**3), 2) . " GB");
    echo "└─────────────────────────────────────────────────────────────────┘\n\n";
    
    // Display TIER 3: Application-Specific
    echo "┌─────────────────────────────────────────────────────────────────┐\n";
    echo "│ TIER 3: APPLICATION-SPECIFIC METRICS ⭐ NEW!                    │\n";
    echo "├─────────────────────────────────────────────────────────────────┤\n";
    
    // Application Network
    $appNetworkKB = $allMetrics['app_network_bytes_per_sec'] / 1024;
    printf("│ %-35s %29s │\n", "App Network Traffic:", number_format($appNetworkKB, 2) . " KB/s");
    
    // MySQL IOPS
    printf("│ %-35s %29s │\n", "MySQL Disk Reads:", number_format($allMetrics['mysql_reads_per_sec'], 2) . " IOPS");
    printf("│ %-35s %29s │\n", "MySQL Disk Writes:", number_format($allMetrics['mysql_writes_per_sec'], 2) . " IOPS");
    
    // API Response Time
    $responseTime = $allMetrics['app_response_time_ms'] ?? 'N/A';
    $responseStatus = $responseTime === 'N/A' ? '❌ Failed' : '✅ ' . $responseTime . ' ms';
    printf("│ %-35s %29s │\n", "API Response Time:", $responseStatus);
    
    // Request Rate
    printf("│ %-35s %29s │\n", "Request Rate:", number_format($allMetrics['app_requests_per_sec'], 2) . " req/s");
    
    echo "└─────────────────────────────────────────────────────────────────┘\n\n";
    
    // Analisis perbedaan TIER 2 vs TIER 3
    echo "┌─────────────────────────────────────────────────────────────────┐\n";
    echo "│ 📊 SYSTEM vs APPLICATION COMPARISON                             │\n";
    echo "├─────────────────────────────────────────────────────────────────┤\n";
    
    // Network comparison
    $systemNetworkKB = ($allMetrics['network_rx_bytes_per_sec'] + $allMetrics['network_tx_bytes_per_sec']) / 1024;
    $appPercentage = $systemNetworkKB > 0 ? ($appNetworkKB / $systemNetworkKB * 100) : 0;
    
    printf("│ %-35s %29s │\n", "Total System Network:", number_format($systemNetworkKB, 2) . " KB/s");
    printf("│ %-35s %29s │\n", "Laravel App Network:", number_format($appNetworkKB, 2) . " KB/s");
    printf("│ %-35s %29s │\n", "App Network % of Total:", number_format($appPercentage, 1) . "%");
    echo "├─────────────────────────────────────────────────────────────────┤\n";
    
    // Disk IOPS comparison
    $systemDiskIOPS = $allMetrics['disk_reads_per_sec'] + $allMetrics['disk_writes_per_sec'];
    $mysqlIOPS = $allMetrics['mysql_reads_per_sec'] + $allMetrics['mysql_writes_per_sec'];
    $mysqlPercentage = $systemDiskIOPS > 0 ? ($mysqlIOPS / $systemDiskIOPS * 100) : 0;
    
    printf("│ %-35s %29s │\n", "Total System Disk IOPS:", number_format($systemDiskIOPS, 2));
    printf("│ %-35s %29s │\n", "MySQL Disk IOPS:", number_format($mysqlIOPS, 2));
    printf("│ %-35s %29s │\n", "MySQL IOPS % of Total:", number_format($mysqlPercentage, 1) . "%");
    echo "├─────────────────────────────────────────────────────────────────┤\n";
    
    // Latency comparison
    $internetLatency = $allMetrics['latency_ms'];
    $apiLatency = $allMetrics['app_response_time_ms'] ?? 0;
    
    printf("│ %-35s %29s │\n", "Internet Latency (8.8.8.8):", $internetLatency . " ms");
    printf("│ %-35s %29s │\n", "API Latency (localhost):", $apiLatency > 0 ? $apiLatency . " ms" : "N/A");
    
    if ($apiLatency > 0 && $internetLatency > 0) {
        $latencyRatio = round($internetLatency / $apiLatency, 1);
        printf("│ %-35s %29s │\n", "Internet is slower by:", $latencyRatio . "x");
    }
    
    echo "└─────────────────────────────────────────────────────────────────┘\n\n";
    
    // Interpretasi
    echo "┌─────────────────────────────────────────────────────────────────┐\n";
    echo "│ 💡 INTERPRETATION                                               │\n";
    echo "├─────────────────────────────────────────────────────────────────┤\n";
    
    echo "│                                                                 │\n";
    echo "│ TIER 2 (System-wide):                                           │\n";
    echo "│ - Monitors ALL processes (browser, apps, services, Laravel)     │\n";
    echo "│ - Useful for overall server health                             │\n";
    echo "│ - Includes background noise (Windows Update, cloud sync, etc)   │\n";
    echo "│                                                                 │\n";
    echo "│ TIER 3 (Application):                                           │\n";
    echo "│ - Monitors ONLY Laravel application                             │\n";
    echo "│ - Precise performance tuning                                    │\n";
    echo "│ - Isolates app bottlenecks from system noise                    │\n";
    echo "│                                                                 │\n";
    
    // Warnings
    if ($appPercentage > 80) {
        echo "│ ⚠️  WARNING: App uses " . number_format($appPercentage, 0) . "% of network!                │\n";
    }
    
    if ($mysqlPercentage > 60) {
        echo "│ ⚠️  WARNING: MySQL uses " . number_format($mysqlPercentage, 0) . "% of disk I/O!              │\n";
    }
    
    if ($apiLatency > 100) {
        echo "│ ⚠️  WARNING: API response time is slow (" . $apiLatency . "ms)!                │\n";
    }
    
    if ($allMetrics['app_requests_per_sec'] > 50) {
        echo "│ ⚠️  HIGH LOAD: " . number_format($allMetrics['app_requests_per_sec'], 0) . " requests/sec!                           │\n";
    }
    
    echo "└─────────────────────────────────────────────────────────────────┘\n\n";
    
    echo "✅ Test completed successfully!\n\n";
    
    // Save to database
    echo "💾 Saving to database...\n";
    $metric = \App\Models\ServerMetric::create($allMetrics);
    echo "✅ Saved with ID: {$metric->id}\n\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\nStack trace:\n";
    echo $e->getTraceAsString() . "\n";
}
