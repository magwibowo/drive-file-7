# Windows Server Monitor - Laravel Livewire

Sistem monitoring real-time untuk Windows Server menggunakan WMI (Windows Management Instrumentation).

## 📁 Struktur File

### Backend (Laravel)
- **Migration**: `database/migrations/2025_12_14_000001_create_server_metrics_table.php`
- **Model**: `app/Models/ServerMetric.php`
- **Service**: `app/Services/WindowsMetricsService.php`
- **Livewire Component**: `app/Livewire/ServerMonitor.php`
- **View**: `resources/views/livewire/server-monitor.blade.php`
- **API Controller**: `app/Http/Controllers/Api/ServerMetricsController.php`
- **Routes**: `routes/api.php` (API) dan `routes/web.php` (Livewire)

### Frontend (React)
- **Component**: `src/components/ServerMonitor/ServerMonitor.js`
- **Styling**: `src/components/ServerMonitor/ServerMonitor.css`
- **Integration**: `src/pages/SuperAdminPengaturanPage.js`

## 🚀 Setup & Instalasi

### 1. Jalankan Migration
```bash
cd sistem-manajeman-file
php artisan migrate
```

### 2. Install Livewire (jika belum)
```bash
composer require livewire/livewire
```

### 3. Verifikasi Route
Routes sudah terdaftar di:
- API: `POST /api/server-metrics/start`, `POST /api/server-metrics/poll`, dll
- Web (Livewire): Uncomment di `routes/web.php` untuk standalone view

## 📊 Fitur Utama

### Livewire Component (Backend Rendering)
✅ **Conditional Polling**: `wire:poll.2s` hanya aktif saat `$isMonitoring == true`
✅ **No Background Process**: WMI query TIDAK berjalan saat monitoring di-stop
✅ **Delta Calculation**: Otomatis menghitung perubahan data per 2 detik
✅ **Auto Save**: Setiap polling otomatis menyimpan ke database

**Metrics yang ditampilkan:**
- Network RX (Bytes/sec) → KB/s
- Network TX (Bytes/sec) → KB/s
- Disk Reads (IOPS)
- Disk Writes (IOPS)
- Free Disk Space (GB)
- Network Latency (ms)

### React Component (Frontend SPA)
✅ **Polling setiap 2 detik** via `setInterval`
✅ **Delta calculation** di frontend
✅ **Auto cleanup** on component unmount
✅ **Responsive design** dengan Tailwind-inspired CSS

## 🎯 Cara Menggunakan

### Livewire Version (Blade)
1. Akses halaman: `http://localhost:8000/server-monitor` (jika route diaktifkan)
2. Atau embed dalam blade view lain:
   ```blade
   @livewire('server-monitor')
   ```

### React Version (SPA)
1. Login sebagai Super Admin
2. Buka: **Pengaturan** → Tab **"Server Monitor"**
3. Klik **"Start Monitoring"**
4. Data akan diupdate otomatis setiap 2 detik
5. Klik **"Stop Monitoring"** untuk menghentikan

## 🔧 Logika Monitoring

### Start Monitoring
```
1. Ambil snapshot awal (baseline)
2. Set previousSnapshot = baseline
3. currentMetrics = 0 (belum ada delta)
4. Aktifkan polling
```

### Polling (setiap 2 detik)
```
1. Ambil snapshot baru (current)
2. Hitung delta = (current - previous) / 2
3. Update UI dengan delta
4. Simpan delta ke database
5. Update previousSnapshot = current
```

### Stop Monitoring
```
1. Hentikan polling (wire:poll tidak dirender)
2. Reset previousSnapshot = null
3. Reset currentMetrics = 0
4. WMI query STOP berjalan
```

## 🗄️ Database Schema

**Tabel**: `server_metrics`

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | bigInteger | Primary key |
| `network_rx_bytes_per_sec` | double | Network RX (bytes/sec) |
| `network_tx_bytes_per_sec` | double | Network TX (bytes/sec) |
| `disk_reads_per_sec` | double | Disk Reads (IOPS) |
| `disk_writes_per_sec` | double | Disk Writes (IOPS) |
| `disk_free_space` | bigInteger | Free space (bytes) |
| `latency_ms` | integer (nullable) | Latency ke 8.8.8.8 |
| `created_at` | timestamp | Waktu recording |
| `updated_at` | timestamp | Waktu update |

**Index**: `created_at` untuk query berdasarkan waktu.

## 🎨 UI/UX

### Tailwind CSS Styling
- **Dashboard Grid Layout**: 3 kolom responsif
- **Metric Cards**: Color-coded (Blue, Green, Purple, Orange, Indigo, Pink)
- **Animated Status**: Pulse indicator saat monitoring aktif
- **Clean Design**: Modern minimalist dengan gradient dan shadow

### Conditional Rendering (Penting!)
```blade
{{-- Polling HANYA aktif jika $isMonitoring == true --}}
@if($isMonitoring)
    <div wire:poll.2s="updateMetrics">
@else
    <div>
@endif
    {{-- Content --}}
</div>
```

## ⚙️ Windows Service (WindowsMetricsService)

**WMI Queries:**
1. `Win32_PerfRawData_Tcpip_NetworkInterface`
   - BytesReceivedPersec
   - BytesSentPersec
   
2. `Win32_PerfRawData_PerfDisk_PhysicalDisk` (Name = '_Total')
   - DiskReadsPersec
   - DiskWritesPersec

3. `disk_free_space('C:')` - PHP native function
4. `exec('ping -n 1 8.8.8.8')` - Network latency

**Safety Check**: Service hanya berjalan di Windows (RuntimeException jika bukan).

## 📝 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/server-metrics/start` | Mulai monitoring, return baseline |
| POST | `/api/server-metrics/poll` | Polling dengan delta calculation |
| POST | `/api/server-metrics/stop` | Stop monitoring |
| GET | `/api/server-metrics/history` | Ambil history data |

**Auth**: Semua endpoint memerlukan Super Admin role.

## 🛡️ Security & Best Practices

✅ **CSRF Protection**: Livewire otomatis handle
✅ **Authorization**: Middleware `check.role:super_admin`
✅ **Error Handling**: Try-catch di semua method critical
✅ **Cleanup**: Auto stop polling on component unmount
✅ **No Dummy Data**: Semua data real dari WMI

## 🐛 Troubleshooting

### Error: "WindowsMetricsService hanya berjalan di Windows"
- Pastikan server berjalan di Windows
- Cek `PHP_OS` value

### WMI Query Gagal
- Pastikan PHP COM extension enabled: `extension=com_dotnet`
- Restart Apache/Nginx setelah enable extension

### Data tidak terupdate
- Cek apakah `$isMonitoring == true`
- Verifikasi polling interval di view
- Check browser console untuk error

## 📚 References

- [Laravel Livewire Docs](https://laravel-livewire.com/docs)
- [WMI Classes](https://learn.microsoft.com/en-us/windows/win32/cimwin32prov/computer-system-hardware-classes)
- [PHP COM Extension](https://www.php.net/manual/en/book.com.php)

---

**Developed with ❤️ for Windows Server Monitoring**
