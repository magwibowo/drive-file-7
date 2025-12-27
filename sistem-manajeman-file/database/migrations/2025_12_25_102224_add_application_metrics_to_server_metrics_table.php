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
            // TIER 3: Application-Specific Network Metrics
            $table->float('app_network_bytes_per_sec')->nullable()->after('latency_ms')
                ->comment('Application network traffic (Laravel port 8000 only)');
            
            // TIER 3: MySQL Disk IOPS
            $table->float('mysql_reads_per_sec')->nullable()->after('disk_writes_per_sec')
                ->comment('MySQL disk read operations per second');
            $table->float('mysql_writes_per_sec')->nullable()->after('mysql_reads_per_sec')
                ->comment('MySQL disk write operations per second');
            
            // TIER 3: Application Response Time
            $table->integer('app_response_time_ms')->nullable()->after('mysql_writes_per_sec')
                ->comment('API response time in milliseconds (localhost health check)');
            
            // TIER 3: Request Rate
            $table->float('app_requests_per_sec')->nullable()->after('app_response_time_ms')
                ->comment('HTTP requests per second to Laravel application');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('server_metrics', function (Blueprint $table) {
            $table->dropColumn([
                'app_network_bytes_per_sec',
                'mysql_reads_per_sec',
                'mysql_writes_per_sec',
                'app_response_time_ms',
                'app_requests_per_sec'
            ]);
        });
    }
};
