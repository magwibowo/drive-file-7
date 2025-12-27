<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BackupSetting;
use App\Models\BackupSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\DbDumper\Databases\MySql;
use Illuminate\Support\Facades\Log;
use App\Models\Backup;
use ZipArchive;


class BackupController extends Controller
{
    public function getSchedule(): JsonResponse
    {
        $schedule = BackupSchedule::first();
        return response()->json([
            'status' => 'success',
            'schedule' => $schedule
        ]);
    }

    public function updateSchedule(Request $request): JsonResponse
    {
        $request->validate([
            'frequency'   => 'required|string|in:off,daily,weekly,monthly,yearly',
            'time'        => 'nullable|string',
            'day_of_week' => 'nullable|string',
            'day_of_month'=> 'nullable|integer|min:1|max:31',
            'month'       => 'nullable|integer|min:1|max:12',
        ]);

        $data = $request->only([
            'frequency', 'time', 'day_of_week', 'day_of_month', 'month'
        ]);

        $schedule = BackupSchedule::first();
        if ($schedule) {
            $schedule->update($data);
        } else {
            $schedule = BackupSchedule::create($data);
        }

        return response()->json([
            'message' => 'Schedule updated successfully',
            'schedule' => $schedule
        ]);
    }

    // Ambil path backup yang sedang aktif
    public function getSettings(): JsonResponse
    {
        $setting = BackupSetting::first();
        $defaultPath = env('NAS_DRIVE_PATH', 'Z:\\') . 'backups';
        return response()->json([
            'status' => 'success',
            'backup_path' => $setting ? $setting->backup_path : $defaultPath
        ]);
    }

    // Update path dari frontend
    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'backup_path' => 'required|string'
        ]);

        $path = str_replace('"', '', $request->backup_path); // bersihkan tanda kutip

        $setting = BackupSetting::first();

        if ($setting) {
            $setting->update(['backup_path' => $path]);
        } else {
            $setting = BackupSetting::create(['backup_path' => $path]);
        }

        // Set disk backup_disk root ke folder user
        config()->set('filesystems.disks.backup_disk.root', $path);

        return response()->json([
            'message' => 'Backup path updated successfully',
            'backup_path' => $setting->backup_path
        ]);
    }



public function run(Request $request)
{
    // SOLUSI ULTIMATE: Execute artisan command di process terpisah (CLI context)
    // Ini memastikan environment sama persis dengan menjalankan langsung di terminal
    try {
        Log::info('Manual backup triggered from HTTP request');
        
        // Get PHP binary path
        $phpBinary = PHP_BINARY; // Full path ke php.exe
        $artisanPath = base_path('artisan');
        
        // Build command
        $command = sprintf('"%s" "%s" backup:run 2>&1', $phpBinary, $artisanPath);
        
        Log::info('Executing backup command', ['command' => $command]);
        
        // Execute command dan tangkap output
        $output = [];
        $exitCode = 0;
        exec($command, $output, $exitCode);
        
        $outputString = implode("\n", $output);
        
        Log::info('Backup command completed', [
            'exit_code' => $exitCode,
            'output' => $outputString
        ]);
        
        if ($exitCode === 0) {
            // Ambil backup terbaru
            $latestBackup = Backup::latest()->first();
            
            return response()->json([
                'message' => 'Backup berhasil dibuat',
                'file' => $latestBackup->path ?? 'N/A',
                'filename' => $latestBackup->filename ?? 'N/A',
            ]);
        } else {
            Log::error('Backup command failed', [
                'exit_code' => $exitCode,
                'output' => $outputString
            ]);
            
            return response()->json([
                'message' => 'Backup gagal. Periksa log untuk detail.',
                'error' => $outputString
            ], 500);
        }
    } catch (\Throwable $e) {
        Log::error('Error executing backup command', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'message' => 'Terjadi kesalahan saat backup',
            'error' => $e->getMessage()
        ], 500);
    }
}

/**
 * Rekursif menambahkan folder ke dalam zip
 * $zipPath = path yang diinginkan di dalam zip, mis: 'storage/app/uploads'
 */
private function addFolderToZip(string $folderPath, \ZipArchive $zip, string $zipPath)
{
    // Gunakan RecursiveDirectoryIterator untuk mendapatkan path dasar
    $directory = new \RecursiveDirectoryIterator($folderPath, \FilesystemIterator::SKIP_DOTS);

    // Gunakan RecursiveIteratorIterator untuk iterasi
    $iterator = new \RecursiveIteratorIterator(
        $directory,
        \RecursiveIteratorIterator::LEAVES_ONLY
    );

    foreach ($iterator as $file) {
        // Pastikan kita hanya memproses file, bukan direktori
        if ($file->isDir()) {
            continue;
        }

        $filePath = $file->getRealPath();

        // GANTI BARIS ERROR INI: Ambil path relatif dari base folder
        // Kita menggunakan substr untuk memotong path dasar ($folderPath)
        $relativePath = substr($filePath, strlen($folderPath) + 1);

        // Perbaiki separator direktori (opsional, tapi disarankan untuk ZIP)
        $relativePath = str_replace('\\', '/', $relativePath);

        // Membangun path lengkap di dalam ZIP
        $zipInnerPath = trim(str_replace(['\\', '/'], '/', $zipPath), '/') . '/' . $relativePath;

        $zip->addFile($filePath, $zipInnerPath);
    }
}

    // List semua backup
    public function index()
    {
        return Backup::all();
    }




    //Download backup berdasarkan ID
    public function download($id)
{
    $backup = Backup::findOrFail($id);

    if (!file_exists($backup->path)) {
        return response()->json(['error' => 'File tidak ditemukan'], 404);
    }

    return response()->streamDownload(function () use ($backup) {
        readfile($backup->path);
    }, $backup->filename, [
        'Content-Type'        => 'application/zip',
        'Content-Disposition' => 'attachment; filename="'.$backup->filename.'"',
    ]);
}


    // Hapus backup berdasarkan ID
    public function destroy($id)
    {
        $backup = Backup::findOrFail($id);
        if (file_exists($backup->path)) {
            unlink($backup->path);
        }
        $backup->delete();

        return response()->json(['message' => 'Backup berhasil dihapus']);
    }
}