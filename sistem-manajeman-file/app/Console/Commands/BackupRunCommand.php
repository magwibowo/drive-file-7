<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\BackupSetting;
use App\Models\Backup;
use Spatie\DbDumper\Databases\MySql;
use Illuminate\Support\Facades\Log;
use ZipArchive;

class BackupRunCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:run';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run scheduled backup (database + uploads)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Starting scheduled backup...');

        try {
            // Execute backup logic directly
            $result = $this->executeBackup();
            
            if ($result['success']) {
                $this->info('✅ Backup completed successfully!');
                $this->info('📦 File: ' . $result['file']);
                return 0;
            } else {
                $this->error('❌ Backup failed: ' . $result['message']);
                return 1;
            }
        } catch (\Exception $e) {
            $this->error('❌ Backup error: ' . $e->getMessage());
            Log::error('Scheduled backup failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }
    }

    /**
     * Execute backup logic (database + files to ZIP)
     */
    private function executeBackup(): array
    {
        // Get backup path from settings
        $setting = BackupSetting::first();
        $defaultPath = env('NAS_DRIVE_PATH', 'Z:\\') . 'backups';
        $backupPath = $setting ? trim($setting->backup_path, "\" \t\n\r\0\x0B") : $defaultPath;

        if (!file_exists($backupPath)) {
            if (!mkdir($backupPath, 0755, true) && !is_dir($backupPath)) {
                return ['success' => false, 'message' => 'Gagal membuat folder backup: ' . $backupPath];
            }
        }

        // Prepare filenames
        $timestamp = date('Ymd_His');
        $zipFilename = 'backup_' . $timestamp . '.zip';
        $zipFilePath = rtrim($backupPath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . $zipFilename;
        $dbDumpFile  = storage_path('app/db-backup-' . $timestamp . '.sql');

        // Get DB config
        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");

        if (empty($dbConfig['database']) || empty($dbConfig['username'])) {
            return ['success' => false, 'message' => 'Konfigurasi database tidak lengkap'];
        }

        // Dump database
        try {
            $dumper = MySql::create()
                ->setDbName($dbConfig['database'])
                ->setUserName($dbConfig['username'])
                ->setPassword($dbConfig['password'] ?? '');

            // Set mysqldump binary path
            if (!empty(env('MYSQL_DUMP_PATH'))) {
                $dumpPath = rtrim(env('MYSQL_DUMP_PATH'), '/\\') . DIRECTORY_SEPARATOR;
                $dumper->setDumpBinaryPath($dumpPath);
            }
            
            // Force TCP for Windows
            $dumper->addExtraOption('--protocol=TCP');
            
            if (!empty($dbConfig['host'])) {
                $dumper->setHost($dbConfig['host']);
            }
            if (!empty($dbConfig['port'])) {
                $dumper->setPort($dbConfig['port']);
            }
            
            $dumper->addExtraOption('--skip-lock-tables');
            $dumper->addExtraOption('--no-tablespaces');
            $dumper->addExtraOption('--set-gtid-purged=OFF');

            $dumper->dumpToFile($dbDumpFile);

            if (!file_exists($dbDumpFile)) {
                return ['success' => false, 'message' => 'Gagal membuat dump database'];
            }
        } catch (\Throwable $e) {
            Log::error('DB dump error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Gagal dump database: ' . $e->getMessage()];
        }

        // Create ZIP
        $zip = new ZipArchive();
        if ($zip->open($zipFilePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return ['success' => false, 'message' => 'Tidak bisa membuat file ZIP'];
        }

        $zip->addFile($dbDumpFile, 'database-dumps/' . basename($dbDumpFile));

        $uploadsPath = storage_path('app/uploads');
        if (is_dir($uploadsPath)) {
            $this->addFolderToZip($uploadsPath, $zip, 'storage/app/uploads');
        }

        $zip->close();

        // Cleanup temp SQL file
        if (file_exists($dbDumpFile)) {
            @unlink($dbDumpFile);
        }

        // Save to database
        Backup::create([
            'filename' => $zipFilename,
            'path'     => $zipFilePath,
            'schedule' => 'manual',
            'size'     => filesize($zipFilePath),
        ]);

        return [
            'success' => true,
            'file' => $zipFilePath,
            'filename' => $zipFilename
        ];
    }

    /**
     * Add folder recursively to ZIP
     */
    private function addFolderToZip(string $folderPath, ZipArchive $zip, string $zipPath)
    {
        $directory = new \RecursiveDirectoryIterator($folderPath, \FilesystemIterator::SKIP_DOTS);
        $iterator = new \RecursiveIteratorIterator($directory, \RecursiveIteratorIterator::LEAVES_ONLY);

        foreach ($iterator as $file) {
            if ($file->isDir()) {
                continue;
            }

            $filePath = $file->getRealPath();
            $relativePath = substr($filePath, strlen($folderPath) + 1);
            $archivePath = $zipPath . '/' . str_replace('\\', '/', $relativePath);

            $zip->addFile($filePath, $archivePath);
        }
    }
}
