# NAS Upload Storage - Implementasi

## Perubahan yang Dilakukan

### 1. File Modified: `app/Http/Controllers/Api/FileController.php`

Semua operasi file SEKARANG menggunakan **NAS Storage** (`nas_uploads` disk) yang terletak di `Z:\uploads`:

#### Methods yang Diupdate:

**a) `store()` - Upload File**
```php
// SEBELUM:
$path = $uploadedFile->store($uploadPath);

// SESUDAH:
$path = $uploadedFile->store($uploadPath, 'nas_uploads');
```
- File upload sekarang disimpan di **Z:\uploads** instead of `storage/app/uploads`

**b) `download()` - Download File**
```php
// SEBELUM:
Storage::exists($file->path_penyimpanan)
Storage::download($file->path_penyimpanan, $file->nama_file_asli)

// SESUDAH:
Storage::disk('nas_uploads')->exists($file->path_penyimpanan)
Storage::disk('nas_uploads')->download($file->path_penyimpanan, $file->nama_file_asli)
```

**c) `forceDelete()` - Hapus Permanen**
```php
// SEBELUM:
Storage::delete($file->path_penyimpanan);

// SESUDAH:
Storage::disk('nas_uploads')->delete($file->path_penyimpanan);
```

**d) `restore()` - Restore dari Trash**
```php
// SEBELUM:
Storage::delete($existingActiveFile->path_penyimpanan);

// SESUDAH:
Storage::disk('nas_uploads')->delete($existingActiveFile->path_penyimpanan);
```

---

## Struktur Penyimpanan

### SEBELUM (Local Storage):
```
C:\laragon\www\drive-file-7\sistem-manajeman-file\storage\app\
└── uploads\
    ├── division-name-1\
    ├── division-name-2\
    └── ...
```

### SESUDAH (NAS Storage):
```
Z:\uploads\
├── uploads\
│   ├── division-name-1\
│   ├── division-name-2\
│   └── ...
└── ...
```

**Catatan**: Path `uploads/division-name/...` masih dipertahankan dalam database, tetapi root-nya sekarang di `Z:\uploads` bukan `storage/app`.

---

## Konfigurasi (sudah ada di `config/filesystems.php`)

```php
'nas_uploads' => [
    'driver' => 'local',
    'root' => env('NAS_DRIVE_PATH', 'Z:\\').'uploads',
    'url' => env('APP_URL').'/nas/uploads',
    'visibility' => 'public',
    'throw' => false,
],
```

---

## Testing

### Test Script: `test-nas-upload.php`

```bash
php test-nas-upload.php
```

**Hasil Test:**
- ✅ Configuration OK
- ✅ Directory writable
- ✅ File write successful
- ✅ File read successful
- ✅ File delete successful

---

## Migrasi Data Existing

Jika ada file yang sudah ada di `storage/app/uploads`, perlu dipindahkan ke `Z:\uploads`:

```powershell
# Copy semua file dari local storage ke NAS
Copy-Item -Path "C:\laragon\www\drive-file-7\sistem-manajeman-file\storage\app\uploads\*" `
          -Destination "Z:\uploads\" `
          -Recurse -Force
```

**ATAU** update field `path_penyimpanan` di database untuk existing files.

---

## Keuntungan NAS Storage

1. ✅ **Centralized Storage** - Semua divisi akses storage yang sama
2. ✅ **Scalability** - Storage tidak terbatas pada local disk server
3. ✅ **Backup** - File di NAS bisa di-backup secara terpisah
4. ✅ **Performance Monitoring** - Metrics NAS Monitor langsung track penggunaan real
5. ✅ **Accessibility** - File bisa diakses dari multiple server (jika clustering)

---

## Catatan Penting

⚠️ **File Permissions**: Pastikan web server (Laragon) punya akses write ke `Z:\uploads`

⚠️ **Database**: Field `path_penyimpanan` di table `files` tetap relative path (`uploads/division-name/file.ext`)

⚠️ **Existing Files**: File lama di `storage/app/uploads` perlu dimigrasi manual jika ada

---

**Status**: ✅ AKTIF (27 Desember 2025)
**Tested**: ✅ Write, Read, Delete operations working
