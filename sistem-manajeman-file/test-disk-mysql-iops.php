<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\WindowsMetricsService;
use Illuminate\Support\Facades\DB;

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════════╗\n";
echo "║    DISK & MYSQL IOPS VERIFICATION TEST                           ║\n";
echo "╚═══════════════════════════════════════════════════════════════════╝\n";
echo "\n";

$service = new WindowsMetricsService();

// =========================================================================
// STEP 1: BASELINE MEASUREMENT (IDLE STATE)
// =========================================================================
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ STEP 1: BASELINE MEASUREMENT (Idle State)                       │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

$baseline = $service->getMetrics();

echo "TIER 2 - System-wide Disk IOPS:\n";
echo "  Disk Reads/sec:  " . $baseline['disk_reads_per_sec'] . "\n";
echo "  Disk Writes/sec: " . $baseline['disk_writes_per_sec'] . "\n";
echo "\n";

echo "TIER 3 - MySQL-specific IOPS:\n";
echo "  MySQL Reads/sec:  " . $baseline['mysql_reads_per_sec'] . "\n";
echo "  MySQL Writes/sec: " . $baseline['mysql_writes_per_sec'] . "\n";
echo "\n";

// =========================================================================
// STEP 2: VERIFY DISK IOPS IMPLEMENTATION
// =========================================================================
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ STEP 2: Test Disk IOPS Implementation                           │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

echo "Testing PowerShell commands...\n\n";

// Test Disk Reads command
echo "Command: Get-Counter \"\\PhysicalDisk(_Total)\\Disk Reads/sec\"\n";
$output = [];
exec('powershell -Command "(Get-Counter \"\\PhysicalDisk(_Total)\\Disk Reads/sec\").CounterSamples.CookedValue"', $output);
echo "Raw Output: " . (isset($output[0]) ? $output[0] : 'EMPTY') . "\n";
echo "Parsed Value: " . (isset($output[0]) && is_numeric($output[0]) ? round((float)$output[0], 2) : '0.00') . " reads/sec\n";
echo "\n";

// Test Disk Writes command
echo "Command: Get-Counter \"\\PhysicalDisk(_Total)\\Disk Writes/sec\"\n";
$output = [];
exec('powershell -Command "(Get-Counter \"\\PhysicalDisk(_Total)\\Disk Writes/sec\").CounterSamples.CookedValue"', $output);
echo "Raw Output: " . (isset($output[0]) ? $output[0] : 'EMPTY') . "\n";
echo "Parsed Value: " . (isset($output[0]) && is_numeric($output[0]) ? round((float)$output[0], 2) : '0.00') . " writes/sec\n";
echo "\n";

// =========================================================================
// STEP 3: VERIFY MYSQL IOPS IMPLEMENTATION
// =========================================================================
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ STEP 3: Test MySQL IOPS Implementation                          │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

// Check if MySQL process exists
echo "Checking MySQL process...\n";
$cmd = 'powershell -Command "Get-Process -Name mysqld -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"';
$mysqlPid = trim(shell_exec($cmd));

if (empty($mysqlPid)) {
    echo "  ⚠️  MySQL process NOT FOUND!\n";
    echo "  MySQL IOPS akan selalu 0 karena process mysqld tidak running.\n";
    echo "  Note: Laragon mungkin menggunakan 'mariadbd' bukan 'mysqld'.\n\n";
    
    // Try mariadb
    echo "Trying MariaDB process...\n";
    $cmd = 'powershell -Command "Get-Process -Name mariadbd -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"';
    $mariaPid = trim(shell_exec($cmd));
    
    if (!empty($mariaPid)) {
        echo "  ✅ MariaDB process FOUND! (PID: $mariaPid)\n";
        echo "  ⚠️  Code perlu diupdate untuk support 'mariadbd' process name.\n\n";
    } else {
        echo "  ❌ MariaDB process juga NOT FOUND!\n\n";
    }
} else {
    echo "  ✅ MySQL process FOUND! (PID: $mysqlPid)\n\n";
    
    // Test MySQL IOPS counter
    echo "Command: Get-Counter '\\Process(mysqld*)\\IO Read Operations/sec'\n";
    $cmd = "powershell -Command \"Get-Counter '\\Process(mysqld*)\\IO Read Operations/sec','\\Process(mysqld*)\\IO Write Operations/sec' -SampleInterval 1 -MaxSamples 1 | Select-Object -ExpandProperty CounterSamples | Select-Object Path, CookedValue | ConvertTo-Json\"";
    $output = shell_exec($cmd);
    
    if (!empty($output)) {
        echo "Raw JSON Output:\n";
        echo $output . "\n\n";
        
        $data = json_decode($output, true);
        if (is_array($data)) {
            echo "Parsed Values:\n";
            foreach ($data as $counter) {
                if (isset($counter['Path']) && isset($counter['CookedValue'])) {
                    $type = stripos($counter['Path'], 'read') !== false ? 'Reads' : 'Writes';
                    echo "  $type: " . round((float)$counter['CookedValue'], 2) . " ops/sec\n";
                }
            }
        }
    } else {
        echo "  ❌ Command returned EMPTY output!\n";
    }
}

echo "\n";

// =========================================================================
// STEP 4: GENERATE DISK ACTIVITY
// =========================================================================
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ STEP 4: Generate Disk Activity                                  │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

echo "Creating temporary file with 10MB data...\n";
$tempFile = storage_path('app/test-disk-activity.tmp');
$data = str_repeat('X', 1024 * 1024); // 1MB chunk

$startTime = microtime(true);
for ($i = 0; $i < 10; $i++) {
    file_put_contents($tempFile, $data, FILE_APPEND);
}
$duration = round((microtime(true) - $startTime) * 1000, 2);

echo "  ✅ Written 10MB in {$duration}ms\n";
echo "  File: $tempFile\n\n";

echo "Waiting 2 seconds for metrics to update...\n";
sleep(2);

$afterDisk = $service->getMetrics();

echo "\nDisk IOPS After File Write:\n";
echo "  Disk Reads/sec:  " . $afterDisk['disk_reads_per_sec'] . " (baseline: {$baseline['disk_reads_per_sec']})\n";
echo "  Disk Writes/sec: " . $afterDisk['disk_writes_per_sec'] . " (baseline: {$baseline['disk_writes_per_sec']})\n";

if ($afterDisk['disk_writes_per_sec'] > $baseline['disk_writes_per_sec']) {
    echo "  ✅ Disk Writes INCREASED! Metric is WORKING!\n";
} else {
    echo "  ⚠️  Disk Writes did not increase (metrics might be cached or too slow to update)\n";
}

// Cleanup
@unlink($tempFile);
echo "\n";

// =========================================================================
// STEP 5: GENERATE MYSQL ACTIVITY
// =========================================================================
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ STEP 5: Generate MySQL Activity                                 │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

echo "Executing 100 database queries...\n";

$startTime = microtime(true);

// Create test table if not exists
DB::statement('CREATE TABLE IF NOT EXISTS test_iops_verification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)');

// Insert operations (Writes)
for ($i = 0; $i < 50; $i++) {
    DB::table('test_iops_verification')->insert([
        'data' => 'Test data ' . $i
    ]);
}

// Select operations (Reads)
for ($i = 0; $i < 50; $i++) {
    DB::table('test_iops_verification')->select('*')->limit(10)->get();
}

$duration = round((microtime(true) - $startTime) * 1000, 2);

echo "  ✅ Executed 100 queries in {$duration}ms\n";
echo "  (50 INSERTs + 50 SELECTs)\n\n";

echo "Waiting 2 seconds for metrics to update...\n";
sleep(2);

$afterMysql = $service->getMetrics();

echo "\nMySQL IOPS After Database Activity:\n";
echo "  MySQL Reads/sec:  " . $afterMysql['mysql_reads_per_sec'] . " (baseline: {$baseline['mysql_reads_per_sec']})\n";
echo "  MySQL Writes/sec: " . $afterMysql['mysql_writes_per_sec'] . " (baseline: {$baseline['mysql_writes_per_sec']})\n";

if ($afterMysql['mysql_reads_per_sec'] > 0 || $afterMysql['mysql_writes_per_sec'] > 0) {
    echo "  ✅ MySQL IOPS is NON-ZERO! Metric is WORKING!\n";
} else {
    echo "  ❌ MySQL IOPS is still ZERO! Metric is NOT WORKING!\n";
    echo "  Possible reasons:\n";
    echo "    1. Process name is 'mariadbd' not 'mysqld'\n";
    echo "    2. Performance counter name is incorrect\n";
    echo "    3. MySQL/MariaDB is not running\n";
}

// Cleanup
DB::statement('DROP TABLE IF EXISTS test_iops_verification');

echo "\n";

// =========================================================================
// SUMMARY
// =========================================================================
echo "┌─────────────────────────────────────────────────────────────────┐\n";
echo "│ SUMMARY & VERDICT                                               │\n";
echo "└─────────────────────────────────────────────────────────────────┘\n";

$diskWorking = $afterDisk['disk_writes_per_sec'] > 0;
$mysqlWorking = $afterMysql['mysql_reads_per_sec'] > 0 || $afterMysql['mysql_writes_per_sec'] > 0;

echo "\n";
echo "TIER 2 - Disk IOPS:\n";
if ($diskWorking) {
    echo "  Status: ✅ WORKING\n";
    echo "  Implementation: PowerShell Get-Counter with CookedValue\n";
    echo "  Counter: \\PhysicalDisk(_Total)\\Disk Reads/sec & Writes/sec\n";
    echo "  Verdict: Metrics accurately reflect system-wide disk activity\n";
} else {
    echo "  Status: ⚠️  QUESTIONABLE\n";
    echo "  Issue: Values might be too low or update too slowly\n";
    echo "  Recommendation: Test with larger file operations\n";
}

echo "\n";
echo "TIER 3 - MySQL IOPS:\n";
if ($mysqlWorking) {
    echo "  Status: ✅ WORKING\n";
    echo "  Implementation: PowerShell Process Counter\n";
    echo "  Counter: \\Process(mysqld*)\\IO Read/Write Operations/sec\n";
    echo "  Verdict: Metrics accurately track MySQL-specific I/O\n";
} else {
    echo "  Status: ❌ NOT WORKING\n";
    echo "  Issue: Process name mismatch (mysqld vs mariadbd)\n";
    echo "  Recommendation: Update code to detect correct process name\n";
}

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════════╗\n";
if ($diskWorking && $mysqlWorking) {
    echo "║  ✅ ALL METRICS WORKING CORRECTLY!                               ║\n";
} elseif ($diskWorking || $mysqlWorking) {
    echo "║  ⚠️  PARTIAL FUNCTIONALITY - Some metrics need fixing            ║\n";
} else {
    echo "║  ❌ METRICS NOT FUNCTIONING - Code update needed                 ║\n";
}
echo "╚═══════════════════════════════════════════════════════════════════╝\n";
echo "\n";
