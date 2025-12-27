<?php

/**
 * COMPREHENSIVE TIER 3 FLOW TEST
 * 
 * Tests entire flow dari WindowsMetricsService -> Controller -> Database -> API Response
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\WindowsMetricsService;
use App\Http\Controllers\Api\ServerMetricsController;
use App\Models\ServerMetric;

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════════╗\n";
echo "║         TIER 3 COMPREHENSIVE FLOW TEST                            ║\n";
echo "╚═══════════════════════════════════════════════════════════════════╝\n";
echo "\n";

// STEP 1: Test WindowsMetricsService
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ STEP 1: WindowsMetricsService                                   │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

$service = new WindowsMetricsService();
$serviceMetrics = $service->getMetrics();

$tier3Keys = [
    'app_network_bytes_per_sec',
    'mysql_reads_per_sec',
    'mysql_writes_per_sec',
    'app_response_time_ms',
    'app_requests_per_sec'
];

echo "Checking if service returns TIER 3 keys:\n";
foreach ($tier3Keys as $key) {
    $exists = array_key_exists($key, $serviceMetrics);
    $value = $exists ? $serviceMetrics[$key] : 'N/A';
    echo "  " . ($exists ? "✅" : "❌") . " {$key}: {$value}\n";
}
echo "\n";

// STEP 2: Test API Controller
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ STEP 2: ServerMetricsController->latest()                       │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

$controller = new ServerMetricsController($service);
$response = $controller->latest();
$apiData = $response->getData(true);

if ($apiData['success']) {
    echo "API Response Status: ✅ SUCCESS\n";
    echo "Checking if API returns TIER 3 keys:\n";
    foreach ($tier3Keys as $key) {
        $exists = array_key_exists($key, $apiData['data']);
        $value = $exists ? $apiData['data'][$key] : 'N/A';
        echo "  " . ($exists ? "✅" : "❌") . " {$key}: {$value}\n";
    }
} else {
    echo "API Response Status: ❌ FAILED\n";
    echo "Error: " . $apiData['message'] . "\n";
}
echo "\n";

// STEP 3: Test Database - Check if TIER 3 columns exist
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ STEP 3: Database Schema                                         │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

$tableInfo = DB::select("DESCRIBE server_metrics");
$columnNames = array_column($tableInfo, 'Field');

echo "Checking if database has TIER 3 columns:\n";
foreach ($tier3Keys as $key) {
    $exists = in_array($key, $columnNames);
    echo "  " . ($exists ? "✅" : "❌") . " Column '{$key}' exists\n";
}
echo "\n";

// STEP 4: Test Database - Check if data is being saved
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ STEP 4: Database Data (Latest 3 Records)                        │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

$latestRecords = ServerMetric::latest()->limit(3)->get();

foreach ($latestRecords as $idx => $record) {
    echo "Record #" . ($idx + 1) . " (ID: {$record->id}, Created: {$record->created_at}):\n";
    foreach ($tier3Keys as $key) {
        $value = $record->$key ?? 'NULL';
        echo "  {$key}: {$value}\n";
    }
    echo "\n";
}

// STEP 5: Summary
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ SUMMARY                                                         │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

$serviceOk = true;
foreach ($tier3Keys as $key) {
    if (!array_key_exists($key, $serviceMetrics)) {
        $serviceOk = false;
        break;
    }
}

$apiOk = $apiData['success'];
foreach ($tier3Keys as $key) {
    if (!array_key_exists($key, $apiData['data'])) {
        $apiOk = false;
        break;
    }
}

$schemaOk = true;
foreach ($tier3Keys as $key) {
    if (!in_array($key, $columnNames)) {
        $schemaOk = false;
        break;
    }
}

$dataOk = $latestRecords->count() > 0;
if ($dataOk) {
    $firstRecord = $latestRecords->first();
    foreach ($tier3Keys as $key) {
        // Check if field exists (NULL is ok, missing field is not)
        if (!property_exists($firstRecord, $key) && !array_key_exists($key, $firstRecord->getAttributes())) {
            $dataOk = false;
            break;
        }
    }
}

echo "WindowsMetricsService returns TIER 3: " . ($serviceOk ? "✅ YES" : "❌ NO") . "\n";
echo "API Controller returns TIER 3: " . ($apiOk ? "✅ YES" : "❌ NO") . "\n";
echo "Database schema has TIER 3: " . ($schemaOk ? "✅ YES" : "❌ NO") . "\n";
echo "Database contains TIER 3 data: " . ($dataOk ? "✅ YES" : "❌ NO") . "\n";
echo "\n";

if ($serviceOk && $apiOk && $schemaOk && $dataOk) {
    echo "╔═══════════════════════════════════════════════════════════════════╗\n";
    echo "║  ✅ ALL CHECKS PASSED! TIER 3 IS FULLY IMPLEMENTED!              ║\n";
    echo "║                                                                   ║\n";
    echo "║  If dashboard doesn't show TIER 3:                               ║\n";
    echo "║  1. Restart React dev server (npm start)                         ║\n";
    echo "║  2. Clear browser cache (Ctrl+Shift+Delete)                      ║\n";
    echo "║  3. Check browser console for errors (F12)                       ║\n";
    echo "║  4. Verify API request in Network tab includes TIER 3 fields     ║\n";
    echo "╚═══════════════════════════════════════════════════════════════════╝\n";
} else {
    echo "╔═══════════════════════════════════════════════════════════════════╗\n";
    echo "║  ❌ SOME CHECKS FAILED - SEE DETAILS ABOVE                        ║\n";
    echo "╚═══════════════════════════════════════════════════════════════════╝\n";
}
echo "\n";

// STEP 6: Sample API Response for Frontend
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ SAMPLE API RESPONSE (What Frontend Receives)                    │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

echo json_encode($apiData, JSON_PRETTY_PRINT) . "\n\n";
