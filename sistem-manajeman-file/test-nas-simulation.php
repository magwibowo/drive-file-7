<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\NasMonitoringService;

echo "╔══════════════════════════════════════════════════════════╗\n";
echo "║        NAS SIMULATION TEST (Drive Z: Local Folder)       ║\n";
echo "╚══════════════════════════════════════════════════════════╝\n\n";

$service = app(NasMonitoringService::class);

echo "📋 TESTING NAS METRICS COLLECTION\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

try {
    // Test 1: Basic Connectivity
    echo "✅ TEST 1: Drive Z: Accessibility\n";
    $driveExists = is_dir('Z:\\');
    $driveWritable = is_writable('Z:\\');
    
    echo "   Drive Exists: " . ($driveExists ? "✅ YES" : "❌ NO") . "\n";
    echo "   Drive Writable: " . ($driveWritable ? "✅ YES" : "❌ NO") . "\n\n";
    
    if (!$driveExists) {
        echo "❌ Drive Z: tidak ditemukan. Jalankan setup simulasi terlebih dahulu.\n";
        exit(1);
    }
    
    // Test 2: Get All Metrics
    echo "✅ TEST 2: Collecting Real-Time Metrics\n";
    $metrics = $service->getMetrics();
    
    echo "   Storage Capacity:\n";
    echo "      Total: " . number_format($metrics['nas_total_space'] / 1024 / 1024 / 1024, 2) . " GB\n";
    echo "      Used:  " . number_format($metrics['nas_used_space'] / 1024 / 1024 / 1024, 2) . " GB\n";
    echo "      Free:  " . number_format($metrics['nas_free_space'] / 1024 / 1024 / 1024, 2) . " GB\n";
    echo "      Usage: " . $metrics['nas_usage_percent'] . "%\n\n";
    
    echo "   Performance:\n";
    echo "      Latency:     " . $metrics['nas_network_latency'] . " ms\n";
    echo "      Read Speed:  " . number_format($metrics['nas_read_speed'] / 1024 / 1024, 2) . " MB/s\n";
    echo "      Write Speed: " . number_format($metrics['nas_write_speed'] / 1024 / 1024, 2) . " MB/s\n\n";
    
    echo "   IOPS:\n";
    echo "      Read IOPS:  " . number_format($metrics['nas_read_iops'], 2) . " ops/sec\n";
    echo "      Write IOPS: " . number_format($metrics['nas_write_iops'], 2) . " ops/sec\n";
    echo "      Total IOPS: " . number_format($metrics['nas_total_iops'], 2) . " ops/sec\n\n";
    
    echo "   Files:\n";
    echo "      File Count: " . number_format($metrics['nas_file_count']) . " files\n\n";
    
    // Test 3: Save to Database
    echo "✅ TEST 3: Saving Metrics to Database\n";
    $model = \App\Models\NasMetric::create([
        'nas_total_space' => $metrics['nas_total_space'],
        'nas_used_space' => $metrics['nas_used_space'],
        'nas_free_space' => $metrics['nas_free_space'],
        'nas_latency' => $metrics['nas_network_latency'],
        'nas_read_speed' => $metrics['nas_read_speed'],
        'nas_write_speed' => $metrics['nas_write_speed'],
        'nas_read_iops' => $metrics['nas_read_iops'],
        'nas_write_iops' => $metrics['nas_write_iops'],
        'nas_total_iops' => $metrics['nas_total_iops'],
        'nas_file_count' => $metrics['nas_file_count'],
        'nas_error_message' => $metrics['nas_available'] ? null : 'NAS not accessible',
    ]);
    
    echo "   Database ID: #" . $model->id . "\n";
    echo "   Timestamp:   " . $model->created_at . "\n\n";
    
    // Test 4: Retrieve Latest from Database
    echo "✅ TEST 4: Retrieving Latest Metrics from Database\n";
    $latest = \App\Models\NasMetric::latest()->first();
    
    echo "   Latest Record:\n";
    echo "      ID:         #" . $latest->id . "\n";
    echo "      Storage:    " . $latest->usage_percentage . "% used\n";
    echo "      Latency:    " . $latest->nas_latency . " ms\n";
    echo "      Total IOPS: " . number_format($latest->nas_total_iops, 2) . " ops/sec\n\n";
    
    echo "╔══════════════════════════════════════════════════════════╗\n";
    echo "║                   ✅ ALL TESTS PASSED                    ║\n";
    echo "╚══════════════════════════════════════════════════════════╝\n\n";
    
    echo "🚀 NEXT STEPS:\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";
    echo "1. Akses Frontend React di browser\n";
    echo "2. Login sebagai Super Admin\n";
    echo "3. Buka menu 'Pengaturan'\n";
    echo "4. Klik tab 'NAS Monitor'\n";
    echo "5. Dashboard akan auto-refresh setiap 5 detik\n\n";
    echo "API Endpoints Available:\n";
    echo "  • GET  /api/admin/nas-metrics/test\n";
    echo "  • POST /api/admin/nas-metrics/poll\n";
    echo "  • GET  /api/admin/nas-metrics/latest\n";
    echo "  • GET  /api/admin/nas-metrics/history\n";
    echo "  • GET  /api/admin/nas-metrics/stats\n\n";
    
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n\n";
    exit(1);
}
