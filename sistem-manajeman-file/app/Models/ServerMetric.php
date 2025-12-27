<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServerMetric extends Model
{
    protected $table = 'server_metrics';

    protected $fillable = [
        // TIER 2: System-wide Performance
        'network_rx_bytes_per_sec',
        'network_tx_bytes_per_sec',
        'disk_reads_per_sec',
        'disk_writes_per_sec',
        'disk_free_space',
        'latency_ms',
        // TIER 1: Critical System Metrics
        'cpu_usage_percent',
        'memory_usage_percent',
        'memory_available_mb',
        'tcp_connections_total',
        'tcp_connections_external',
        'concurrent_users',
        'disk_queue_length',
        // TIER 3: Application-Specific Metrics
        'app_network_bytes_per_sec',
        'mysql_reads_per_sec',
        'mysql_writes_per_sec',
        'app_response_time_ms',
        'app_requests_per_sec',
    ];

    protected $casts = [
        // TIER 2: System-wide
        'network_rx_bytes_per_sec' => 'float',
        'network_tx_bytes_per_sec' => 'float',
        'disk_reads_per_sec' => 'float',
        'disk_writes_per_sec' => 'float',
        'disk_free_space' => 'integer',
        'latency_ms' => 'integer',
        // TIER 1: Critical
        'cpu_usage_percent' => 'float',
        'memory_usage_percent' => 'float',
        'memory_available_mb' => 'float',
        'tcp_connections_total' => 'integer',
        'tcp_connections_external' => 'integer',
        'concurrent_users' => 'integer',
        'disk_queue_length' => 'float',
        // TIER 3: Application
        'app_network_bytes_per_sec' => 'float',
        'mysql_reads_per_sec' => 'float',
        'mysql_writes_per_sec' => 'float',
        'app_response_time_ms' => 'integer',
        'app_requests_per_sec' => 'float',
        // Timestamps
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Dapatkan network RX dalam KB/s
     */
    public function getNetworkRxKbpsAttribute()
    {
        return round($this->network_rx_bytes_per_sec / 1024, 2);
    }

    /**
     * Dapatkan network TX dalam KB/s
     */
    public function getNetworkTxKbpsAttribute()
    {
        return round($this->network_tx_bytes_per_sec / 1024, 2);
    }

    /**
     * Dapatkan disk free space dalam GB
     */
    public function getDiskFreeSpaceGbAttribute()
    {
        return round($this->disk_free_space / (1024 ** 3), 2);
    }

    /**
     * Scope untuk mendapatkan metrics terbaru
     */
    public function scopeLatestFirst($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Static method untuk mendapatkan metrics terbaru (limit)
     */
    public static function getLatestMetrics($limit = 10)
    {
        return self::latestFirst()->limit($limit)->get();
    }

    /**
     * Hapus metrics lama (lebih dari N hari)
     */
    public static function deleteOldMetrics($days = 7)
    {
        return self::where('created_at', '<', now()->subDays($days))->delete();
    }
}
