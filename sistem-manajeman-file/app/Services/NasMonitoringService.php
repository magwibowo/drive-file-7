<?php

namespace App\Services;

use Exception;

class NasMonitoringService
{
    private string $nasDrive;
    private string $nasIp;
    private string $nasShareName;
    
    // Cache untuk IOPS measurements (consistency dalam satu request)
    private ?float $cachedReadIops = null;
    private ?float $cachedWriteIops = null;

    public function __construct()
    {
        // Gunakan NAS_DRIVE_PATH untuk full path (e.g., 'Z:\')
        // Fallback ke NAS_DRIVE_LETTER jika NAS_DRIVE_PATH tidak diset
        $drivePath = env('NAS_DRIVE_PATH');
        if ($drivePath) {
            $this->nasDrive = rtrim($drivePath, '\\/') . '\\';
        } else {
            $driveLetter = env('NAS_DRIVE_LETTER', 'Z');
            $this->nasDrive = rtrim($driveLetter, ':') . ':\\';
        }
        
        $this->nasIp = env('NAS_IP', '192.168.1.100');
        $this->nasShareName = env('NAS_SHARE_NAME', 'LaravelStorage');
    }

    /**
     * Ambil semua NAS metrics
     *
     * @return array
     */
    public function getMetrics(): array
    {
        return [
            'nas_available' => $this->isNasAvailable(),
            'nas_ip' => $this->nasIp,
            'nas_drive' => $this->nasDrive,
            'nas_free_space' => $this->getNasFreeSpace(),
            'nas_total_space' => $this->getNasTotalSpace(),
            'nas_used_space' => $this->getNasUsedSpace(),
            'nas_usage_percent' => $this->getNasUsagePercent(),
            'nas_network_latency' => $this->getNasLatency(),
            'nas_read_speed' => $this->testReadSpeed(),
            'nas_write_speed' => $this->testWriteSpeed(),
            'nas_read_iops' => $this->getNasReadIops(),
            'nas_write_iops' => $this->getNasWriteIops(),
            'nas_total_iops' => $this->getNasTotalIops(),
            'nas_file_count' => $this->getFileCount(),
            'nas_concurrent_users' => $this->getConcurrentUsers(),
        ];
    }

    /**
     * Check if NAS is accessible
     *
     * @return bool
     */
    private function isNasAvailable(): bool
    {
        try {
            // Test if drive exists and is readable
            if (!file_exists($this->nasDrive)) {
                return false;
            }

            // Test if can write (permission check)
            $testFile = $this->nasDrive . '\\.nas_health_check';
            $result = @file_put_contents($testFile, 'health_check_' . time());
            
            if ($result !== false) {
                @unlink($testFile);
                return true;
            }

            return is_readable($this->nasDrive);
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Get NAS free space in bytes
     *
     * @return int
     */
    private function getNasFreeSpace(): int
    {
        if (!$this->isNasAvailable()) {
            return 0;
        }

        try {
            $freeSpace = disk_free_space($this->nasDrive);
            return $freeSpace !== false ? (int) $freeSpace : 0;
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * Get NAS total space in bytes
     *
     * @return int
     */
    private function getNasTotalSpace(): int
    {
        if (!$this->isNasAvailable()) {
            return 0;
        }

        try {
            $totalSpace = disk_total_space($this->nasDrive);
            return $totalSpace !== false ? (int) $totalSpace : 0;
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * Get NAS used space in bytes
     *
     * @return int
     */
    private function getNasUsedSpace(): int
    {
        return $this->getNasTotalSpace() - $this->getNasFreeSpace();
    }

    /**
     * Get NAS usage percentage
     *
     * @return float
     */
    private function getNasUsagePercent(): float
    {
        $total = $this->getNasTotalSpace();
        if ($total === 0) {
            return 0;
        }

        $used = $this->getNasUsedSpace();
        return round(($used / $total) * 100, 2);
    }

    /**
     * Test network latency to NAS via ping
     * 
     * Pings the actual NAS IP address (not localhost).
     * Falls back to localhost if NAS IP is not configured or unreachable.
     *
     * @return int|null Latency in milliseconds, or null if unreachable
     */
    private function getNasLatency(): ?int
    {
        try {
            // Validate that we're not pinging localhost
            $targetIp = $this->nasIp;
            
            // Warn if using localhost (development only)
            if (in_array($targetIp, ['127.0.0.1', 'localhost', '::1'])) {
                // In development, try to get real NAS IP from drive mapping
                $realNasIp = $this->detectNasIpFromDrive();
                if ($realNasIp && $realNasIp !== '127.0.0.1') {
                    $targetIp = $realNasIp;
                }
            }

            $output = [];
            $returnCode = 0;

            // Ping with 1 packet, 500ms timeout (faster response)
            exec("ping -n 1 -w 500 {$targetIp}", $output, $returnCode);

            if ($returnCode === 0 && !empty($output)) {
                foreach ($output as $line) {
                    // Match both "time=Xms" and "time<Xms"
                    if (preg_match('/time[<=](\d+)ms/i', $line, $matches)) {
                        return (int) $matches[1];
                    }
                    // Handle "time=X.Xms" (decimal milliseconds)
                    if (preg_match('/time[<=]([\d.]+)ms/i', $line, $matches)) {
                        return (int) round((float) $matches[1]);
                    }
                }
            }

            return null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Attempt to detect real NAS IP from mapped drive
     * 
     * Uses 'net use' command to find UNC path and extract IP
     *
     * @return string|null
     */
    private function detectNasIpFromDrive(): ?string
    {
        try {
            // Example: net use Z: | findstr "Remote"
            $command = "net use {$this->nasDrive} 2>nul | findstr /i \"Remote\"";
            $output = @shell_exec($command);
            
            if ($output) {
                // Extract IP from UNC path like \\192.168.1.100\share
                if (preg_match('/\\\\\\\\([0-9.]+)\\\\/', $output, $matches)) {
                    return $matches[1];
                }
                // Extract hostname and resolve to IP
                if (preg_match('/\\\\\\\\([a-zA-Z0-9.-]+)\\\\/', $output, $matches)) {
                    $hostname = $matches[1];
                    $ip = @gethostbyname($hostname);
                    if ($ip !== $hostname) {
                        return $ip;
                    }
                }
            }

            return null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get real-time read throughput from NAS (MB/s)
     * Uses actual file I/O test for accurate measurement
     *
     * @return float|null
     */
    private function testReadSpeed(): ?float
    {
        if (!$this->isNasAvailable()) {
            return null;
        }

        try {
            // Create test file if not exists (10MB)
            $testFile = $this->nasDrive . '.speed_test_file';
            $testSize = 10 * 1024 * 1024; // 10 MB

            if (!file_exists($testFile)) {
                $data = str_repeat('0', $testSize);
                file_put_contents($testFile, $data);
            }

            // Test read speed
            $startTime = microtime(true);
            $content = file_get_contents($testFile);
            $endTime = microtime(true);

            $duration = $endTime - $startTime;
            
            if ($duration > 0) {
                // Calculate MB/s
                $speed = (strlen($content) / (1024 * 1024)) / $duration;
                return round($speed, 2);
            }

            return null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get real-time write throughput to NAS (MB/s)
     * Uses actual file I/O test for accurate measurement
     *
     * @return float|null
     */
    private function testWriteSpeed(): ?float
    {
        if (!$this->isNasAvailable()) {
            return null;
        }

        try {
            // Prepare test data (10MB)
            $testFile = $this->nasDrive . '.write_test_file';
            $testSize = 10 * 1024 * 1024; // 10 MB
            $data = str_repeat('A', $testSize);

            // Test write speed
            $startTime = microtime(true);
            $bytesWritten = file_put_contents($testFile, $data);
            $endTime = microtime(true);

            // Cleanup
            @unlink($testFile);

            $duration = $endTime - $startTime;
            
            if ($duration > 0 && $bytesWritten !== false) {
                // Calculate MB/s
                $speed = ($bytesWritten / (1024 * 1024)) / $duration;
                return round($speed, 2);
            }

            return null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get NAS Read IOPS (via actual file operations)
     * Calculated from actual small file read operations
     * Uses cache to ensure consistency within single request
     *
     * @return float|null
     */
    private function getNasReadIops(): ?float
    {
        // Return cached value if already calculated
        if ($this->cachedReadIops !== null) {
            return $this->cachedReadIops;
        }

        if (!$this->isNasAvailable()) {
            return null;
        }

        try {
            // Create small test file (4KB - typical block size)
            $testFile = $this->nasDrive . '.iops_test_file';
            if (!file_exists($testFile)) {
                file_put_contents($testFile, str_repeat('X', 4096));
            }

            // Perform multiple read operations and measure
            $operations = 100;
            $startTime = microtime(true);
            
            for ($i = 0; $i < $operations; $i++) {
                @file_get_contents($testFile);
            }
            
            $endTime = microtime(true);
            $duration = $endTime - $startTime;

            if ($duration > 0) {
                // Calculate operations per second and cache it
                $this->cachedReadIops = round($operations / $duration, 2);
                return $this->cachedReadIops;
            }

            return null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get NAS Write IOPS (via actual file operations)
     * Calculated from actual small file write operations
     * Uses cache to ensure consistency within single request
     *
     * @return float|null
     */
    private function getNasWriteIops(): ?float
    {
        // Return cached value if already calculated
        if ($this->cachedWriteIops !== null) {
            return $this->cachedWriteIops;
        }

        if (!$this->isNasAvailable()) {
            return null;
        }

        try {
            // Prepare small data (4KB - typical block size)
            $testData = str_repeat('Y', 4096);
            $testFile = $this->nasDrive . '.iops_write_test';

            // Perform multiple write operations and measure
            $operations = 100;
            $startTime = microtime(true);
            
            for ($i = 0; $i < $operations; $i++) {
                @file_put_contents($testFile, $testData);
            }
            
            $endTime = microtime(true);
            
            // Cleanup
            @unlink($testFile);

            $duration = $endTime - $startTime;

            if ($duration > 0) {
                // Calculate operations per second and cache it
                $this->cachedWriteIops = round($operations / $duration, 2);
                return $this->cachedWriteIops;
            }

            return null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get Total IOPS (Read + Write)
     *
     * @return float|null
     */
    private function getNasTotalIops(): ?float
    {
        $readIops = $this->getNasReadIops();
        $writeIops = $this->getNasWriteIops();

        if ($readIops === null && $writeIops === null) {
            return null;
        }

        return round(($readIops ?? 0) + ($writeIops ?? 0), 2);
    }

    /**
     * Get total file count on NAS
     * Uses iterator for better performance and memory efficiency
     *
     * @return int
     */
    private function getFileCount(): int
    {
        if (!$this->isNasAvailable()) {
            return 0;
        }

        try {
            $count = 0;
            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator(
                    $this->nasDrive,
                    \RecursiveDirectoryIterator::SKIP_DOTS
                ),
                \RecursiveIteratorIterator::SELF_FIRST
            );

            foreach ($iterator as $file) {
                if ($file->isFile()) {
                    $count++;
                }
                
                // Limit to prevent timeout on large directories
                if ($count > 10000) {
                    break;
                }
            }

            return $count;
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * Get number of concurrent users
     * 
     * Uses database-based tracking for cross-platform compatibility.
     * Falls back to SMB sessions on Windows Server if available.
     * Optimized with query caching and selective SMB check.
     *
     * @return int
     */
    private function getConcurrentUsers(): int
    {
        static $cachedResult = null;
        static $cacheTime = null;
        
        // Cache for 5 seconds to avoid repeated database queries
        if ($cachedResult !== null && $cacheTime !== null && (microtime(true) - $cacheTime) < 5) {
            return $cachedResult;
        }

        try {
            // Primary method: Database-based tracking (works on all platforms)
            // Count users active in last 15 minutes
            // Use simple count() instead of get() for better performance
            $dbUsers = \DB::table('users')
                ->where('last_activity_at', '>=', now()->subMinutes(15))
                ->count();

            // Secondary method: SMB sessions (Windows Server only)
            // Only attempt on Windows Server environments
            if ($this->isWindowsServer()) {
                $command = 'powershell -NoProfile -Command "(Get-SmbSession | Measure-Object).Count" 2>nul';
                $output = @shell_exec($command);
                
                if ($output !== null && is_numeric(trim($output))) {
                    $smbUsers = (int) trim($output);
                    // Return the higher count (more accurate)
                    $result = max($dbUsers, $smbUsers);
                    
                    // Cache the result
                    $cachedResult = $result;
                    $cacheTime = microtime(true);
                    
                    return $result;
                }
            }

            // Cache the result
            $cachedResult = $dbUsers;
            $cacheTime = microtime(true);

            return $dbUsers;
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * Check if running on Windows Server
     * Uses cached result for performance
     *
     * @return bool
     */
    private function isWindowsServer(): bool
    {
        static $isServer = null;
        
        if ($isServer !== null) {
            return $isServer;
        }

        if (PHP_OS_FAMILY !== 'Windows') {
            $isServer = false;
            return false;
        }

        // Check Windows version (cached statically)
        $output = @shell_exec('wmic os get caption 2>nul');
        $isServer = $output !== null && stripos($output, 'Server') !== false;
        
        return $isServer;
    }

    /**
     * Get UNC path for NAS
     *
     * @return string
     */
    public function getUncPath(): string
    {
        return "\\\\{$this->nasIp}\\{$this->nasShareName}";
    }

    /**
     * Test NAS connection and return detailed status
     *
     * @return array
     */
    public function testConnection(): array
    {
        $available = $this->isNasAvailable();

        return [
            'status' => $available ? 'connected' : 'disconnected',
            'nas_ip' => $this->nasIp,
            'nas_drive' => $this->nasDrive,
            'unc_path' => $this->getUncPath(),
            'is_readable' => $available,
            'is_writable' => $available && is_writable($this->nasDrive),
            'latency_ms' => $this->getNasLatency(),
            'message' => $available 
                ? 'NAS is accessible and operational' 
                : 'NAS is not accessible. Please check drive mapping and network connection.',
        ];
    }
}
