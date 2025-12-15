<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServerMetric extends Model
{
    protected $table = 'server_metrics';

    protected $fillable = [
        'network_rx_bytes_per_sec',
        'network_tx_bytes_per_sec',
        'disk_reads_per_sec',
        'disk_writes_per_sec',
        'disk_free_space',
        'latency_ms',
    ];

    protected $casts = [
        'network_rx_bytes_per_sec' => 'float',
        'network_tx_bytes_per_sec' => 'float',
        'disk_reads_per_sec' => 'float',
        'disk_writes_per_sec' => 'float',
        'disk_free_space' => 'integer',
        'latency_ms' => 'integer',
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
