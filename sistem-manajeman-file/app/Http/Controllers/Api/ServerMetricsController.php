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

            // Hitung delta (current - previous) / 2 detik
            $delta = [
                'network_rx_bytes_per_sec' => max(0, ($currentSnapshot['network_rx_bytes_per_sec'] - $previousSnapshot['network_rx_bytes_per_sec']) / 2),
                'network_tx_bytes_per_sec' => max(0, ($currentSnapshot['network_tx_bytes_per_sec'] - $previousSnapshot['network_tx_bytes_per_sec']) / 2),
                'disk_reads_per_sec' => max(0, ($currentSnapshot['disk_reads_per_sec'] - $previousSnapshot['disk_reads_per_sec']) / 2),
                'disk_writes_per_sec' => max(0, ($currentSnapshot['disk_writes_per_sec'] - $previousSnapshot['disk_writes_per_sec']) / 2),
                'disk_free_space' => $currentSnapshot['disk_free_space'],
                'latency_ms' => $currentSnapshot['latency_ms'],
            ];

            // Simpan metrics ke database
            ServerMetric::create($delta);

            return response()->json([
                'success' => true,
                'data' => [
                    'current' => $currentSnapshot,
                    'delta' => $delta,
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
     * Ambil 1 data metrics terbaru dari database (read-only)
     * Endpoint ini TIDAK melakukan WMI query, hanya membaca dari tabel
     *
     * @return JsonResponse
     */
    public function latest(): JsonResponse
    {
        try {
            // Ambil data terbaru menggunakan Eloquent
            $latestMetric = ServerMetric::latest('created_at')->first();

            // Jika tidak ada data
            if (!$latestMetric) {
                return response()->json([
                    'success' => false,
                    'message' => 'No metrics data available',
                    'data' => null,
                ], 404);
            }

            // Format response sesuai permintaan
            return response()->json([
                'success' => true,
                'data' => [
                    'rx' => $latestMetric->network_rx_bytes_per_sec,
                    'tx' => $latestMetric->network_tx_bytes_per_sec,
                    'reads' => $latestMetric->disk_reads_per_sec,
                    'writes' => $latestMetric->disk_writes_per_sec,
                    'free_space' => $latestMetric->disk_free_space,
                    'latency' => $latestMetric->latency_ms,
                    'timestamp' => $latestMetric->created_at->toIso8601String(),
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
