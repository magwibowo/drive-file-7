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
        // Step 1: Rename kolom
        Schema::table('server_metrics', function (Blueprint $table) {
            $table->renameColumn('active_connections', 'tcp_connections_total');
        });
        
        // Step 2: Tambahkan kolom baru (harus terpisah karena rename)
        Schema::table('server_metrics', function (Blueprint $table) {
            $table->integer('tcp_connections_external')->default(0)->after('tcp_connections_total');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Rollback: hapus kolom baru
        Schema::table('server_metrics', function (Blueprint $table) {
            $table->dropColumn('tcp_connections_external');
        });
        
        // Rollback: kembalikan nama kolom
        Schema::table('server_metrics', function (Blueprint $table) {
            $table->renameColumn('tcp_connections_total', 'active_connections');
        });
    }
};
