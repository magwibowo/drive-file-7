<?php

require __DIR__ . '/vendor/autoload.php';

$app = require __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "\n╔════════════════════════════════════════════════════════════════╗\n";
echo "║        COMPREHENSIVE NAS MONITORING SERVICE TEST              ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

$service = new App\Services\NasMonitoringService();
$reflection = new ReflectionClass($service);

$tests = [
    'isNasAvailable' => ['unit' => '', 'expected' => 'boolean'],
    'getNasFreeSpace' => ['unit' => 'bytes', 'expected' => 'numeric'],
    'getNasTotalSpace' => ['unit' => 'bytes', 'expected' => 'numeric'],
    'getNasUsedSpace' => ['unit' => 'bytes', 'expected' => 'numeric'],
    'getNasUsagePercent' => ['unit' => '%', 'expected' => '0-100'],
    'getNasLatency' => ['unit' => 'ms', 'expected' => 'numeric or null'],
    'testReadSpeed' => ['unit' => 'MB/s', 'expected' => 'numeric or null'],
    'testWriteSpeed' => ['unit' => 'MB/s', 'expected' => 'numeric or null'],
    'getNasReadIops' => ['unit' => 'IOPS', 'expected' => 'numeric or null'],
    'getNasWriteIops' => ['unit' => 'IOPS', 'expected' => 'numeric or null'],
    'getNasTotalIops' => ['unit' => 'IOPS', 'expected' => 'numeric or null'],
    'getFileCount' => ['unit' => 'files', 'expected' => 'numeric'],
    'getConcurrentUsers' => ['unit' => 'users', 'expected' => 'numeric'],
];

$results = [];
$passed = 0;
$failed = 0;

foreach ($tests as $methodName => $info) {
    echo "Testing {$methodName}()...\n";
    
    try {
        $method = $reflection->getMethod($methodName);
        $method->setAccessible(true);
        
        $startTime = microtime(true);
        $result = $method->invoke($service);
        $duration = round((microtime(true) - $startTime) * 1000, 2);
        
        // Validation
        $isValid = true;
        $validationMsg = '';
        
        if ($info['expected'] === 'boolean' && !is_bool($result)) {
            $isValid = false;
            $validationMsg = "Expected boolean, got " . gettype($result);
        } elseif ($info['expected'] === 'numeric' && !is_numeric($result)) {
            $isValid = false;
            $validationMsg = "Expected numeric, got " . gettype($result);
        } elseif ($info['expected'] === 'numeric or null' && !is_numeric($result) && $result !== null) {
            $isValid = false;
            $validationMsg = "Expected numeric or null, got " . gettype($result);
        } elseif ($info['expected'] === '0-100' && (floatval($result) < 0 || floatval($result) > 100)) {
            $isValid = false;
            $validationMsg = "Value out of range: " . $result;
        }
        
        $status = $isValid ? '✅ PASS' : '❌ FAIL';
        if ($isValid) {
            $passed++;
        } else {
            $failed++;
        }
        
        // Format result
        $displayValue = $result;
        if (is_bool($result)) {
            $displayValue = $result ? 'TRUE' : 'FALSE';
        } elseif (is_numeric($result) && $result > 1000) {
            $displayValue = number_format($result, 2);
        } elseif ($result === null) {
            $displayValue = 'NULL';
        }
        
        echo "  {$status} Result: {$displayValue} {$info['unit']}\n";
        echo "  ⏱️  Duration: {$duration}ms\n";
        
        if (!$isValid) {
            echo "  ⚠️  Issue: {$validationMsg}\n";
        }
        
        echo "\n";
        
        $results[$methodName] = [
            'status' => $isValid,
            'result' => $result,
            'duration' => $duration,
            'validation' => $validationMsg,
        ];
        
    } catch (Exception $e) {
        echo "  ❌ FAIL - Exception: " . $e->getMessage() . "\n\n";
        $failed++;
        $results[$methodName] = [
            'status' => false,
            'error' => $e->getMessage(),
        ];
    }
}

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║                         TEST SUMMARY                           ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

echo "Total Tests: " . count($tests) . "\n";
echo "✅ Passed: {$passed}\n";
echo "❌ Failed: {$failed}\n";
echo "Success Rate: " . round(($passed / count($tests)) * 100, 2) . "%\n\n";

// Check for potential issues
echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║                      POTENTIAL ISSUES                          ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

$issues = [];

// Check Total IOPS calculation
if (isset($results['getNasReadIops']['result']) && isset($results['getNasWriteIops']['result']) && isset($results['getNasTotalIops']['result'])) {
    $readIops = $results['getNasReadIops']['result'] ?? 0;
    $writeIops = $results['getNasWriteIops']['result'] ?? 0;
    $totalIops = $results['getNasTotalIops']['result'] ?? 0;
    
    $expectedTotal = round(($readIops ?? 0) + ($writeIops ?? 0), 2);
    if (abs($totalIops - $expectedTotal) > 0.1) {
        $issues[] = "⚠️  Total IOPS mismatch: Expected {$expectedTotal}, got {$totalIops}";
    }
}

// Check disk space calculation
if (isset($results['getNasFreeSpace']['result']) && isset($results['getNasTotalSpace']['result']) && isset($results['getNasUsedSpace']['result'])) {
    $free = $results['getNasFreeSpace']['result'];
    $total = $results['getNasTotalSpace']['result'];
    $used = $results['getNasUsedSpace']['result'];
    
    $expectedUsed = $total - $free;
    if ($used !== $expectedUsed) {
        $issues[] = "⚠️  Disk space calculation error: Used ({$used}) != Total - Free ({$expectedUsed})";
    }
}

// Check usage percent
if (isset($results['getNasUsagePercent']['result']) && isset($results['getNasTotalSpace']['result']) && isset($results['getNasUsedSpace']['result'])) {
    $usagePercent = $results['getNasUsagePercent']['result'];
    $total = $results['getNasTotalSpace']['result'];
    $used = $results['getNasUsedSpace']['result'];
    
    if ($total > 0) {
        $expectedPercent = round(($used / $total) * 100, 2);
        if (abs($usagePercent - $expectedPercent) > 0.1) {
            $issues[] = "⚠️  Usage percent mismatch: Expected {$expectedPercent}%, got {$usagePercent}%";
        }
    }
}

// Check if latency is suspiciously constant
if (isset($results['getNasLatency']['result']) && $results['getNasLatency']['result'] === 1) {
    $issues[] = "⚠️  Latency is 1ms (possibly pinging localhost instead of real NAS)";
}

// Check concurrent users
if (isset($results['getConcurrentUsers']['result']) && $results['getConcurrentUsers']['result'] === 0) {
    $issues[] = "ℹ️  Concurrent users is 0 (normal if no active sessions)";
}

if (empty($issues)) {
    echo "✅ No issues detected!\n\n";
} else {
    foreach ($issues as $issue) {
        echo "{$issue}\n";
    }
    echo "\n";
}

echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║                    PERFORMANCE ANALYSIS                        ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n\n";

// Calculate total execution time
$totalDuration = array_sum(array_column(array_filter($results, fn($r) => isset($r['duration'])), 'duration'));
echo "Total Execution Time: " . round($totalDuration, 2) . "ms\n";
echo "Average per Test: " . round($totalDuration / count($tests), 2) . "ms\n\n";

// Identify slow operations
$slowOperations = array_filter($results, fn($r) => isset($r['duration']) && $r['duration'] > 100);
if (!empty($slowOperations)) {
    echo "⚠️  Slow Operations (>100ms):\n";
    foreach ($slowOperations as $method => $data) {
        echo "  - {$method}: " . round($data['duration'], 2) . "ms\n";
    }
} else {
    echo "✅ All operations completed quickly (<100ms)\n";
}

echo "\n✅ Test Complete!\n";
