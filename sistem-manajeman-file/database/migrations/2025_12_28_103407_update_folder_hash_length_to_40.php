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
        Schema::table('folders', function (Blueprint $table) {
            $table->dropUnique(['folder_hash']);
        });
        
        Schema::table('folders', function (Blueprint $table) {
            $table->string('folder_hash', 40)->nullable()->unique()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('folders', function (Blueprint $table) {
            $table->dropUnique(['folder_hash']);
        });
        
        Schema::table('folders', function (Blueprint $table) {
            $table->string('folder_hash', 32)->nullable()->unique()->change();
        });
    }
};
