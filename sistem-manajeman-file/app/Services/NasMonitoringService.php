<?php

namespace App\Services;

use Exception;

class NasMonitoringService
{
    private string $nasDrive;
    private string $nasIp;
    private string $nasShareName;

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
     * @return int|null
     */
    private function getNasLatency(): ?int
    {
        try {
            $output = [];
            $returnCode = 0;

            exec("ping -n 1 {$this->nasIp}", $output, $returnCode);

            if ($returnCode === 0 && !empty($output)) {
                foreach ($output as $line) {
                    // Match both "time=Xms" and "time<Xms"
                    if (preg_match('/time[<=](\d+)ms/i', $line, $matches)) {
                        return (int) $matches[1];
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
     *
     * @return float|null
     */
    private function getNasReadIops(): ?float
    {
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
                // Calculate operations per second
                return round($operations / $duration, 2);
            }

            return null;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get NAS Write IOPS (via actual file operations)
     * Calculated from actual small file write operations
     *
     * @return float|null
     */
    private function getNasWriteIops(): ?float
    {
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
                // Calculate operations per second
                return round($operations / $duration, 2);
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
     * Get number of concurrent SMB users/sessions
     *
     * @return int
     */
    private function getConcurrentUsers(): int
    {
        if (!$this->isNasAvailable()) {
            return 0;
        }

        try {
            // For Windows Server - count SMB sessions
            // Command: Get-SmbSession | Measure-Object | Select-Object -ExpandProperty Count
            $command = 'powershell -Command "(Get-SmbSession | Measure-Object).Count"';
            $output = shell_exec($command);
            
            if ($output !== null) {
                return (int) trim($output);
            }

            return 0;
        } catch (Exception $e) {
            return 0;
        }
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
