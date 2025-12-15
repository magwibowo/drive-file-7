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
        Schema::create('server_metrics', function (Blueprint $table) {
            $table->id();
            $table->double('network_rx_bytes_per_sec');
            $table->double('network_tx_bytes_per_sec');
            $table->double('disk_reads_per_sec');
            $table->double('disk_writes_per_sec');
            $table->bigInteger('disk_free_space');
            $table->integer('latency_ms')->nullable();
            $table->timestamps();
            
            // Index untuk query berdasarkan waktu (logging setiap 2 detik)
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('server_metrics');
    }
};
