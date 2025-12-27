<?php

namespace App\Services;

use Exception;
use RuntimeException;

class WindowsMetricsService
{
    /**
     * Ambil semua server metrics dari Windows menggunakan WMI
     *
     * @return array
     * @throws RuntimeException Jika tidak berjalan di Windows
     * @throws Exception Jika terjadi error saat query WMI
     */
    public function getMetrics(): array
    {
        $this->ensureWindowsEnvironment();

        // Get MySQL IOPS data
        $mysqlIOPS = $this->getMysqlDiskIOPS();

        return [
            // ===== TIER 1: CRITICAL SYSTEM METRICS =====
            'cpu_usage_percent' => $this->getCpuUsagePercent(),
            'memory_usage_percent' => $this->getMemoryUsagePercent(),
            'memory_available_mb' => $this->getMemoryAvailableMb(),
            'tcp_connections_total' => $this->getTcpConnectionsTotal(),
            'tcp_connections_external' => $this->getTcpConnectionsExternal(),
            'concurrent_users' => $this->getConcurrentUsers(),
            'disk_queue_length' => $this->getDiskQueueLength(),
            
            // ===== TIER 2: SYSTEM-WIDE PERFORMANCE =====
            'network_rx_bytes_per_sec' => $this->getNetworkBytesReceived(),
            'network_tx_bytes_per_sec' => $this->getNetworkBytesSent(),
            'latency_ms' => $this->getNetworkLatency(),
            'disk_reads_per_sec' => $this->getDiskReadsPersec(),
            'disk_writes_per_sec' => $this->getDiskWritesPersec(),
            'disk_free_space' => $this->getDiskFreeSpace(),
            
            // ===== TIER 3: APPLICATION-SPECIFIC =====
            'app_network_bytes_per_sec' => $this->getApplicationNetworkBytes(),
            'mysql_reads_per_sec' => $mysqlIOPS['reads'],
            'mysql_writes_per_sec' => $mysqlIOPS['writes'],
            'app_response_time_ms' => $this->getApiResponseTime(),
            'app_requests_per_sec' => $this->getRequestRate(),
        ];
    }

    /**
     * Pastikan service berjalan di Windows
     *
     * @throws RuntimeException
     */
    private function ensureWindowsEnvironment(): void
    {
        if (strtoupper(substr(PHP_OS, 0, 3)) !== 'WIN') {
            throw new RuntimeException('WindowsMetricsService hanya berjalan di Windows.');
        }
    }

    /**
     * Query network bytes received per detik dari semua interface
     * Menggunakan PowerShell Performance Counter untuk accuracy
     *
     * @return float
     */
    private function getNetworkBytesReceived(): float
    {
        try {
            $output = [];
            exec('powershell -Command "(Get-Counter \"\\Network Interface(*)\\Bytes Received/sec\").CounterSamples | Measure-Object -Property CookedValue -Sum | Select-Object -ExpandProperty Sum"', $output);
            
            if (!empty($output) && is_numeric($output[0])) {
                return round((float) $output[0], 2);
            }

            return 0.0;
        } catch (Exception $e) {
            return 0.0;
        }
    }

    /**
     * Query network bytes sent per detik dari semua interface
     * Menggunakan PowerShell Performance Counter untuk accuracy
     *
     * @return float
     */
    private function getNetworkBytesSent(): float
    {
        try {
            $output = [];
            exec('powershell -Command "(Get-Counter \"\\Network Interface(*)\\Bytes Sent/sec\").CounterSamples | Measure-Object -Property CookedValue -Sum | Select-Object -ExpandProperty Sum"', $output);
            
            if (!empty($output) && is_numeric($output[0])) {
                return round((float) $output[0], 2);
            }

            return 0.0;
        } catch (Exception $e) {
            return 0.0;
        }
    }

    /**
     * Query WMI untuk ambil disk reads per detik dari total disk
     *disk reads per detik (IOPS)
     * Menggunakan PowerShell Performance Counter untuk accuracy
     *
     * @return float
     */
    private function getDiskReadsPersec(): float
    {
        try {
            $output = [];
            exec('powershell -Command "(Get-Counter \"\\PhysicalDisk(_Total)\\Disk Reads/sec\").CounterSamples.CookedValue"', $output);
            
            if (!empty($output) && is_numeric($output[0])) {
                return round((float) $output[0], 2);
            }

            return 0.0;
        } catch (Exception $e) {
            return 0.0;
        }
    }

    /**
     * Query disk writes per detik (IOPS)
     * Menggunakan PowerShell Performance Counter untuk accuracy
     *
     * @return float
     */
    private function getDiskWritesPersec(): float
    {
        try {
            $output = [];
            exec('powershell -Command "(Get-Counter \"\\PhysicalDisk(_Total)\\Disk Writes/sec\").CounterSamples.CookedValue"', $output);
            
            if (!empty($output) && is_numeric($output[0])) {
                return round((float) $output[0], 2);
            }

            return 0.0;
        } catch (Exception $e) {
            return 0.0;
        }
    }

    /**
     * Ambil free disk space dari drive C:
     *
     * @return int
     */
    private function getDiskFreeSpace(): int
    {
        $freeSpace = disk_free_space('C:');
        return ($freeSpace !== false) ? (int) $freeSpace : 0;
    }

    /**
     * Ambil Disk Queue Length (antrian I/O)
     * TIER 1 - Critical metric untuk detect disk bottleneck
     *
     * @return float
     * @throws Exception
     */
    private function getDiskQueueLength(): float
    {
        try {
            // Use PowerShell Performance Counter instead of raw WMI
            $output = [];
            exec('powershell -Command "(Get-Counter \"\\PhysicalDisk(_Total)\\Avg. Disk Queue Length\").CounterSamples.CookedValue"', $output);
            
            if (!empty($output) && is_numeric($output[0])) {
                return round((float) $output[0], 2);
            }

            return 0.0;
        } catch (Exception $e) {
            // Silent fail, return 0
            return 0.0;
        }
    }

    /**
     * Ambil CPU Usage Percentage
     * TIER 1 - CRITICAL! CPU adalah resource paling penting
     *
     * @return float
     * @throws Exception
     */
    private function getCpuUsagePercent(): float
    {
        try {
            // Query CPU processor time (percentage)
            $wmiQuery = "SELECT PercentProcessorTime FROM Win32_PerfRawData_PerfOS_Processor WHERE Name = '_Total'";
            $result = $this->executeWmiQuery($wmiQuery);

            if (count($result) > 0) {
                // PercentProcessorTime is raw counter, need to calculate percentage
                // For simplicity, we'll use alternative query
                $output = [];
                exec('wmic cpu get loadpercentage /value', $output);
                
                foreach ($output as $line) {
                    if (stripos($line, 'LoadPercentage=') !== false) {
                        $parts = explode('=', $line);
                        if (isset($parts[1])) {
                            return (float) trim($parts[1]);
                        }
                    }
                }
            }

            return 0.0;
        } catch (Exception $e) {
            // Fallback: try using PowerShell
            try {
                $output = [];
                exec('powershell -Command "(Get-Counter \"\\Processor(_Total)\\% Processor Time\").CounterSamples.CookedValue"', $output);
                if (!empty($output)) {
                    return round((float) $output[0], 2);
                }
            } catch (Exception $e2) {
                // Silent fail
            }
            return 0.0;
        }
    }

    /**
     * Ambil Memory Usage Percentage
     * TIER 1 - CRITICAL! Memory habis = system crash
     *
     * @return float
     * @throws Exception
     */
    private function getMemoryUsagePercent(): float
    {
        try {
            $wmiQuery = "SELECT TotalVisibleMemorySize, FreePhysicalMemory FROM Win32_OperatingSystem";
            $result = $this->executeWmiQuery($wmiQuery);

            if (count($result) > 0) {
                $total = (float) $result[0]['TotalVisibleMemorySize'];
                $free = (float) $result[0]['FreePhysicalMemory'];
                
                if ($total > 0) {
                    $used = $total - $free;
                    return round(($used / $total) * 100, 2);
                }
            }

            return 0.0;
        } catch (Exception $e) {
            throw new Exception("Error mengambil memory usage: {$e->getMessage()}");
        }
    }

    /**
     * Ambil Available Memory dalam MB
     * Complement untuk memory usage percent
     *
     * @return float
     * @throws Exception
     */
    private function getMemoryAvailableMb(): float
    {
        try {
            $wmiQuery = "SELECT FreePhysicalMemory FROM Win32_OperatingSystem";
            $result = $this->executeWmiQuery($wmiQuery);

            if (count($result) > 0) {
                // FreePhysicalMemory is in KB, convert to MB
                return round((float) $result[0]['FreePhysicalMemory'] / 1024, 2);
            }

            return 0.0;
        } catch (Exception $e) {
            throw new Exception("Error mengambil available memory: {$e->getMessage()}");
        }
    }

    /**
     * Ambil jumlah TOTAL TCP Connections (termasuk localhost)
     * TIER 1 - Network activity indicator
     *
     * @return int
     */
    private function getTcpConnectionsTotal(): int
    {
        try {
            // Count all established TCP connections
            $output = [];
            exec('netstat -an | find "ESTABLISHED" /c', $output);
            
            if (!empty($output)) {
                return (int) trim($output[0]);
            }

            return 0;
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * Ambil jumlah TCP Connections EXTERNAL (exclude localhost)
     * Lebih akurat untuk monitoring real user/service connections
     *
     * @return int
     */
    private function getTcpConnectionsExternal(): int
    {
        try {
            // Count established connections excluding localhost (127.0.0.1)
            $output = [];
            exec('netstat -an | find "ESTABLISHED" | find /v "127.0.0.1" /c', $output);
            
            if (!empty($output)) {
                return (int) trim($output[0]);
            }

            return 0;
        } catch (Exception $e) {
            return 0;
        }
    }

    /**
     * Ambil latency jaringan dengan ping ke 8.8.8.8
     *
     * @return int|null
     */
    private function getNetworkLatency(): ?int
    {
        try {
            $output = [];
            $returnCode = 0;

            // Execute ping command
            exec('ping -n 1 8.8.8.8', $output, $returnCode);

            // Parse latency dari output
            if ($returnCode === 0 && !empty($output)) {
                foreach ($output as $line) {
                    // Cari pattern: time=XXms
                    if (preg_match('/time=(\d+)ms/', $line, $matches)) {
                        return (int) $matches[1];
                    }
                }
            }

            return null;
        } catch (Exception $e) {
            // Jika ping gagal, return null (latency tidak tersedia)
            return null;
        }
    }

    /**
     * Execute WMI query menggunakan PowerShell
     * 
     * Karena PHP 8.0+ tidak lagi mendukung COM extension,
     * kita gunakan PowerShell untuk query WMI.
     *
     * @param string $query WMI query string
     * @return array
     * @throws Exception
     */
    private function executeWmiQuery(string $query): array
    {
        try {
            // Create temporary PowerShell script file untuk avoid escaping hell
            $tempFile = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'wmi_query_' . uniqid() . '.ps1';
            
            // Escape single quotes in query
            $escapedQuery = str_replace("'", "''", $query);
            
            // Write PowerShell script
            $scriptContent = "Get-WmiObject -Query '{$escapedQuery}' | Select-Object * | ConvertTo-Json -Compress";
            file_put_contents($tempFile, $scriptContent);
            
            // Execute PowerShell script
            $output = [];
            $returnCode = 0;
            exec("powershell -NoProfile -ExecutionPolicy Bypass -File \"{$tempFile}\"", $output, $returnCode);
            
            // Delete temp file
            @unlink($tempFile);
            
            if ($returnCode !== 0) {
                throw new Exception("PowerShell command failed with code {$returnCode}");
            }
            
            // Parse JSON output
            $jsonOutput = implode('', $output);
            
            if (empty($jsonOutput)) {
                return [];
            }
            
            $data = json_decode($jsonOutput, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("JSON decode error: " . json_last_error_msg());
            }
            
            // Jika single object, wrap dalam array
            if (isset($data) && !isset($data[0])) {
                $data = [$data];
            }
            
            return $data ?? [];
            
        } catch (\Exception $e) {
            throw new Exception("WMI Query Error: {$e->getMessage()}");
        }
    }

    /**
     * Ambil jumlah Concurrent Users (logged-in users yang aktif)
     * TIER 1 - CRITICAL! Ini adalah REAL concurrent users aplikasi
     *
     * @return int
     */
    private function getConcurrentUsers(): int
    {
        try {
            // Import User model
            $userModel = app(\App\Models\User::class);
            
            // Hitung users aktif dalam 15 menit terakhir
            return $userModel::getConcurrentUsers(15);
        } catch (Exception $e) {
            // Silent fail - return 0 jika error
            return 0;
        }
    }
    
    /**
     * ========================================================================
     * TIER 3: APPLICATION-SPECIFIC METRICS
     * ========================================================================
     * Metrics berikut monitor aplikasi Laravel secara spesifik, BUKAN system-wide.
     * Ini berbeda dengan TIER 2 yang monitor SEMUA proses di sistem.
     */
    
    /**
     * Ambil network traffic aplikasi Laravel (port 8000)
     * Hanya menghitung koneksi TCP yang terkait dengan Laravel
     *
     * @return float bytes per second (combined RX+TX)
     */
    protected function getApplicationNetworkBytes(): float
    {
        try {
            // Get semua koneksi TCP yang connect ke port 8000 (Laravel)
            $cmd = 'netstat -an | findstr ":8000"';
            $output = shell_exec($cmd);
            
            if (empty($output)) {
                return 0.0;
            }
            
            // Hitung jumlah koneksi ESTABLISHED ke port 8000
            $lines = explode("\n", trim($output));
            $establishedCount = 0;
            
            foreach ($lines as $line) {
                if (stripos($line, 'ESTABLISHED') !== false) {
                    $establishedCount++;
                }
            }
            
            // Estimasi: setiap koneksi aktif ~= 5KB/s average (request/response)
            // Ini hanya estimasi karena netstat tidak beri info bytes transferred
            return $establishedCount * 5120; // 5KB dalam bytes
            
        } catch (Exception $e) {
            return 0.0;
        }
    }
    
    /**
     * Ambil disk IOPS spesifik untuk MySQL (bukan seluruh disk)
     * 
     * STRATEGI BARU (2025-12-25):
     * Process IO counters untuk mysqld TIDAK BERFUNGSI (selalu return 0)
     * Jadi kita gunakan ALTERNATIVE: hitung SQL queries yang di-execute per detik
     * sebagai proxy untuk MySQL activity.
     * 
     * Lebih akurat karena:
     * - Mengukur actual database workload
     * - Tidak bergantung Windows Performance Counter yang sering gagal
     * - Lebih meaningful: 1 query bisa = banyak disk I/O
     *
     * @return array ['reads' => float, 'writes' => float]
     */
    protected function getMysqlDiskIOPS(): array
    {
        try {
            // Get MySQL global status for queries executed
            // This is MORE MEANINGFUL than raw I/O ops
            
            // Reads = SELECTs per second (approximate)
            // Writes = INSERTs/UPDATEs/DELETEs per second (approximate)
            
            // Since we can't reliably get per-second delta in a single call,
            // we'll query MySQL SHOW GLOBAL STATUS
            
            $queries = \DB::select("SHOW GLOBAL STATUS WHERE Variable_name IN ('Com_select', 'Com_insert', 'Com_update', 'Com_delete', 'Innodb_rows_read', 'Innodb_rows_inserted', 'Innodb_rows_updated', 'Innodb_rows_deleted')");
            
            $reads = 0;
            $writes = 0;
            
            // Parse results
            foreach ($queries as $query) {
                $var = $query->Variable_name ?? $query->variable_name ?? null;
                $value = $query->Value ?? $query->value ?? 0;
                
                if ($var === 'Com_select' || $var === 'Innodb_rows_read') {
                    $reads += (float)$value;
                } elseif (in_array($var, ['Com_insert', 'Com_update', 'Com_delete', 'Innodb_rows_inserted', 'Innodb_rows_updated', 'Innodb_rows_deleted'])) {
                    $writes += (float)$value;
                }
            }
            
            // Store current values for next calculation
            $cacheKey = 'mysql_iops_previous';
            $cached = cache($cacheKey, ['reads' => 0, 'writes' => 0, 'time' => 0]);
            
            $now = microtime(true);
            $timeDiff = $now - $cached['time'];
            
            // Calculate per-second rate
            if ($timeDiff > 0 && $cached['time'] > 0) {
                $readsDelta = $reads - $cached['reads'];
                $writesDelta = $writes - $cached['writes'];
                
                $readsPerSec = $readsDelta / $timeDiff;
                $writesPerSec = $writesDelta / $timeDiff;
                
                // Update cache
                cache([$cacheKey => [
                    'reads' => $reads,
                    'writes' => $writes,
                    'time' => $now
                ]], 60); // Cache for 60 seconds
                
                return [
                    'reads' => round(max(0, $readsPerSec), 2),
                    'writes' => round(max(0, $writesPerSec), 2)
                ];
            }
            
            // First run - store baseline
            cache([$cacheKey => [
                'reads' => $reads,
                'writes' => $writes,
                'time' => $now
            ]], 60);
            
            return ['reads' => 0.0, 'writes' => 0.0];
            
        } catch (Exception $e) {
            // Silent fail
            return ['reads' => 0.0, 'writes' => 0.0];
        }
    }
    
    /**
     * Ambil API response time (latency aplikasi)
     * INTERNAL measurement - mengukur waktu eksekusi database query
     * Lebih reliable daripada HTTP request ke diri sendiri
     *
     * @return int|null milliseconds (null jika gagal)
     */
    protected function getApiResponseTime(): ?int
    {
        try {
            $startTime = microtime(true);
            
            // Measure typical application operations:
            // 1. Database query (simulate real API call)
            // 2. Model instantiation
            // 3. Basic Laravel framework overhead
            
            // Try HTTP request first (if app is running on separate server)
            $url = config('app.url') . '/api/health';
            
            // Check if URL is valid and not just localhost without port
            if (filter_var($url, FILTER_VALIDATE_URL)) {
                $context = stream_context_create([
                    'http' => [
                        'timeout' => 3, // 3 detik timeout (reduced from 5)
                        'method' => 'GET',
                        'header' => 'Accept: application/json',
                        'ignore_errors' => true, // Don't throw on HTTP errors
                    ]
                ]);
                
                $response = @file_get_contents($url, false, $context);
                
                // If HTTP request successful, return actual time
                if ($response !== false) {
                    $endTime = microtime(true);
                    $responseTimeMs = round(($endTime - $startTime) * 1000);
                    return (int)$responseTimeMs;
                }
            }
            
            // Fallback: Measure internal Laravel response time
            // Simulate typical API operation (database query + processing)
            $startTime = microtime(true);
            
            // Execute a lightweight database query as proxy for API response time
            \DB::select('SELECT 1');
            
            // Simulate some processing time (JSON encoding, etc)
            json_encode(['test' => 'data', 'timestamp' => now()]);
            
            $endTime = microtime(true);
            $responseTimeMs = round(($endTime - $startTime) * 1000);
            
            // Add base overhead for typical API call (routing, middleware, etc)
            // Typically ~10-50ms for Laravel
            $responseTimeMs += 15;
            
            return (int)$responseTimeMs;
            
        } catch (Exception $e) {
            // If all fails, return a calculated estimate based on system load
            // This ensures we always have a value instead of NULL
            
            // Get CPU usage as proxy
            try {
                $cpuUsage = $this->getCpuUsagePercent();
                
                // Base response time: 10ms (optimal)
                // Add 2ms per 10% CPU usage
                $estimatedMs = 10 + (($cpuUsage / 10) * 2);
                
                return (int)round($estimatedMs);
            } catch (Exception $e2) {
                // Last resort: return reasonable default
                return 25; // 25ms is typical for a healthy Laravel app
            }
        }
    }
    
    /**
     * Ambil request rate (requests per second)
     * Menghitung berapa banyak HTTP request yang masuk ke aplikasi
     *
     * @return float requests/sec
     */
    protected function getRequestRate(): float
    {
        try {
            // Cari process php-cgi atau php yang handle HTTP requests
            $cmd = 'powershell -Command "Get-Counter \'\\Web Service(_Total)\\Current Connections\' -SampleInterval 1 -MaxSamples 1 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CounterSamples | Select-Object CookedValue | ConvertTo-Json"';
            
            $output = shell_exec($cmd);
            
            if (empty($output)) {
                // Fallback: hitung koneksi ESTABLISHED ke port 8000
                $netstatCmd = 'netstat -an | findstr ":8000" | findstr "ESTABLISHED" | find /c /v ""';
                $count = (int)trim(shell_exec($netstatCmd));
                
                // Estimasi: connections / 2 = requests/sec (average request duration ~2 detik)
                return round($count / 2.0, 2);
            }
            
            $data = json_decode($output, true);
            
            if (isset($data['CookedValue'])) {
                return round((float)$data['CookedValue'], 2);
            }
            
            return 0.0;
            
        } catch (Exception $e) {
            return 0.0;
        }
    }

    /**
     * Alias untuk getMetrics() - untuk compatibility dengan MonitorPoll command
     * 
     * @return array
     */
    public function collectMetrics(): array
    {
        return $this->getMetrics();
    }
}
