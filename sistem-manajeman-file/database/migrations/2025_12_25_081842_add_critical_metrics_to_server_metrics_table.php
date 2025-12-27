<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('server_metrics', function (Blueprint $table) {
            // TIER 1 Critical Metrics - CPU
            $table->decimal('cpu_usage_percent', 5, 2)->nullable()->after('latency_ms')
                ->comment('CPU Usage Percentage (0-100)');
            
            // TIER 1 Critical Metrics - Memory
            $table->decimal('memory_usage_percent', 5, 2)->nullable()->after('cpu_usage_percent')
                ->comment('Memory Usage Percentage (0-100)');
            $table->decimal('memory_available_mb', 10, 2)->nullable()->after('memory_usage_percent')
                ->comment('Available Memory in MB');
            
            // TIER 1 Critical Metrics - Connections (Concurrent Users)
            $table->integer('active_connections')->nullable()->after('memory_available_mb')
                ->comment('Number of active TCP connections (established)');
            
            // TIER 1 Critical Metrics - Disk Performance
            $table->decimal('disk_queue_length', 8, 2)->nullable()->after('active_connections')
                ->comment('Disk I/O queue length (detect bottleneck)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('server_metrics', function (Blueprint $table) {
            $table->dropColumn([
                'cpu_usage_percent',
                'memory_usage_percent',
                'memory_available_mb',
                'active_connections',
                'disk_queue_length',
            ]);
        });
    }
};
