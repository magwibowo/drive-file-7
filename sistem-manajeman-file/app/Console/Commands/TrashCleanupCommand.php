<?php

namespace App\Console\Commands;

use App\Models\File;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class TrashCleanupCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trash:cleanup {--days=30 : Number of days before permanent deletion}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete files that have been in trash for more than specified days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = (int) $this->option('days');
        $cutoffDate = now()->subDays($days);

        $this->info("🗑️  Starting trash cleanup...");
        $this->info("📅 Deleting files trashed before: {$cutoffDate->format('Y-m-d H:i:s')}");

        // Get files deleted more than X days ago
        $oldTrashedFiles = File::onlyTrashed()
            ->where('deleted_at', '<=', $cutoffDate)
            ->get();

        if ($oldTrashedFiles->isEmpty()) {
            $this->info("✨ No files to clean up. Trash is already clean!");
            return 0;
        }

        $totalSize = 0;
        $successCount = 0;
        $errorCount = 0;

        $this->info("📦 Found {$oldTrashedFiles->count()} files to permanently delete...\n");

        foreach ($oldTrashedFiles as $file) {
            try {
                // Calculate trash path
                $deletedDate = $file->deleted_at->format('Y-m-d');
                $filename = basename($file->path_penyimpanan);
                $trashPath = "trash/{$file->division_id}/{$deletedDate}/{$filename}";

                // Delete physical file from trash
                if (Storage::disk('nas_uploads')->exists($trashPath)) {
                    $fileSize = Storage::disk('nas_uploads')->size($trashPath);
                    Storage::disk('nas_uploads')->delete($trashPath);
                    $totalSize += $fileSize;
                }

                // Force delete from database
                $file->forceDelete();

                $successCount++;
                $this->line("  ✓ Deleted: {$file->nama_file_asli} ({$this->formatBytes($file->ukuran_file)})");

            } catch (\Exception $e) {
                $errorCount++;
                $this->error("  ✗ Error deleting {$file->nama_file_asli}: {$e->getMessage()}");
                Log::error("Trash cleanup error for file {$file->id}: {$e->getMessage()}");
            }
        }

        // Cleanup empty directories
        $this->cleanupEmptyDirectories();

        // Summary
        $this->newLine();
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("📊 CLEANUP SUMMARY");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("✅ Successfully deleted: {$successCount} files");
        if ($errorCount > 0) {
            $this->warn("⚠️  Errors encountered: {$errorCount} files");
        }
        $this->info("💾 Space freed: {$this->formatBytes($totalSize)}");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        Log::info("Trash cleanup completed: {$successCount} files deleted, {$this->formatBytes($totalSize)} freed");

        return 0;
    }

    /**
     * Clean up empty directories in trash folder
     */
    private function cleanupEmptyDirectories()
    {
        try {
            $trashDirs = Storage::disk('nas_uploads')->directories('trash');
            
            foreach ($trashDirs as $divisionDir) {
                $dateDirs = Storage::disk('nas_uploads')->directories($divisionDir);
                
                foreach ($dateDirs as $dateDir) {
                    // Check if directory is empty
                    $files = Storage::disk('nas_uploads')->files($dateDir);
                    if (empty($files)) {
                        Storage::disk('nas_uploads')->deleteDirectory($dateDir);
                        $this->line("  🗂️  Removed empty directory: {$dateDir}");
                    }
                }
                
                // Check if division directory is empty
                $remainingDirs = Storage::disk('nas_uploads')->directories($divisionDir);
                if (empty($remainingDirs)) {
                    Storage::disk('nas_uploads')->deleteDirectory($divisionDir);
                    $this->line("  🗂️  Removed empty division directory: {$divisionDir}");
                }
            }
        } catch (\Exception $e) {
            $this->warn("Warning: Could not cleanup empty directories: {$e->getMessage()}");
        }
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
