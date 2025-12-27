<?php

/**
 * NAS Connection Test Script
 * 
 * Script untuk testing koneksi dan konfigurasi NAS sebelum integrasi penuh.
 * 
 * Usage:
 *   php test-nas-connection.php
 * 
 * @author System Integration Team
 * @version 1.0.0
 * @since 2025-12-27
 */

require __DIR__ . '/vendor/autoload.php';

use App\Services\NasMonitoringService;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

echo "╔══════════════════════════════════════════════════════════════════╗\n";
echo "║              NAS CONNECTION & CONFIGURATION TEST                 ║\n";
echo "╚══════════════════════════════════════════════════════════════════╝\n\n";

// Configuration
$nasIp = env('NAS_IP', '192.168.1.100');
$nasDrive = env('NAS_DRIVE_LETTER', 'Z:');
$nasShareName = env('NAS_SHARE_NAME', 'LaravelStorage');

echo "📋 CONFIGURATION\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "NAS IP Address:    {$nasIp}\n";
echo "Drive Letter:      {$nasDrive}\n";
echo "Share Name:        {$nasShareName}\n";
echo "UNC Path:          \\\\{$nasIp}\\{$nasShareName}\n";
echo "\n";

// Test 1: Ping to NAS
echo "🔍 TEST 1: Network Connectivity (Ping)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
$output = [];
$returnCode = 0;
exec("ping -n 1 {$nasIp}", $output, $returnCode);

if ($returnCode === 0) {
    echo "✅ PASS - NAS is reachable\n";
    
    foreach ($output as $line) {
        if (preg_match('/time[<=](\d+)ms/i', $line, $matches)) {
            $latency = $matches[1];
            echo "   Latency: {$latency}ms ";
            
            if ($latency < 10) {
                echo "(⚡ Excellent)\n";
            } elseif ($latency < 30) {
                echo "(✓ Good)\n";
            } elseif ($latency < 50) {
                echo "(⚠ Fair)\n";
            } else {
                echo "(❌ Poor - High latency!)\n";
            }
            break;
        }
    }
} else {
    echo "❌ FAIL - Cannot reach NAS at {$nasIp}\n";
    echo "   Check:\n";
    echo "   - NAS is powered on\n";
    echo "   - Network cable is connected\n";
    echo "   - IP address is correct\n";
    echo "   - Firewall is not blocking ICMP\n";
}
echo "\n";

// Test 2: SMB Port Check
echo "🔍 TEST 2: SMB Service Availability (Port 445)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
$connection = @fsockopen($nasIp, 445, $errno, $errstr, 5);
if ($connection) {
    echo "✅ PASS - SMB port 445 is open\n";
    fclose($connection);
} else {
    echo "❌ FAIL - Cannot connect to SMB port 445\n";
    echo "   Error: {$errstr} (Code: {$errno})\n";
    echo "   Check:\n";
    echo "   - SMB/CIFS service is running on NAS\n";
    echo "   - Firewall allows port 445\n";
}
echo "\n";

// Test 3: Drive Mapping Check
echo "🔍 TEST 3: Drive Mapping Status\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
if (file_exists($nasDrive)) {
    echo "✅ PASS - Drive {$nasDrive} is mapped\n";
    
    // Check if readable
    if (is_readable($nasDrive)) {
        echo "✅ PASS - Drive is readable\n";
    } else {
        echo "❌ FAIL - Drive exists but not readable\n";
        echo "   Check permissions\n";
    }
    
    // Check if writable
    if (is_writable($nasDrive)) {
        echo "✅ PASS - Drive is writable\n";
    } else {
        echo "❌ FAIL - Drive exists but not writable\n";
        echo "   Check:\n";
        echo "   - NTFS permissions on NAS\n";
        echo "   - Share permissions\n";
        echo "   - User has write access\n";
    }
} else {
    echo "❌ FAIL - Drive {$nasDrive} is not mapped\n";
    echo "   To map the drive, run:\n";
    echo "   net use {$nasDrive} \\\\{$nasIp}\\{$nasShareName} /persistent:yes\n";
}
echo "\n";

// Test 4: NAS Monitoring Service
echo "🔍 TEST 4: NAS Monitoring Service\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
try {
    $nasService = new NasMonitoringService();
    $connectionTest = $nasService->testConnection();
    
    if ($connectionTest['status'] === 'connected') {
        echo "✅ PASS - NAS Monitoring Service working\n";
        echo "   Status:     {$connectionTest['message']}\n";
        echo "   Readable:   " . ($connectionTest['is_readable'] ? 'Yes' : 'No') . "\n";
        echo "   Writable:   " . ($connectionTest['is_writable'] ? 'Yes' : 'No') . "\n";
        
        if ($connectionTest['latency_ms'] !== null) {
            echo "   Latency:    {$connectionTest['latency_ms']}ms\n";
        }
    } else {
        echo "❌ FAIL - {$connectionTest['message']}\n";
    }
} catch (Exception $e) {
    echo "❌ FAIL - Service error: {$e->getMessage()}\n";
}
echo "\n";

// Test 5: Storage Metrics
if (file_exists($nasDrive)) {
    echo "🔍 TEST 5: Storage Capacity\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
    try {
        $nasService = new NasMonitoringService();
        $metrics = $nasService->getMetrics();
        
        $totalGB = round($metrics['nas_total_space'] / (1024**3), 2);
        $usedGB = round($metrics['nas_used_space'] / (1024**3), 2);
        $freeGB = round($metrics['nas_free_space'] / (1024**3), 2);
        $usagePercent = $metrics['nas_usage_percent'];
        
        echo "Total Space:   {$totalGB} GB\n";
        echo "Used Space:    {$usedGB} GB\n";
        echo "Free Space:    {$freeGB} GB\n";
        echo "Usage:         {$usagePercent}% ";
        
        if ($usagePercent >= 90) {
            echo "(🔴 Critical - Consider cleanup or expansion)\n";
        } elseif ($usagePercent >= 75) {
            echo "(🟠 Warning - Monitor closely)\n";
        } else {
            echo "(🟢 Healthy)\n";
        }
        
        if ($metrics['nas_file_count'] > 0) {
            echo "File Count:    " . number_format($metrics['nas_file_count']) . " files\n";
        }
        
    } catch (Exception $e) {
        echo "❌ Error getting storage metrics: {$e->getMessage()}\n";
    }
    echo "\n";
}

// Test 6: Performance Test
if (file_exists($nasDrive) && is_writable($nasDrive)) {
    echo "🔍 TEST 6: Real-Time Performance Monitoring (Live Metrics)\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "⚡ Using Windows Performance Counters for real-time data\n";
    echo "   (Not synthetic benchmark - actual NAS activity)\n\n";
    
    try {
        $nasService = new NasMonitoringService();
        $metrics = $nasService->getMetrics();
        
        // Throughput (MB/s) - Real-time from Performance Counter
        if ($metrics['nas_read_speed'] !== null) {
            $readSpeed = $metrics['nas_read_speed'];
            echo "Read Throughput:  {$readSpeed} MB/s ";
            
            if ($readSpeed >= 100) {
                echo "(⚡ Excellent)\n";
            } elseif ($readSpeed >= 50) {
                echo "(✓ Good)\n";
            } elseif ($readSpeed >= 20) {
                echo "(⚠ Fair)\n";
            } elseif ($readSpeed > 0) {
                echo "(Low activity)\n";
            } else {
                echo "(Idle - No read activity)\n";
            }
        }
        
        if ($metrics['nas_write_speed'] !== null) {
            $writeSpeed = $metrics['nas_write_speed'];
            echo "Write Throughput: {$writeSpeed} MB/s ";
            
            if ($writeSpeed >= 80) {
                echo "(⚡ Excellent)\n";
            } elseif ($writeSpeed >= 40) {
                echo "(✓ Good)\n";
            } elseif ($writeSpeed >= 15) {
                echo "(⚠ Fair)\n";
            } elseif ($writeSpeed > 0) {
                echo "(Low activity)\n";
            } else {
                echo "(Idle - No write activity)\n";
            }
        }
        
        echo "\n";
        
        // IOPS (Operations/sec) - Real-time from Performance Counter
        if ($metrics['nas_read_iops'] !== null) {
            $readIops = $metrics['nas_read_iops'];
            echo "Read IOPS:        {$readIops} ops/sec\n";
        }
        
        if ($metrics['nas_write_iops'] !== null) {
            $writeIops = $metrics['nas_write_iops'];
            echo "Write IOPS:       {$writeIops} ops/sec\n";
        }
        
        if ($metrics['nas_total_iops'] !== null) {
            $totalIops = $metrics['nas_total_iops'];
            echo "Total IOPS:       {$totalIops} ops/sec ";
            
            if ($totalIops < 50) {
                echo "(🟢 Low load)\n";
            } elseif ($totalIops < 150) {
                echo "(🟡 Moderate load)\n";
            } elseif ($totalIops < 500) {
                echo "(🟠 High load)\n";
            } else {
                echo "(🔴 Very high load)\n";
            }
        }
        
        echo "\n💡 Note: Metrics show CURRENT activity at the moment of measurement.\n";
        echo "   For sustained monitoring, use the dashboard with auto-refresh.\n";
        
    } catch (Exception $e) {
        echo "❌ Error during performance test: {$e->getMessage()}\n";
    }
    echo "\n";
}

// Summary
echo "╔══════════════════════════════════════════════════════════════════╗\n";
echo "║                          TEST SUMMARY                            ║\n";
echo "╚══════════════════════════════════════════════════════════════════╝\n\n";

echo "Next Steps:\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

if (!file_exists($nasDrive)) {
    echo "1. Map NAS drive:\n";
    echo "   net use {$nasDrive} \\\\{$nasIp}\\{$nasShareName} /persistent:yes\n\n";
}

echo "2. Run database migration:\n";
echo "   php artisan migrate\n\n";

echo "3. Update .env file:\n";
echo "   NAS_ENABLED=true\n";
echo "   NAS_IP={$nasIp}\n";
echo "   NAS_DRIVE_LETTER={$nasDrive}\n";
echo "   NAS_SHARE_NAME={$nasShareName}\n";
echo "   FILESYSTEM_DISK=nas  # (optional - to use NAS as default)\n\n";

echo "4. Test API endpoints:\n";
echo "   GET  /api/admin/nas-metrics/test\n";
echo "   POST /api/admin/nas-metrics/poll\n";
echo "   GET  /api/admin/nas-metrics/latest\n\n";

echo "5. Access NAS Monitor in browser:\n";
echo "   SuperAdmin → Settings → NAS Monitor Tab\n\n";

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Test completed at: " . date('Y-m-d H:i:s') . "\n";
