<?php

namespace App\Livewire;

use Livewire\Component;
use App\Services\WindowsMetricsService;
use App\Models\ServerMetric;
use Exception;

class ServerMonitor extends Component
{
    public bool $isMonitoring = false;
    public ?array $previousSnapshot = null;
    public ?string $errorMessage = null;
    
    public array $currentMetrics = [
        'network_rx_bytes_per_sec' => 0,
        'network_tx_bytes_per_sec' => 0,
        'disk_reads_per_sec' => 0,
        'disk_writes_per_sec' => 0,
        'disk_free_space' => 0,
        'latency_ms' => null,
    ];

    /**
     * Mulai monitoring
     */
    public function startMonitoring(): void
    {
        try {
            $metricsService = new WindowsMetricsService();
            
            // Ambil snapshot awal (baseline) - JANGAN hitung delta
            $this->previousSnapshot = $metricsService->getMetrics();
            
            // Set monitoring aktif
            $this->isMonitoring = true;
            
            // Reset error
            $this->errorMessage = null;
            
            // Set current metrics ke 0 karena belum ada delta
            $this->currentMetrics = [
                'network_rx_bytes_per_sec' => 0,
                'network_tx_bytes_per_sec' => 0,
                'disk_reads_per_sec' => 0,
                'disk_writes_per_sec' => 0,
                'disk_free_space' => $this->previousSnapshot['disk_free_space'],
                'latency_ms' => $this->previousSnapshot['latency_ms'],
            ];
            
        } catch (Exception $e) {
            $this->errorMessage = $e->getMessage();
            $this->isMonitoring = false;
        }
    }

    /**
     * Hentikan monitoring
     */
    public function stopMonitoring(): void
    {
        $this->isMonitoring = false;
        $this->previousSnapshot = null;
        
        // Reset metrics ke 0
        $this->currentMetrics = [
            'network_rx_bytes_per_sec' => 0,
            'network_tx_bytes_per_sec' => 0,
            'disk_reads_per_sec' => 0,
            'disk_writes_per_sec' => 0,
            'disk_free_space' => 0,
            'latency_ms' => null,
        ];
        
        $this->errorMessage = null;
    }

    /**
     * Update metrics - dipanggil otomatis oleh wire:poll.2s
     * Method ini HANYA dipanggil ketika $isMonitoring == true
     */
    public function updateMetrics(): void
    {
        // Hanya update jika monitoring aktif dan sudah ada snapshot sebelumnya
        if (!$this->isMonitoring || $this->previousSnapshot === null) {
            return;
        }

        try {
            $metricsService = new WindowsMetricsService();
            $currentSnapshot = $metricsService->getMetrics();

            // Hitung delta (current - previous) / 2 detik
            $deltaRx = ($currentSnapshot['network_rx_bytes_per_sec'] - $this->previousSnapshot['network_rx_bytes_per_sec']) / 2;
            $deltaTx = ($currentSnapshot['network_tx_bytes_per_sec'] - $this->previousSnapshot['network_tx_bytes_per_sec']) / 2;
            $deltaReads = ($currentSnapshot['disk_reads_per_sec'] - $this->previousSnapshot['disk_reads_per_sec']) / 2;
            $deltaWrites = ($currentSnapshot['disk_writes_per_sec'] - $this->previousSnapshot['disk_writes_per_sec']) / 2;

            // Update current metrics dengan delta
            $this->currentMetrics = [
                'network_rx_bytes_per_sec' => max(0, $deltaRx), // Pastikan tidak negatif
                'network_tx_bytes_per_sec' => max(0, $deltaTx),
                'disk_reads_per_sec' => max(0, $deltaReads),
                'disk_writes_per_sec' => max(0, $deltaWrites),
                'disk_free_space' => $currentSnapshot['disk_free_space'],
                'latency_ms' => $currentSnapshot['latency_ms'],
            ];

            // Simpan ke database
            ServerMetric::create($this->currentMetrics);

            // Update previous snapshot untuk polling berikutnya
            $this->previousSnapshot = $currentSnapshot;
            
            // Reset error
            $this->errorMessage = null;

        } catch (Exception $e) {
            $this->errorMessage = $e->getMessage();
            $this->stopMonitoring();
        }
    }

    /**
     * Render component
     */
    public function render()
    {
        return view('livewire.server-monitor');
    }
}
