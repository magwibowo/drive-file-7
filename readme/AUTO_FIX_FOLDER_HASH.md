# Auto-Fix Folder Hash Documentation

## 📌 Overview

Command untuk **otomatis memperbaiki folder yang tidak punya hash** (folder_hash = NULL atau kosong).

Masalah ini terjadi ketika:
- Folder dibuat saat server masih pakai kode lama (sebelum hash diimplementasi)
- Server PHP belum di-restart setelah kode diupdate
- Opcache menyimpan kode lama

## 🚀 Usage

### Manual Execution

```bash
# Dry-run mode (preview saja, tidak apply perubahan)
php artisan folders:auto-fix-hash --dry-run

# Apply changes
php artisan folders:auto-fix-hash
```

### Scheduled Execution

✅ Command ini **sudah dijadwalkan otomatis** di `app/Console/Kernel.php`:

```php
// Auto-fix folders without hash: Run every day at 4 AM
$schedule->command('folders:auto-fix-hash')
    ->dailyAt('04:00')
    ->name('Auto Fix Folder Hash');
```

**Schedule:**
- **Trash Cleanup**: 03:00 (hapus file > 30 hari)
- **Auto-Fix Hash**: 04:00 (fix folder tanpa hash)
- **Backup**: Dynamic (sesuai setting)

## 🔧 What It Does

1. **Scan Database**: Cari folder dengan `folder_hash` = NULL atau kosong
2. **Generate Hash**: Buat random hash 40 karakter (seperti file uploads)
3. **Rename Filesystem**: 
   - Old: `uploads/keuangan/nama-folder/`
   - New: `uploads/keuangan/5tJviIeRZuz9xLOKSF0ACLm1HV4dLBRAHR2CQVFA/`
4. **Update File Paths**: Update `path_penyimpanan` di semua files dalam folder tersebut
5. **Save Hash**: Simpan hash ke database

## 📊 Example Output

### Dry-Run Mode

```
🔍 Scanning for folders without hash...

Found 2 folders without hash:

  - SAS (ID: 7, Division: Pemasaran)
  - test-folder (ID: 9, Division: Keuangan)

🔍 DRY RUN MODE - No changes will be made

📁 SAS (ID: 7)
   Would rename: uploads/pemasaran/sas
   To: uploads/pemasaran/(random 40 chars)
   Would update: 3 file paths

📁 test-folder (ID: 9)
   Would rename: uploads/keuangan/test-folder
   To: uploads/keuangan/(random 40 chars)

💡 Run without --dry-run to apply changes
```

### Apply Changes

```
🔍 Scanning for folders without hash...

Found 2 folders without hash:

  - SAS (ID: 7, Division: Pemasaran)
  - test-folder (ID: 9, Division: Keuangan)

Do you want to fix these folders? (yes/no) [yes]: yes

🔧 Fixing folders...

📁 Processing: SAS
   Old path: uploads/pemasaran/sas
   New path: uploads/pemasaran/5tJviIeRZuz9xLOKSF0ACLm1HV4dLBRAHR2CQVFA
   ✅ Folder renamed in filesystem
   ✅ Updated 3 file paths
   ✅ Hash saved to database: 5tJviIeRZuz9xLOKSF0ACLm1HV4dLBRAHR2CQVFA

📁 Processing: test-folder
   Old path: uploads/keuangan/test-folder
   New path: uploads/keuangan/EPKdEQ5CYZtq9ZY172O1lKnvZTXtSX5Z59vlzNwM
   ✅ Folder renamed in filesystem
   ✅ Hash saved to database: EPKdEQ5CYZtq9ZY172O1lKnvZTXtSX5Z59vlzNwM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Successfully fixed: 2 folders
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## ⚠️ Important Notes

1. **Backup First**: Disarankan backup database & filesystem sebelum run manual
2. **Server Restart**: Setelah update kode, WAJIB restart PHP server agar kode baru dimuat
3. **Windows Task Scheduler**: Pastikan Laravel scheduler running setiap menit
4. **File Paths**: Command otomatis update file paths di database
5. **Transaction Safe**: Menggunakan DB transaction, rollback jika ada error

## 🛡️ Safety Features

- ✅ **Dry-run mode** untuk preview
- ✅ **Confirmation prompt** sebelum apply
- ✅ **Database transactions** (rollback on error)
- ✅ **Error handling** per folder
- ✅ **Detailed logging** (Laravel log)
- ✅ **Summary report** di akhir

## 🔍 Troubleshooting

### Folder masih pakai nama asli setelah dibuat via UI

**Penyebab**: PHP server belum restart, masih pakai kode lama

**Solusi**:
1. Restart Laragon (Stop All → Start All)
2. Atau restart `php artisan serve` (Ctrl+C → run lagi)
3. Run `php artisan optimize:clear`
4. Run `php artisan folders:auto-fix-hash` untuk fix folder yang sudah dibuat

### Command tidak jalan otomatis

**Penyebab**: Windows Task Scheduler tidak running

**Solusi**:
1. Buka Task Scheduler
2. Cari task "Laravel Scheduler - File Management"
3. Pastikan status = "Ready"
4. Test manual: `php artisan schedule:run`

### Hash tidak di-generate saat create folder

**Penyebab**: Kode di FolderController belum dimuat

**Solusi**:
1. Cek file `app/Http/Controllers/Api/FolderController.php` line 59-60
2. Pastikan ada:
   ```php
   $folder->folder_hash = Folder::generateFolderHash();
   $folder->save();
   ```
3. Restart server
4. Run `php artisan optimize:clear`

## 📝 Files Modified

1. `app/Console/Commands/AutoFixFolderHash.php` - Command baru
2. `app/Console/Kernel.php` - Scheduled task (04:00 daily)
3. `app/Http/Controllers/Api/FolderController.php` - Auto-generate hash on create
4. `app/Models/Folder.php` - generateFolderHash() method

## 🎯 Related Commands

```bash
# List all scheduled tasks
php artisan schedule:list

# Run scheduler manually (for testing)
php artisan schedule:run

# Test specific command
php artisan schedule:test --name="Auto Fix Folder Hash"

# View logs
tail -f storage/logs/laravel.log
```

## ✅ Verification

Check semua folder sudah pakai hash:

```bash
php artisan tinker
>>> App\Models\Folder::whereNull('folder_hash')->count()
=> 0  // Harusnya 0 (semua sudah punya hash)
```

Check filesystem:

```powershell
# Semua folder harusnya 40 karakter
Get-ChildItem "Z:\uploads\uploads\keuangan\" -Directory | 
  Select-Object Name, @{N='Length';E={$_.Name.Length}}
```

---

**Last Updated**: 28 December 2025  
**Status**: ✅ Production Ready  
**Auto-Run**: Every day at 04:00 AM
