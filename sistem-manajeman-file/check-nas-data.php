<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Checking NAS Metrics Data ===\n\n";

// Check table exists
$count = \App\Models\NasMetric::count();
echo "Total Records: $count\n\n";

if ($count > 0) {
    $latest = \App\Models\NasMetric::latest()->first();
    echo "Latest Record:\n";
    echo "  ID: {$latest->id}\n";
    echo "  Available: " . ($latest->nas_available ? 'YES' : 'NO') . "\n";
    echo "  IP: {$latest->nas_ip}\n";
    echo "  Drive: {$latest->nas_drive}\n";
    echo "  Usage: {$latest->nas_usage_percent}%\n";
    echo "  Status: {$latest->status_text}\n";
    echo "  Created: {$latest->created_at}\n\n";
    
    echo "Raw Data:\n";
    print_r($latest->toArray());
} else {
    echo "⚠️ No data found! Run php test-nas-simulation.php first.\n";
}
