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
            // Tambah kolom untuk REAL concurrent users (aplikasi login sessions)
            $table->integer('concurrent_users')->default(0)->after('tcp_connections_external');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('server_metrics', function (Blueprint $table) {
            $table->dropColumn('concurrent_users');
        });
    }
};
