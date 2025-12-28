<?php

namespace App\Console\Commands;

use App\Models\Folder;
use App\Models\File;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class MigrateFolderHashCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'folders:migrate-hash {--force : Force migration without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate existing folders to hash-based filesystem structure';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Starting folder hash migration...');
        $this->newLine();

        // Get all folders without hash
        $folders = Folder::whereNull('folder_hash')->get();

        if ($folders->isEmpty()) {
            $this->info('✨ All folders already have hashes. Nothing to migrate.');
            return 0;
        }

        $this->info("📦 Found {$folders->count()} folders to migrate");

        if (!$this->option('force')) {
            if (!$this->confirm('This will rename folders in the filesystem. Continue?', false)) {
                $this->warn('Migration cancelled.');
                return 1;
            }
        }

        $this->newLine();
        $successCount = 0;
        $errorCount = 0;

        foreach ($folders as $folder) {
            try {
                $folder->loadMissing('division', 'parent');
                
                // Get old path (before hash)
                $oldPath = $this->getOldPath($folder);
                
                // Generate and save hash
                $folder->folder_hash = Folder::generateFolderHash($folder->id);
                $folder->save();
                
                // Get new path (with hash)
                $newPath = $folder->getFullPath();
                
                $this->line("  📁 Migrating: {$folder->name}");
                $this->line("     Old: {$oldPath}");
                $this->line("     New: {$newPath}");

                DB::beginTransaction();
                
                try {
                    // Move physical folder if exists
                    if (Storage::disk('nas_uploads')->exists($oldPath)) {
                        Storage::disk('nas_uploads')->move($oldPath, $newPath);
                        
                        // Update file paths
                        $files = File::where('path_penyimpanan', 'like', $oldPath . '%')->get();
                        foreach ($files as $file) {
                            $newFilePath = str_replace($oldPath, $newPath, $file->path_penyimpanan);
                            $file->update(['path_penyimpanan' => $newFilePath]);
                        }
                        
                        $this->info("     ✅ Migrated successfully ({$files->count()} files updated)");
                    } else {
                        // Folder doesn't exist physically, just update hash
                        $this->warn("     ⚠️  Physical folder not found, only updated hash");
                    }
                    
                    DB::commit();
                    $successCount++;
                    
                } catch (\Exception $e) {
                    DB::rollBack();
                    throw $e;
                }
                
            } catch (\Exception $e) {
                $errorCount++;
                $this->error("     ❌ Error: {$e->getMessage()}");
            }
            
            $this->newLine();
        }

        // Summary
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('📊 MIGRATION SUMMARY');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info("✅ Successfully migrated: {$successCount} folders");
        if ($errorCount > 0) {
            $this->warn("⚠️  Errors encountered: {$errorCount} folders");
        }
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return 0;
    }

    /**
     * Get old path (before hash migration)
     */
    private function getOldPath(Folder $folder): string
    {
        $pathParts = [];
        $current = $folder;
        
        while ($current) {
            array_unshift($pathParts, \Illuminate\Support\Str::slug($current->name, '-'));
            $current = $current->parent;
        }
        
        $divisionSlug = $folder->division 
            ? \Illuminate\Support\Str::slug($folder->division->name, '-') 
            : 'divisi-tidak-diketahui';
            
        return 'uploads/' . $divisionSlug . '/' . implode('/', $pathParts);
    }
}
