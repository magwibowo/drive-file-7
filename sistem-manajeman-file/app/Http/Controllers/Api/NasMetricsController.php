<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NasMetric;
use App\Services\NasMonitoringService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NasMetricsController extends Controller
{
    protected NasMonitoringService $nasService;

    public function __construct(NasMonitoringService $nasService)
    {
        $this->nasService = $nasService;
    }

    /**
     * Get latest NAS metrics from database
     *
     * @return JsonResponse
     */
    public function latest(): JsonResponse
    {
        try {
            $latestMetric = NasMetric::latest()->first();

            if (!$latestMetric) {
                return response()->json([
                    'success' => false,
                    'message' => 'No NAS metrics available. Please start monitoring first.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'available' => $latestMetric->nas_available,
                    'ip' => $latestMetric->nas_ip,
                    'drive' => $latestMetric->nas_drive,
                    'free_space' => $latestMetric->nas_free_space,
                    'total_space' => $latestMetric->nas_total_space,
                    'used_space' => $latestMetric->nas_used_space,
                    'usage_percent' => $latestMetric->nas_usage_percent,
                    'latency' => $latestMetric->nas_network_latency,
                    'read_speed' => $latestMetric->nas_read_speed,
                    'write_speed' => $latestMetric->nas_write_speed,
                    'read_iops' => $latestMetric->nas_read_iops,
                    'write_iops' => $latestMetric->nas_write_iops,
                    'total_iops' => $latestMetric->nas_total_iops,
                    'file_count' => $latestMetric->nas_file_count,
                    'concurrent_users' => $latestMetric->nas_concurrent_users,
                    'status_color' => $latestMetric->status_color,
                    'status_text' => $latestMetric->status_text,
                    'timestamp' => $latestMetric->created_at->toIso8601String(),
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve NAS metrics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Poll NAS metrics and save to database
     *
     * @return JsonResponse
     */
    public function poll(): JsonResponse
    {
        try {
            // Get current NAS metrics
            $metrics = $this->nasService->getMetrics();

            // Save to database
            $nasMetric = NasMetric::create([
                'nas_available' => $metrics['nas_available'],
                'nas_ip' => $metrics['nas_ip'],
                'nas_drive' => $metrics['nas_drive'],
                'nas_free_space' => $metrics['nas_free_space'],
                'nas_total_space' => $metrics['nas_total_space'],
                'nas_used_space' => $metrics['nas_used_space'],
                'nas_usage_percent' => $metrics['nas_usage_percent'],
                'nas_network_latency' => $metrics['nas_network_latency'],
                'nas_read_speed' => $metrics['nas_read_speed'],
                'nas_write_speed' => $metrics['nas_write_speed'],
                'nas_read_iops' => $metrics['nas_read_iops'],
                'nas_write_iops' => $metrics['nas_write_iops'],
                'nas_total_iops' => $metrics['nas_total_iops'],
                'nas_file_count' => $metrics['nas_file_count'],
                'nas_concurrent_users' => $metrics['nas_concurrent_users'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'NAS metrics polled and saved successfully',
                'data' => [
                    'available' => $nasMetric->nas_available,
                    'ip' => $nasMetric->nas_ip,
                    'drive' => $nasMetric->nas_drive,
                    'free_space' => $nasMetric->nas_free_space,
                    'total_space' => $nasMetric->nas_total_space,
                    'used_space' => $nasMetric->nas_used_space,
                    'usage_percent' => $nasMetric->nas_usage_percent,
                    'latency' => $nasMetric->nas_network_latency,
                    'read_speed' => $nasMetric->nas_read_speed,
                    'write_speed' => $nasMetric->nas_write_speed,
                    'read_iops' => $nasMetric->nas_read_iops,
                    'write_iops' => $nasMetric->nas_write_iops,
                    'total_iops' => $nasMetric->nas_total_iops,
                    'file_count' => $nasMetric->nas_file_count,
                    'concurrent_users' => $nasMetric->nas_concurrent_users,
                    'status_color' => $nasMetric->status_color,
                    'status_text' => $nasMetric->status_text,
                    'timestamp' => $nasMetric->created_at->toIso8601String(),
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to poll NAS metrics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test NAS connection
     *
     * @return JsonResponse
     */
    public function test(): JsonResponse
    {
        try {
            $connectionTest = $this->nasService->testConnection();

            return response()->json([
                'success' => true,
                'data' => $connectionTest,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Connection test failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get NAS metrics history
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function history(Request $request): JsonResponse
    {
        try {
            $hours = $request->input('hours', 24);
            $limit = $request->input('limit', 100);

            $metrics = NasMetric::where('created_at', '>=', now()->subHours($hours))
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $metrics->map(function ($metric) {
                    return [
                        'available' => $metric->nas_available,
                        'free_space' => $metric->nas_free_space,
                        'total_space' => $metric->nas_total_space,
                        'usage_percent' => $metric->nas_usage_percent,
                        'latency' => $metric->nas_network_latency,
                        'read_speed' => $metric->nas_read_speed,
                        'write_speed' => $metric->nas_write_speed,
                        'timestamp' => $metric->created_at->toIso8601String(),
                    ];
                }),
                'count' => $metrics->count(),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve history: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get NAS statistics summary
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        try {
            $latest = NasMetric::latest()->first();
            
            if (!$latest) {
                return response()->json([
                    'success' => false,
                    'message' => 'No metrics available',
                ], 404);
            }

            $last24h = NasMetric::where('created_at', '>=', now()->subDay())->get();

            $stats = [
                'current' => [
                    'available' => $latest->nas_available,
                    'free_gb' => $latest->nas_free_space_gb,
                    'total_gb' => $latest->nas_total_space_gb,
                    'used_gb' => $latest->nas_used_space_gb,
                    'usage_percent' => $latest->nas_usage_percent,
                    'status' => $latest->status_text,
                ],
                'last_24h' => [
                    'avg_latency' => round($last24h->avg('nas_network_latency'), 2),
                    'avg_read_speed' => round($last24h->avg('nas_read_speed'), 2),
                    'avg_write_speed' => round($last24h->avg('nas_write_speed'), 2),
                    'uptime_percent' => round(($last24h->where('nas_available', true)->count() / max($last24h->count(), 1)) * 100, 2),
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate stats: ' . $e->getMessage(),
            ], 500);
        }
    }
}
