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
        // Create NAS metrics table for monitoring
        Schema::create('nas_metrics', function (Blueprint $table) {
            $table->id();
            $table->boolean('nas_available')->default(false);
            $table->string('nas_ip', 45)->nullable();
            $table->string('nas_drive', 10)->nullable();
            $table->bigInteger('nas_free_space')->default(0);
            $table->bigInteger('nas_total_space')->default(0);
            $table->bigInteger('nas_used_space')->default(0);
            $table->decimal('nas_usage_percent', 5, 2)->default(0);
            $table->integer('nas_network_latency')->nullable()->comment('Latency in milliseconds');
            $table->decimal('nas_read_speed', 8, 2)->nullable()->comment('Read speed in MB/s');
            $table->decimal('nas_write_speed', 8, 2)->nullable()->comment('Write speed in MB/s');
            $table->decimal('nas_read_iops', 8, 2)->nullable()->comment('Read IOPS (operations/sec)');
            $table->decimal('nas_write_iops', 8, 2)->nullable()->comment('Write IOPS (operations/sec)');
            $table->decimal('nas_total_iops', 8, 2)->nullable()->comment('Total IOPS (read + write)');
            $table->integer('nas_file_count')->default(0);
            $table->integer('nas_concurrent_users')->default(0)->comment('Number of concurrent SMB sessions');
            $table->timestamps();

            // Index for time-based queries
            $table->index('created_at');
            $table->index('nas_available');
        });

        // Add storage_location to files table for tracking where files are stored
        if (Schema::hasTable('files') && !Schema::hasColumn('files', 'storage_location')) {
            Schema::table('files', function (Blueprint $table) {
                $table->enum('storage_location', ['local', 'nas', 'backup'])
                    ->default('local')
                    ->after('path_penyimpanan')
                    ->comment('Storage location: local, nas, or backup');
                
                $table->index('storage_location');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove storage_location column from files table
        if (Schema::hasTable('files') && Schema::hasColumn('files', 'storage_location')) {
            Schema::table('files', function (Blueprint $table) {
                $table->dropIndex(['storage_location']);
                $table->dropColumn('storage_location');
            });
        }

        // Drop NAS metrics table
        Schema::dropIfExists('nas_metrics');
    }
};
