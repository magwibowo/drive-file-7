<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\ServerMetric;

echo "\n=== CHECK DATABASE TIER 3 ===\n\n";

// Get latest 3 records
$metrics = ServerMetric::latest()->limit(3)->get();

foreach ($metrics as $m) {
    echo "ID: {$m->id} | Created: {$m->created_at}\n";
    echo "  app_network_bytes_per_sec: {$m->app_network_bytes_per_sec}\n";
    echo "  mysql_reads_per_sec: {$m->mysql_reads_per_sec}\n";
    echo "  mysql_writes_per_sec: {$m->mysql_writes_per_sec}\n";
    echo "  app_response_time_ms: " . ($m->app_response_time_ms ?? 'NULL') . "\n";
    echo "  app_requests_per_sec: {$m->app_requests_per_sec}\n";
    echo "\n";
}

echo "=== TIER 3 fields exist in DB: " . (ServerMetric::latest()->first()->app_network_bytes_per_sec !== null ? "YES ✅" : "NO ❌") . "\n\n";
