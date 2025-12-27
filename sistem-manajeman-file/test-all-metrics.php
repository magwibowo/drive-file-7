<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\WindowsMetricsService;

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════════╗\n";
echo "║         COMPREHENSIVE METRICS TEST - ALL 16 METRICS              ║\n";
echo "╚═══════════════════════════════════════════════════════════════════╝\n";
echo "\n";

$service = new WindowsMetricsService();

try {
    echo "Collecting all metrics...\n\n";
    $startTime = microtime(true);
    $metrics = $service->getMetrics();
    $duration = round((microtime(true) - $startTime) * 1000, 2);
    
    echo "Collection Time: {$duration}ms\n";
    echo "\n";
    
    // =========================================================================
    // TIER 1: CRITICAL SYSTEM METRICS (7 metrics)
    // =========================================================================
    echo "┌─────────────────────────────────────────────────────────────────┐\n";
    echo "│ TIER 1: CRITICAL SYSTEM METRICS (7 metrics)                    │\n";
    echo "└─────────────────────────────────────────────────────────────────┘\n";
    
    $tier1 = [
        'cpu_usage_percent' => ['name' => 'CPU Usage', 'unit' => '%', 'expected' => '0-100'],
        'memory_usage_percent' => ['name' => 'Memory Usage', 'unit' => '%', 'expected' => '0-100'],
        'memory_available_mb' => ['name' => 'Memory Available', 'unit' => 'MB', 'expected' => '>0'],
        'tcp_connections_total' => ['name' => 'TCP Connections Total', 'unit' => 'connections', 'expected' => '>0'],
        'tcp_connections_external' => ['name' => 'TCP External', 'unit' => 'connections', 'expected' => '>=0'],
        'concurrent_users' => ['name' => 'Concurrent Users', 'unit' => 'users', 'expected' => '>=0'],
        'disk_queue_length' => ['name' => 'Disk Queue Length', 'unit' => 'operations', 'expected' => '>=0'],
    ];
    
    $tier1Pass = 0;
    $tier1Total = count($tier1);
    
    foreach ($tier1 as $key => $info) {
        $value = $metrics[$key] ?? null;
        $status = ($value !== null && $value !== false) ? '✅' : '❌';
        
        if ($status === '✅') $tier1Pass++;
        
        echo sprintf("  %s %-30s: %-15s (%s expected)\n", 
            $status, 
            $info['name'], 
            $value . ' ' . $info['unit'],
            $info['expected']
        );
    }
    
    echo "\n";
    echo "  TIER 1 Status: {$tier1Pass}/{$tier1Total} metrics working\n";
    echo "\n";
    
    // =========================================================================
    // TIER 2: SYSTEM-WIDE PERFORMANCE (6 metrics)
    // =========================================================================
    echo "┌─────────────────────────────────────────────────────────────────┐\n";
    echo "│ TIER 2: SYSTEM-WIDE PERFORMANCE (6 metrics)                    │\n";
    echo "└─────────────────────────────────────────────────────────────────┘\n";
    
    $tier2 = [
        'network_rx_bytes_per_sec' => ['name' => 'Network RX', 'unit' => 'B/s', 'expected' => '>=0'],
        'network_tx_bytes_per_sec' => ['name' => 'Network TX', 'unit' => 'B/s', 'expected' => '>=0'],
        'disk_reads_per_sec' => ['name' => 'Disk Reads', 'unit' => 'IOPS', 'expected' => '>=0'],
        'disk_writes_per_sec' => ['name' => 'Disk Writes', 'unit' => 'IOPS', 'expected' => '>=0'],
        'latency_ms' => ['name' => 'Network Latency (8.8.8.8)', 'unit' => 'ms', 'expected' => '1-500'],
        'disk_free_space' => ['name' => 'Disk Free Space', 'unit' => 'bytes', 'expected' => '>0'],
    ];
    
    $tier2Pass = 0;
    $tier2Total = count($tier2);
    
    foreach ($tier2 as $key => $info) {
        $value = $metrics[$key] ?? null;
        
        // Format large numbers
        if ($key === 'disk_free_space' && $value !== null) {
            $displayValue = round($value / 1024 / 1024 / 1024, 2) . ' GB';
        } else {
            $displayValue = $value . ' ' . $info['unit'];
        }
        
        $status = ($value !== null && $value !== false) ? '✅' : '❌';
        
        if ($status === '✅') $tier2Pass++;
        
        echo sprintf("  %s %-30s: %-20s (%s expected)\n", 
            $status, 
            $info['name'], 
            $displayValue,
            $info['expected']
        );
    }
    
    echo "\n";
    echo "  TIER 2 Status: {$tier2Pass}/{$tier2Total} metrics working\n";
    echo "\n";
    
    // =========================================================================
    // TIER 3: APPLICATION-SPECIFIC (5 metrics)
    // =========================================================================
    echo "┌─────────────────────────────────────────────────────────────────┐\n";
    echo "│ TIER 3: APPLICATION-SPECIFIC (5 metrics)                       │\n";
    echo "└─────────────────────────────────────────────────────────────────┘\n";
    
    $tier3 = [
        'app_network_bytes_per_sec' => ['name' => 'App Network (Port 8000)', 'unit' => 'B/s', 'expected' => '>=0'],
        'mysql_reads_per_sec' => ['name' => 'MySQL Reads', 'unit' => 'queries/s', 'expected' => '>=0'],
        'mysql_writes_per_sec' => ['name' => 'MySQL Writes', 'unit' => 'queries/s', 'expected' => '>=0'],
        'app_response_time_ms' => ['name' => 'API Response Time', 'unit' => 'ms', 'expected' => '1-5000'],
        'app_requests_per_sec' => ['name' => 'Request Rate', 'unit' => 'req/s', 'expected' => '>=0'],
    ];
    
    $tier3Pass = 0;
    $tier3Total = count($tier3);
    
    foreach ($tier3 as $key => $info) {
        $value = $metrics[$key] ?? null;
        $status = ($value !== null && $value !== false) ? '✅' : '❌';
        
        // Highlight if app_response_time_ms is NULL (critical issue)
        if ($key === 'app_response_time_ms' && $value === null) {
            $status = '⚠️';
            $displayValue = 'NULL (needs fix)';
        } else {
            $displayValue = ($value ?? 'null') . ' ' . $info['unit'];
        }
        
        if ($status === '✅') $tier3Pass++;
        
        echo sprintf("  %s %-30s: %-20s (%s expected)\n", 
            $status, 
            $info['name'], 
            $displayValue,
            $info['expected']
        );
    }
    
    echo "\n";
    echo "  TIER 3 Status: {$tier3Pass}/{$tier3Total} metrics working\n";
    echo "\n";
    
    // =========================================================================
    // OVERALL SUMMARY
    // =========================================================================
    echo "┌─────────────────────────────────────────────────────────────────┐\n";
    echo "│ OVERALL SUMMARY                                                 │\n";
    echo "└─────────────────────────────────────────────────────────────────┘\n";
    echo "\n";
    
    $totalPass = $tier1Pass + $tier2Pass + $tier3Pass;
    $totalMetrics = $tier1Total + $tier2Total + $tier3Total;
    $percentage = round(($totalPass / $totalMetrics) * 100, 1);
    
    echo "  TIER 1 (Critical):        {$tier1Pass}/{$tier1Total} (" . round(($tier1Pass/$tier1Total)*100, 1) . "%)\n";
    echo "  TIER 2 (System-wide):     {$tier2Pass}/{$tier2Total} (" . round(($tier2Pass/$tier2Total)*100, 1) . "%)\n";
    echo "  TIER 3 (Application):     {$tier3Pass}/{$tier3Total} (" . round(($tier3Pass/$tier3Total)*100, 1) . "%)\n";
    echo "\n";
    echo "  TOTAL:                    {$totalPass}/{$totalMetrics} metrics working ({$percentage}%)\n";
    echo "\n";
    
    // Verdict
    if ($percentage == 100) {
        echo "╔═══════════════════════════════════════════════════════════════════╗\n";
        echo "║  🎉 PERFECT! ALL METRICS WORKING 100%!                           ║\n";
        echo "╚═══════════════════════════════════════════════════════════════════╝\n";
    } elseif ($percentage >= 90) {
        echo "╔═══════════════════════════════════════════════════════════════════╗\n";
        echo "║  ✅ EXCELLENT! Most metrics working ({$percentage}%)                        ║\n";
        echo "╚═══════════════════════════════════════════════════════════════════╝\n";
    } elseif ($percentage >= 75) {
        echo "╔═══════════════════════════════════════════════════════════════════╗\n";
        echo "║  ⚠️  GOOD! Majority metrics working ({$percentage}%)                        ║\n";
        echo "╚═══════════════════════════════════════════════════════════════════╝\n";
    } else {
        echo "╔═══════════════════════════════════════════════════════════════════╗\n";
        echo "║  ❌ ATTENTION NEEDED! Only {$percentage}% metrics working                ║\n";
        echo "╚═══════════════════════════════════════════════════════════════════╝\n";
    }
    
    echo "\n";
    
    // Show issues if any
    if ($percentage < 100) {
        echo "ISSUES DETECTED:\n";
        
        foreach (array_merge($tier1, $tier2, $tier3) as $key => $info) {
            $value = $metrics[$key] ?? null;
            if ($value === null || $value === false) {
                echo "  ❌ {$info['name']} ({$key}): Not working or returning null\n";
            }
        }
        
        echo "\n";
    }
    
    // Database test
    echo "┌─────────────────────────────────────────────────────────────────┐\n";
    echo "│ DATABASE VERIFICATION                                           │\n";
    echo "└─────────────────────────────────────────────────────────────────┘\n";
    echo "\n";
    
    $latestRecord = DB::table('server_metrics')->latest('id')->first();
    
    if ($latestRecord) {
        echo "  Latest DB Record: ID {$latestRecord->id}\n";
        echo "  Created At: {$latestRecord->created_at}\n";
        echo "\n";
        echo "  Sample values from DB:\n";
        echo "    CPU: {$latestRecord->cpu_usage_percent}%\n";
        echo "    Memory: {$latestRecord->memory_usage_percent}%\n";
        echo "    Disk Queue: {$latestRecord->disk_queue_length}\n";
        echo "    API Response: " . ($latestRecord->app_response_time_ms ?? 'NULL') . " ms\n";
        echo "    MySQL Reads: " . ($latestRecord->mysql_reads_per_sec ?? '0') . " queries/s\n";
        echo "\n";
        
        // Check if TIER 3 is in database
        if ($latestRecord->app_response_time_ms !== null || 
            $latestRecord->mysql_reads_per_sec !== null || 
            $latestRecord->mysql_writes_per_sec !== null) {
            echo "  ✅ TIER 3 data is being saved to database!\n";
        } else {
            echo "  ⚠️  TIER 3 data might not be saving to database properly.\n";
        }
    } else {
        echo "  ❌ No records found in database!\n";
    }
    
    echo "\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n";
