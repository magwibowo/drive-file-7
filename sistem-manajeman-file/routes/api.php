<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\BackupScheduleController;
use App\Http\Controllers\Api\NasHealthController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\Admin\DivisionController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\Admin\DashboardController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use App\Models\Role;
use App\Http\Controllers\Api\SuperAdminController;
use App\Http\Controllers\Api\Admin\FolderController;
use App\Http\Controllers\Api\ServerMetricsController;
use App\Http\Controllers\Api\NasMetricsController;

// Health check endpoint untuk monitoring (tidak perlu auth)
Route::get('/health', function() {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'service' => 'Laravel File Management System'
    ]);
});

// DEBUG: Test if new code is loaded (no auth required)
Route::get('/debug/backup-config', function() {
    return response()->json([
        'MYSQL_DUMP_PATH' => env('MYSQL_DUMP_PATH'),
        'DB_HOST' => env('DB_HOST'),
        'DB_PORT' => env('DB_PORT'),
        'DB_DATABASE' => env('DB_DATABASE'),
        'working_directory' => getcwd(),
        'php_sapi' => php_sapi_name(),
        'opcache_enabled' => ini_get('opcache.enable'),
        'code_timestamp' => 'updated_' . date('Y-m-d_H:i:s'),
    ]);
});

// DEBUG: Test backup flow step-by-step (no auth for testing)
Route::get('/debug/backup-test', function() {
    $mysqldumpPath = env('MYSQL_DUMP_PATH');
    $mysqldumpBinary = rtrim($mysqldumpPath, '\\/') . DIRECTORY_SEPARATOR . 'mysqldump.exe';
    
    $connection = config('database.default');
    $dbConfig = config("database.connections.{$connection}");
    
    return response()->json([
        'step1_env_loaded' => !empty($mysqldumpPath),
        'step2_mysqldump_path' => $mysqldumpPath,
        'step3_mysqldump_binary' => $mysqldumpBinary,
        'step4_file_exists' => file_exists($mysqldumpBinary),
        'step5_db_config' => [
            'host' => $dbConfig['host'] ?? 'N/A',
            'port' => $dbConfig['port'] ?? 'N/A',
            'database' => $dbConfig['database'] ?? 'N/A',
            'username' => $dbConfig['username'] ?? 'N/A',
        ],
        'step6_nas_path' => env('NAS_DRIVE_PATH', 'Z:\\') . 'backups',
        'step7_nas_writable' => is_writable(env('NAS_DRIVE_PATH', 'Z:\\') . 'backups'),
        'working_directory' => getcwd(),
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'N/A',
    ]);
});

// Rute Publik
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// Grup Rute Terotentikasi
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // --- RUTE MANAJEMEN FILE ---
    Route::get('/files', [FileController::class, 'index']);
    Route::post('/files', [FileController::class, 'store']);
    Route::get('/files/recent', [FileController::class, 'recent']);
    Route::get('/files/favorites', [FileController::class, 'favorites']);
    Route::get('/files/trashed', [FileController::class, 'trashed']);
    Route::get('/files/all', [FileController::class, 'allFiles']);

    Route::prefix('files/{fileId}')->group(function () {
        Route::put('/rename', [FileController::class, 'rename']);
        Route::get('/', [FileController::class, 'download']);
        Route::delete('/', [FileController::class, 'destroy']);
        Route::post('/favorite', [FileController::class, 'toggleFavorite']);
        Route::post('/restore', [FileController::class, 'restore']);
        Route::delete('/force', [FileController::class, 'forceDelete']);
    });

    // --- RUTE BACKUP (SUPER ADMIN ONLY) ---
    Route::prefix('backups')->group(function () {
        // GET /api/backups -> Menampilkan semua backup
        Route::get('/', [BackupController::class, 'index']);
        
        // POST /api/backups/run -> Menjalankan backup manual
        Route::post('/run', [BackupController::class, 'run']);
        
        // Rute untuk settings
        Route::get('/settings', [BackupController::class, 'getSettings']);
        Route::post('/settings', [BackupController::class, 'updateSettings']);
        
        // Rute untuk schedule
        Route::get('/schedule', [BackupController::class, 'getSchedule']);
        Route::post('/schedule', [BackupController::class, 'updateSchedule']);
        
        // GET /api/backups/{backup}/download -> Download backup spesifik
        Route::get('/{backup}/download', [BackupController::class, 'download']);
        
        // DELETE /api/backups/{backup} -> Hapus backup spesifik
        Route::delete('/{backup}', [BackupController::class, 'destroy']);      
    });
    
    // --- RUTE NAS HEALTH CHECK ---
    Route::prefix('nas')->group(function () {
        Route::get('/health', [NasHealthController::class, 'checkHealth']);
        Route::post('/test-write', [NasHealthController::class, 'testWrite']);
    });

    // --- GRUP RUTE ADMIN (/api/admin/...) ---
    Route::prefix('admin')->group(function () {

        // Rute yang bisa diakses Super Admin & Admin Devisi
        Route::middleware('check.role:super_admin,admin_devisi')->group(function () {
            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::get('/users/trashed', [UserController::class, 'trashed']);
            Route::get('/users/{user}', [UserController::class, 'show']);
            Route::put('/users/{user}', [UserController::class, 'update']);
            Route::delete('/users/{user}', [UserController::class, 'destroy']);
            Route::put('/users/{user}/restore', [UserController::class, 'restore']);
            Route::delete('/users/{user}/force-delete', [UserController::class, 'forceDelete']);

            Route::get('/folders/trashed', [FolderController::class, 'trashed']);
            Route::post('/folders/{id}/restore', [FolderController::class, 'restore']);
            Route::delete('/folders/{id}/force', [FolderController::class, 'forceDelete']);
            Route::apiResource('/folders', FolderController::class);

            // Route untuk admin devisi melihat log aktivitas divisinya
            Route::get('/activity-logs/division', [FolderController::class, 'getDivisionLogs']);
        });

        // Rute yang HANYA bisa diakses Super Admin
        Route::middleware('check.role:super_admin')->group(function () {
            Route::put('/divisions/{division}/quota', [DivisionController::class, 'updateQuota']);
            Route::get('/divisions-with-stats', [SuperAdminController::class, 'getDivisionsWithStats']);
            Route::apiResource('/divisions', DivisionController::class);
            Route::get('/dashboard-stats', [DashboardController::class, 'index']);
            Route::get('/divisions-with-folders', [SuperAdminController::class, 'getDivisionsWithFolders']);
            Route::get('/roles', fn() => Role::all());
            Route::get('/activity-logs', [SuperAdminController::class, 'getActivityLogs']);
            Route::post('/activity-logs/delete-by-range', [SuperAdminController::class, 'deleteActivityLogsByRange']);
            Route::delete('/activity-logs', [SuperAdminController::class, 'purgeActivityLogs']);

            Route::get('/login-history', [SuperAdminController::class, 'getLoginHistory']);
            Route::delete('/login-history', [SuperAdminController::class, 'purgeLoginHistory']);
            Route::get('/login-history/count-purge', [SuperAdminController::class, 'countLoginHistoryForPurge']);

            // Server Monitoring Routes
            Route::prefix('server-metrics')->group(function () {
                Route::post('/start', [ServerMetricsController::class, 'start']);
                Route::post('/poll', [ServerMetricsController::class, 'poll']);
                Route::post('/stop', [ServerMetricsController::class, 'stop']);
                Route::get('/history', [ServerMetricsController::class, 'history']);
                Route::get('/latest', [ServerMetricsController::class, 'latest']);
            });

            // NAS Monitoring Routes
            Route::prefix('nas-metrics')->group(function () {
                Route::get('/test', [NasMetricsController::class, 'test']);
                Route::post('/poll', [NasMetricsController::class, 'poll']);
                Route::get('/latest', [NasMetricsController::class, 'latest']);
                Route::get('/history', [NasMetricsController::class, 'history']);
                Route::get('/stats', [NasMetricsController::class, 'stats']);
            });
        });
    });

});
