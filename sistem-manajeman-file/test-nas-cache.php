<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║             NAS MONITORING CACHE TEST                         ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

$service = new App\Services\NasMonitoringService();

echo "Testing cache effectiveness...\n\n";

// Test 1: First call (cold cache)
echo "1st call (cold cache):  ";
$start = microtime(true);
$metrics1 = $service->getMetrics();
$time1 = round((microtime(true) - $start) * 1000, 2);
echo $metrics1['nas_concurrent_users'] . " users - {$time1}ms\n";

// Test 2: Second call (should use cache)
echo "2nd call (warm cache):  ";
$start = microtime(true);
$metrics2 = $service->getMetrics();
$time2 = round((microtime(true) - $start) * 1000, 2);
echo $metrics2['nas_concurrent_users'] . " users - {$time2}ms\n";

// Test 3: Third call (should use cache)
echo "3rd call (warm cache):  ";
$start = microtime(true);
$metrics3 = $service->getMetrics();
$time3 = round((microtime(true) - $start) * 1000, 2);
echo $metrics3['nas_concurrent_users'] . " users - {$time3}ms\n\n";

// Analysis
echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║                       ANALYSIS                                 ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

$speedup = round($time1 / $time2, 2);
echo "Cache Speedup: {$speedup}x faster\n";

// Check IOPS consistency
$iopsConsistent = ($metrics1['nas_total_iops'] === $metrics2['nas_total_iops']);
echo "IOPS Consistency: " . ($iopsConsistent ? '✅ MATCH' : '❌ MISMATCH') . "\n";
echo "  - 1st call: " . $metrics1['nas_total_iops'] . " IOPS\n";
echo "  - 2nd call: " . $metrics2['nas_total_iops'] . " IOPS\n";
echo "  - 3rd call: " . $metrics3['nas_total_iops'] . " IOPS\n\n";

// Check Read IOPS consistency
echo "Read IOPS:\n";
echo "  - 1st call: " . $metrics1['nas_read_iops'] . "\n";
echo "  - 2nd call: " . $metrics2['nas_read_iops'] . "\n";
echo "  - 3rd call: " . $metrics3['nas_read_iops'] . "\n\n";

// Check Write IOPS consistency
echo "Write IOPS:\n";
echo "  - 1st call: " . $metrics1['nas_write_iops'] . "\n";
echo "  - 2nd call: " . $metrics2['nas_write_iops'] . "\n";
echo "  - 3rd call: " . $metrics3['nas_write_iops'] . "\n\n";

// Verify calculation
$expectedTotal = round(($metrics1['nas_read_iops'] ?? 0) + ($metrics1['nas_write_iops'] ?? 0), 2);
$actualTotal = $metrics1['nas_total_iops'];

echo "Total IOPS Calculation:\n";
echo "  Read + Write: {$expectedTotal}\n";
echo "  Actual Total: {$actualTotal}\n";
echo "  Match: " . (abs($expectedTotal - $actualTotal) < 0.1 ? '✅ YES' : '❌ NO') . "\n\n";

echo "✅ Test Complete!\n";
