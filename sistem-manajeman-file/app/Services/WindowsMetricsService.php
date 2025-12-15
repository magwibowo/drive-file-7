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

        return [
            'network_rx_bytes_per_sec' => $this->getNetworkBytesReceived(),
            'network_tx_bytes_per_sec' => $this->getNetworkBytesSent(),
            'disk_reads_per_sec' => $this->getDiskReadsPersec(),
            'disk_writes_per_sec' => $this->getDiskWritesPersec(),
            'disk_free_space' => $this->getDiskFreeSpace(),
            'latency_ms' => $this->getNetworkLatency(),
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
     * Query WMI untuk ambil total bytes received per detik dari semua network interface
     *
     * @return float
     * @throws Exception
     */
    private function getNetworkBytesReceived(): float
    {
        try {
            $wmiQuery = "SELECT BytesReceivedPersec FROM Win32_PerfRawData_Tcpip_NetworkInterface WHERE BytesReceivedPersec > 0";
            $result = $this->executeWmiQuery($wmiQuery);

            $totalBytes = 0.0;
            foreach ($result as $item) {
                $totalBytes += (float) $item['BytesReceivedPersec'];
            }

            return $totalBytes;
        } catch (Exception $e) {
            throw new Exception("Error mengambil network bytes received: {$e->getMessage()}");
        }
    }

    /**
     * Query WMI untuk ambil total bytes sent per detik dari semua network interface
     *
     * @return float
     * @throws Exception
     */
    private function getNetworkBytesSent(): float
    {
        try {
            $wmiQuery = "SELECT BytesSentPersec FROM Win32_PerfRawData_Tcpip_NetworkInterface WHERE BytesSentPersec > 0";
            $result = $this->executeWmiQuery($wmiQuery);

            $totalBytes = 0.0;
            foreach ($result as $item) {
                $totalBytes += (float) $item['BytesSentPersec'];
            }

            return $totalBytes;
        } catch (Exception $e) {
            throw new Exception("Error mengambil network bytes sent: {$e->getMessage()}");
        }
    }

    /**
     * Query WMI untuk ambil disk reads per detik dari total disk
     *
     * @return float
     * @throws Exception
     */
    private function getDiskReadsPersec(): float
    {
        try {
            $wmiQuery = "SELECT DiskReadsPersec FROM Win32_PerfRawData_PerfDisk_PhysicalDisk WHERE Name = '_Total'";
            $result = $this->executeWmiQuery($wmiQuery);

            if (count($result) > 0) {
                return (float) $result[0]['DiskReadsPersec'];
            }

            return 0.0;
        } catch (Exception $e) {
            throw new Exception("Error mengambil disk reads: {$e->getMessage()}");
        }
    }

    /**
     * Query WMI untuk ambil disk writes per detik dari total disk
     *
     * @return float
     * @throws Exception
     */
    private function getDiskWritesPersec(): float
    {
        try {
            $wmiQuery = "SELECT DiskWritesPersec FROM Win32_PerfRawData_PerfDisk_PhysicalDisk WHERE Name = '_Total'";
            $result = $this->executeWmiQuery($wmiQuery);

            if (count($result) > 0) {
                return (float) $result[0]['DiskWritesPersec'];
            }

            return 0.0;
        } catch (Exception $e) {
            throw new Exception("Error mengambil disk writes: {$e->getMessage()}");
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
}
