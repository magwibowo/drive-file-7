<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\NasMonitoringService;

echo "=== Testing NasMonitoringService ===\n\n";

$service = app(NasMonitoringService::class);

echo "Getting metrics...\n\n";
$metrics = $service->getMetrics();

echo "Results:\n";
foreach ($metrics as $key => $value) {
    if (is_bool($value)) {
        $value = $value ? 'true' : 'false';
    } elseif (is_null($value)) {
        $value = 'null';
    } elseif (is_numeric($value)) {
        $value = number_format($value, 2);
    }
    
    echo "  $key: $value\n";
}

echo "\n✅ Service working!\n";
