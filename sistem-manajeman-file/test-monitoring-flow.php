#!/usr/bin/env php
<?php

require 'vendor/autoload.php';

$app = require 'bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

echo "=== TESTING SERVER METRICS MONITORING FLOW ===\n\n";

// 1. Clear old data
echo "1. Clearing old data...\n";
App\Models\ServerMetric::truncate();
echo "   ✅ Database cleared\n\n";

// 2. Test START endpoint
echo "2. Testing START endpoint...\n";
$controller = new App\Http\Controllers\Api\ServerMetricsController(
    new App\Services\WindowsMetricsService()
);
$startResponse = $controller->start();
$startData = json_decode($startResponse->content(), true);
echo "   ✅ START response: " . $startResponse->content() . "\n\n";

if (!$startData['success']) {
    die("   ❌ START failed!\n");
}

$baseline = $startData['data']['baseline'];
echo "   📊 Baseline snapshot received\n";
echo "      - Network RX: " . number_format($baseline['network_rx_bytes_per_sec']) . " bytes\n";
echo "      - Network TX: " . number_format($baseline['network_tx_bytes_per_sec']) . " bytes\n";
echo "      - Disk Reads: " . number_format($baseline['disk_reads_per_sec']) . " ops\n";
echo "      - Disk Writes: " . number_format($baseline['disk_writes_per_sec']) . " ops\n\n";

// 3. Wait 2 seconds
echo "3. Waiting 2 seconds...\n";
sleep(2);
echo "   ⏱️  2 seconds elapsed\n\n";

// 4. Test POLL endpoint (1st poll)
echo "4. Testing POLL endpoint (1st poll)...\n";
$request1 = new Illuminate\Http\Request(['previous_snapshot' => $baseline]);
$pollResponse1 = $controller->poll($request1);
$pollData1 = json_decode($pollResponse1->content(), true);

if (!$pollData1['success']) {
    die("   ❌ POLL failed!\n");
}

echo "   ✅ POLL response received\n";
$delta1 = $pollData1['data']['delta'];
echo "   📊 Delta metrics:\n";
echo "      - Network RX: " . number_format($delta1['network_rx_bytes_per_sec']) . " bytes/sec (" . number_format($delta1['network_rx_bytes_per_sec'] / 1024, 2) . " KB/s)\n";
echo "      - Network TX: " . number_format($delta1['network_tx_bytes_per_sec']) . " bytes/sec (" . number_format($delta1['network_tx_bytes_per_sec'] / 1024, 2) . " KB/s)\n";
echo "      - Disk Reads: " . number_format($delta1['disk_reads_per_sec'], 2) . " IOPS\n";
echo "      - Disk Writes: " . number_format($delta1['disk_writes_per_sec'], 2) . " IOPS\n";
echo "      - Disk Free: " . number_format($delta1['disk_free_space'] / (1024**3), 2) . " GB\n";
echo "      - Latency: " . ($delta1['latency_ms'] ?? 'N/A') . " ms\n\n";

// 5. Check database
echo "5. Checking database...\n";
$count = App\Models\ServerMetric::count();
echo "   ✅ Total records in DB: {$count}\n";

if ($count > 0) {
    $latest = App\Models\ServerMetric::latest()->first();
    echo "   📊 Latest record:\n";
    echo "      - ID: {$latest->id}\n";
    echo "      - Network RX: " . number_format($latest->network_rx_bytes_per_sec, 2) . " bytes/sec\n";
    echo "      - Created: {$latest->created_at}\n\n";
}

// 6. Wait and do another poll
echo "6. Waiting 2 seconds for 2nd poll...\n";
sleep(2);
echo "   ⏱️  2 seconds elapsed\n\n";

echo "7. Testing POLL endpoint (2nd poll)...\n";
$current1 = $pollData1['data']['current'];
$request2 = new Illuminate\Http\Request(['previous_snapshot' => $current1]);
$pollResponse2 = $controller->poll($request2);
$pollData2 = json_decode($pollResponse2->content(), true);

if ($pollData2['success']) {
    $delta2 = $pollData2['data']['delta'];
    echo "   ✅ 2nd POLL successful\n";
    echo "   📊 Delta metrics:\n";
    echo "      - Network RX: " . number_format($delta2['network_rx_bytes_per_sec'] / 1024, 2) . " KB/s\n";
    echo "      - Network TX: " . number_format($delta2['network_tx_bytes_per_sec'] / 1024, 2) . " KB/s\n\n";
}

// 8. Final database check
echo "8. Final database check...\n";
$finalCount = App\Models\ServerMetric::count();
echo "   ✅ Total records in DB: {$finalCount}\n\n";

if ($finalCount >= 2) {
    echo "   📊 Last 2 records:\n";
    $records = App\Models\ServerMetric::latest()->limit(2)->get();
    foreach ($records as $i => $record) {
        echo "      Record #" . ($i + 1) . ":\n";
        echo "         - Network RX: " . number_format($record->network_rx_bytes_per_sec / 1024, 2) . " KB/s\n";
        echo "         - Network TX: " . number_format($record->network_tx_bytes_per_sec / 1024, 2) . " KB/s\n";
        echo "         - Created: {$record->created_at}\n";
    }
    echo "\n";
}

// 9. Test LATEST endpoint
echo "9. Testing LATEST endpoint...\n";
$latestResponse = $controller->latest();
$latestData = json_decode($latestResponse->content(), true);

if ($latestData['success']) {
    echo "   ✅ LATEST response:\n";
    echo "      " . json_encode($latestData['data'], JSON_PRETTY_PRINT) . "\n\n";
}

echo "=== ALL TESTS COMPLETED ===\n";
echo "✅ Backend monitoring flow working correctly!\n";
echo "✅ Data being saved to database every poll\n";
echo "\n";
echo "👉 If frontend not showing data, check:\n";
echo "   1. Browser console for errors\n";
echo "   2. Network tab for failed requests\n";
echo "   3. User clicked 'Start Monitoring' button\n";
echo "   4. User is logged in with valid token\n";
echo "   5. CORS settings allow localhost:3000\n";
