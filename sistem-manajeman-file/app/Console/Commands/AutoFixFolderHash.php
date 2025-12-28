<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Folder;
use App\Models\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AutoFixFolderHash extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'folders:auto-fix-hash {--dry-run : Show what would be fixed without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically fix folders without hash by generating random hash and renaming filesystem';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');
        
        $this->info('🔍 Scanning for folders without hash...');
        $this->newLine();

        // Find folders without hash
        $foldersWithoutHash = Folder::whereNull('folder_hash')
            ->orWhere('folder_hash', '')
            ->with('division')
            ->get();

        if ($foldersWithoutHash->isEmpty()) {
            $this->info('✅ All folders already have hash!');
            return 0;
        }

        $this->warn("Found {$foldersWithoutHash->count()} folders without hash:");
        $this->newLine();

        foreach ($foldersWithoutHash as $folder) {
            $divisionName = $folder->division ? $folder->division->name : 'Unknown';
            $this->line("  - {$folder->name} (ID: {$folder->id}, Division: {$divisionName})");
        }

        $this->newLine();

        if ($isDryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
            $this->newLine();
            
            foreach ($foldersWithoutHash as $folder) {
                $this->displayFixPlan($folder);
            }
            
            $this->newLine();
            $this->info('💡 Run without --dry-run to apply changes');
            return 0;
        }

        // Confirm before proceeding
        if (!$this->confirm('Do you want to fix these folders?', true)) {
            $this->warn('Operation cancelled.');
            return 1;
        }

        $this->newLine();
        $this->info('🔧 Fixing folders...');
        $this->newLine();

        $fixed = 0;
        $errors = 0;

        foreach ($foldersWithoutHash as $folder) {
            try {
                DB::beginTransaction();

                $this->line("📁 Processing: {$folder->name}");

                // Generate new hash
                $newHash = Folder::generateFolderHash();
                
                // Build old and new paths
                $divisionSlug = $folder->division ? Str::slug($folder->division->name, '-') : 'unknown';
                $oldFolderName = Str::slug($folder->name, '-');
                $oldPath = "uploads/{$divisionSlug}/{$oldFolderName}";
                $newPath = "uploads/{$divisionSlug}/{$newHash}";

                $this->line("   Old path: {$oldPath}");
                $this->line("   New path: {$newPath}");

                // Check if old folder exists in filesystem
                if (Storage::disk('nas_uploads')->exists($oldPath)) {
                    // Rename folder in filesystem
                    Storage::disk('nas_uploads')->move($oldPath, $newPath);
                    $this->line("   ✅ Folder renamed in filesystem");

                    // Update file paths if folder has files
                    $files = File::where('folder_id', $folder->id)->get();
                    if ($files->count() > 0) {
                        foreach ($files as $file) {
                            $oldFilePath = $file->path_penyimpanan;
                            $newFilePath = str_replace($oldPath, $newPath, $oldFilePath);
                            
                            if ($oldFilePath !== $newFilePath) {
                                $file->path_penyimpanan = $newFilePath;
                                $file->save();
                            }
                        }
                        $this->line("   ✅ Updated {$files->count()} file paths");
                    }
                } else {
                    $this->warn("   ⚠️  Old path not found in filesystem, skipping rename");
                }

                // Update folder hash in database
                $folder->folder_hash = $newHash;
                $folder->save();
                $this->line("   ✅ Hash saved to database: {$newHash}");

                DB::commit();
                $fixed++;
                $this->newLine();

            } catch (\Exception $e) {
                DB::rollback();
                $errors++;
                $this->error("   ❌ Error: {$e->getMessage()}");
                $this->newLine();
            }
        }

        $this->newLine();
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("📊 SUMMARY");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("✅ Successfully fixed: {$fixed} folders");
        if ($errors > 0) {
            $this->error("❌ Errors: {$errors}");
        }
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        return 0;
    }

    /**
     * Display what would be fixed in dry-run mode
     */
    private function displayFixPlan(Folder $folder)
    {
        $divisionSlug = $folder->division ? Str::slug($folder->division->name, '-') : 'unknown';
        $oldFolderName = Str::slug($folder->name, '-');
        $oldPath = "uploads/{$divisionSlug}/{$oldFolderName}";
        $newHash = '(random 40 chars)';
        $newPath = "uploads/{$divisionSlug}/{$newHash}";

        $this->line("📁 {$folder->name} (ID: {$folder->id})");
        $this->line("   Would rename: {$oldPath}");
        $this->line("   To: {$newPath}");
        
        $fileCount = File::where('folder_id', $folder->id)->count();
        if ($fileCount > 0) {
            $this->line("   Would update: {$fileCount} file paths");
        }
        
        $this->newLine();
    }
}
