<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\BackupSetting;
use Illuminate\Support\Facades\DB;

echo "=== Activating Z:\\backups as Default Backup Storage ===\n\n";

// Test 1: Check if Z:\backups exists and writable
$nasBackupPath = env('NAS_DRIVE_PATH', 'Z:\\') . 'backups';
echo "1. Checking NAS backup path: $nasBackupPath\n";
if (is_dir($nasBackupPath)) {
    echo "   ✅ Directory exists\n";
    if (is_writable($nasBackupPath)) {
        echo "   ✅ Directory is writable\n";
    } else {
        echo "   ❌ Directory is NOT writable\n";
        exit(1);
    }
} else {
    echo "   ❌ Directory does NOT exist\n";
    exit(1);
}
echo "\n";

// Test 2: Check current backup_settings in database
echo "2. Checking current backup settings in database...\n";
$currentSetting = BackupSetting::first();
if ($currentSetting) {
    echo "   Current backup_path: " . $currentSetting->backup_path . "\n";
} else {
    echo "   No backup settings found in database\n";
}
echo "\n";

// Test 3: Set default to Z:\backups
echo "3. Setting default backup path to Z:\\backups...\n";
if ($currentSetting) {
    if ($currentSetting->backup_path !== $nasBackupPath) {
        echo "   Updating existing setting...\n";
        $currentSetting->update(['backup_path' => $nasBackupPath]);
        echo "   ✅ Updated from: {$currentSetting->getOriginal('backup_path')}\n";
        echo "   ✅ Updated to: $nasBackupPath\n";
    } else {
        echo "   ✅ Already set to $nasBackupPath\n";
    }
} else {
    echo "   Creating new setting...\n";
    BackupSetting::create(['backup_path' => $nasBackupPath]);
    echo "   ✅ Created with path: $nasBackupPath\n";
}
echo "\n";

// Test 4: Verify setting
echo "4. Verifying database setting...\n";
$verifiedSetting = BackupSetting::first();
if ($verifiedSetting && $verifiedSetting->backup_path === $nasBackupPath) {
    echo "   ✅ Verified: backup_path = {$verifiedSetting->backup_path}\n";
} else {
    echo "   ❌ Verification failed\n";
    exit(1);
}
echo "\n";

// Test 5: Check backup_schedules table
echo "5. Checking backup schedule settings...\n";
$schedule = DB::table('backup_schedules')->first();
if ($schedule) {
    echo "   Frequency: {$schedule->frequency}\n";
    echo "   Time: " . ($schedule->time ?? 'Not set') . "\n";
} else {
    echo "   No schedule configured (default: off)\n";
}
echo "\n";

echo "=== Activation Complete ===\n";
echo "\n";
echo "Summary:\n";
echo "  • Default backup path: Z:\\backups\n";
echo "  • Database setting: ✅ Updated\n";
echo "  • Folder permissions: ✅ Writable\n";
echo "\n";
echo "Next Steps:\n";
echo "  1. Test backup creation: Open browser → Backup & Restore page\n";
echo "  2. Click 'Create Backup Now'\n";
echo "  3. Check Z:\\backups\\ for ZIP file\n";
echo "\n";
