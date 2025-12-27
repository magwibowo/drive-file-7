<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NasMetric extends Model
{
    protected $table = 'nas_metrics';

    protected $fillable = [
        'nas_available',
        'nas_ip',
        'nas_drive',
        'nas_free_space',
        'nas_total_space',
        'nas_used_space',
        'nas_usage_percent',
        'nas_network_latency',
        'nas_read_speed',
        'nas_write_speed',
        'nas_read_iops',
        'nas_write_iops',
        'nas_total_iops',
        'nas_file_count',
        'nas_concurrent_users',
    ];

    protected $casts = [
        'nas_available' => 'boolean',
        'nas_free_space' => 'integer',
        'nas_total_space' => 'integer',
        'nas_used_space' => 'integer',
        'nas_usage_percent' => 'float',
        'nas_network_latency' => 'integer',
        'nas_read_speed' => 'float',
        'nas_write_speed' => 'float',
        'nas_read_iops' => 'float',
        'nas_write_iops' => 'float',
        'nas_total_iops' => 'float',
        'nas_file_count' => 'integer',
        'nas_concurrent_users' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get NAS free space in GB
     */
    public function getNasFreeSpaceGbAttribute(): float
    {
        return round($this->nas_free_space / (1024 ** 3), 2);
    }

    /**
     * Get NAS total space in GB
     */
    public function getNasTotalSpaceGbAttribute(): float
    {
        return round($this->nas_total_space / (1024 ** 3), 2);
    }

    /**
     * Get NAS used space in GB
     */
    public function getNasUsedSpaceGbAttribute(): float
    {
        return round($this->nas_used_space / (1024 ** 3), 2);
    }

    /**
     * Get status badge color
     */
    public function getStatusColorAttribute(): string
    {
        if (!$this->nas_available) {
            return 'red';
        }

        if ($this->nas_usage_percent >= 90) {
            return 'red';
        }

        if ($this->nas_usage_percent >= 75) {
            return 'orange';
        }

        return 'green';
    }

    /**
     * Get status text
     */
    public function getStatusTextAttribute(): string
    {
        if (!$this->nas_available) {
            return 'Offline';
        }

        if ($this->nas_usage_percent >= 90) {
            return 'Critical';
        }

        if ($this->nas_usage_percent >= 75) {
            return 'Warning';
        }

        return 'Healthy';
    }
}
