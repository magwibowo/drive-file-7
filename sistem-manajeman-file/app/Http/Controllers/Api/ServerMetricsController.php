<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServerMetric;
use App\Services\WindowsMetricsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class ServerMetricsController extends Controller
{
    protected WindowsMetricsService $metricsService;

    public function __construct(WindowsMetricsService $metricsService)
    {
        $this->metricsService = $metricsService;
    }

    /**
     * Ambil snapshot awal untuk memulai monitoring
     *
     * @return JsonResponse
     */
    public function start(): JsonResponse
    {
        try {
            $snapshot = $this->metricsService->getMetrics();

            return response()->json([
                'success' => true,
                'message' => 'Monitoring started',
                'data' => [
                    'baseline' => $snapshot,
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ambil metrics terbaru untuk polling
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function poll(Request $request): JsonResponse
    {
        try {
            $currentSnapshot = $this->metricsService->getMetrics();
            $previousSnapshot = $request->input('previous_snapshot');

            // Jika tidak ada previous snapshot, return current saja
            if (!$previousSnapshot) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'current' => $currentSnapshot,
                        'delta' => null,
                    ],
                ]);
            }

            // Return semua 16 metrics (TIER 1 + 2 + 3) langsung dari currentSnapshot
            // Tidak perlu delta calculation karena WindowsMetricsService sudah return per-second rates
            $metricsToSave = [
                // TIER 2: System-wide Performance
                'network_rx_bytes_per_sec' => $currentSnapshot['network_rx_bytes_per_sec'],
                'network_tx_bytes_per_sec' => $currentSnapshot['network_tx_bytes_per_sec'],
                'disk_reads_per_sec' => $currentSnapshot['disk_reads_per_sec'],
                'disk_writes_per_sec' => $currentSnapshot['disk_writes_per_sec'],
                'disk_free_space' => $currentSnapshot['disk_free_space'],
                'latency_ms' => $currentSnapshot['latency_ms'],
                
                // TIER 1: Critical System Metrics
                'cpu_usage_percent' => $currentSnapshot['cpu_usage_percent'],
                'memory_usage_percent' => $currentSnapshot['memory_usage_percent'],
                'memory_available_mb' => $currentSnapshot['memory_available_mb'],
                'tcp_connections_total' => $currentSnapshot['tcp_connections_total'],
                'tcp_connections_external' => $currentSnapshot['tcp_connections_external'],
                'concurrent_users' => $currentSnapshot['concurrent_users'],
                'disk_queue_length' => $currentSnapshot['disk_queue_length'],
                
                // TIER 3: Application-Specific Metrics
                'app_network_bytes_per_sec' => $currentSnapshot['app_network_bytes_per_sec'],
                'mysql_reads_per_sec' => $currentSnapshot['mysql_reads_per_sec'],
                'mysql_writes_per_sec' => $currentSnapshot['mysql_writes_per_sec'],
                'app_response_time_ms' => $currentSnapshot['app_response_time_ms'],
                'app_requests_per_sec' => $currentSnapshot['app_requests_per_sec'],
            ];

            // Simpan metrics ke database
            ServerMetric::create($metricsToSave);

            return response()->json([
                'success' => true,
                'data' => [
                    'current' => $currentSnapshot,
                    'delta' => $metricsToSave, // Return all 16 metrics
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Hentikan monitoring (optional - untuk cleanup)
     *
     * @return JsonResponse
     */
    public function stop(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Monitoring stopped',
        ]);
    }

    /**
     * Ambil history metrics terakhir
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function history(Request $request): JsonResponse
    {
        try {
            $limit = $request->input('limit', 50);
            $metrics = ServerMetric::getLatestMetrics($limit);

            return response()->json([
                'success' => true,
                'data' => $metrics,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Ambil metrics REAL-TIME dari WMI (bukan dari database)
     * PENTING: Endpoint ini langsung query WMI, bukan baca tabel
     *
     * @return JsonResponse
     */
    public function latest(): JsonResponse
    {
        try {
            // Query WMI langsung untuk data real-time
            $metrics = $this->metricsService->getMetrics();

            // Format response dengan 16 metrics (TIER 1 + 2 + 3)
            return response()->json([
                'success' => true,
                'data' => [
                    // TIER 2: System-wide Performance
                    'rx' => $metrics['network_rx_bytes_per_sec'],
                    'tx' => $metrics['network_tx_bytes_per_sec'],
                    'latency' => $metrics['latency_ms'],
                    'reads' => $metrics['disk_reads_per_sec'],
                    'writes' => $metrics['disk_writes_per_sec'],
                    'free_space' => $metrics['disk_free_space'],
                    
                    // TIER 1: Critical System Metrics
                    'cpu_usage_percent' => $metrics['cpu_usage_percent'],
                    'memory_usage_percent' => $metrics['memory_usage_percent'],
                    'memory_available_mb' => $metrics['memory_available_mb'],
                    'tcp_connections_total' => $metrics['tcp_connections_total'],
                    'tcp_connections_external' => $metrics['tcp_connections_external'],
                    'concurrent_users' => $metrics['concurrent_users'],
                    'disk_queue_length' => $metrics['disk_queue_length'],
                    
                    // TIER 3: Application-Specific Metrics
                    'app_network_bytes_per_sec' => $metrics['app_network_bytes_per_sec'],
                    'mysql_reads_per_sec' => $metrics['mysql_reads_per_sec'],
                    'mysql_writes_per_sec' => $metrics['mysql_writes_per_sec'],
                    'app_response_time_ms' => $metrics['app_response_time_ms'],
                    'app_requests_per_sec' => $metrics['app_requests_per_sec'],
                    
                    // Timestamp
                    'timestamp' => now()->toIso8601String(),
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch real-time metrics: ' . $e->getMessage(),
            ], 500);
        }
    }
}
