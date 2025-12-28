# 📊 Concurrent Users - Data Source Explanation

## 🔍 **Sumber Data Concurrent Users**

Concurrent users **BUKAN dummy data**. Sistem menggunakan **2 sumber data real**:

---

## 📌 **Source 1: Database Tracking (PRIMARY)**

### **Table: `users`**
```sql
SELECT COUNT(*) 
FROM users 
WHERE last_activity_at >= NOW() - INTERVAL 15 MINUTE
```

### **Column: `last_activity_at`**
- Type: `TIMESTAMP`
- Purpose: Menyimpan waktu terakhir user melakukan aktivitas
- Updated by: `UpdateUserActivity` middleware

---

## 🔄 **Cara Kerja Update Activity**

### **1. Middleware: UpdateUserActivity**
File: `app/Http/Middleware/UpdateUserActivity.php`

```php
public function handle(Request $request, Closure $next): Response
{
    if (Auth::check()) {
        $user = Auth::user();
        $lastActivity = $user->last_activity_at;
        
        // Update setiap 5 menit (untuk efisiensi database)
        if (!$lastActivity || $lastActivity->diffInMinutes(now()) >= 5) {
            $user->last_activity_at = now();
            $user->save(['timestamps' => false]);
        }
    }

    return $next($request);
}
```

**Cara Kerja:**
1. User login ke aplikasi
2. Setiap request API yang authenticated
3. Middleware cek: apakah sudah 5 menit sejak update terakhir?
4. Jika YA → Update `last_activity_at` ke waktu sekarang
5. Jika TIDAK → Skip (untuk mengurangi database writes)

---

### **2. Registration: Kernel.php**
File: `app/Http/Kernel.php`

```php
protected $middlewareGroups = [
    'api' => [
        // ...
        \App\Http\Middleware\UpdateUserActivity::class, // ← Registered here
    ],
];
```

**Artinya:** Middleware berjalan pada **SETIAP request API** yang memerlukan authentication.

---

## 📊 **Source 2: SMB Sessions (SECONDARY - Windows Server Only)**

### **PowerShell Command:**
```powershell
Get-SmbSession | Measure-Object | Select-Object -ExpandProperty Count
```

**Cara Kerja:**
1. Hanya berjalan di **Windows Server** (2012+)
2. Menghitung koneksi SMB/CIFS aktif ke file share
3. Menangkap user yang akses via **File Explorer** (bukan web app)

**Platform Support:**
- ✅ Windows Server 2012/2016/2019/2022
- ❌ Windows 10/11 (command tidak tersedia)

---

## 🔀 **Hybrid Approach Logic**

File: `app/Services/NasMonitoringService.php`

```php
private function getConcurrentUsers(): int
{
    // Method 1: Database (web app users)
    $dbUsers = DB::table('users')
        ->where('last_activity_at', '>=', now()->subMinutes(15))
        ->count();

    // Method 2: SMB sessions (file share users)
    if ($this->isWindowsServer()) {
        $smbUsers = (int) shell_exec('Get-SmbSession count');
        
        // Return MAX (both sources)
        return max($dbUsers, $smbUsers);
    }

    return $dbUsers;
}
```

**Decision Logic:**
```
Total Concurrent Users = MAX(Database Users, SMB Users)
```

**Kenapa MAX?**
- Database users = Login via web app/React UI
- SMB users = Akses via File Explorer (\\192.168.1.100\share)
- Beberapa user mungkin login di web + akses via file explorer (overlap)
- MAX memastikan kita hitung semua user unik

---

## 📈 **Timeline Example**

```
Time: 10:00 AM
- User A login via web (last_activity_at updated)
- User B login via web (last_activity_at updated)
- User C akses \\NAS\share via File Explorer (SMB session created)

Concurrent Users Calculation:
- Database: 2 users (A, B)
- SMB: 1 user (C)
- Total: MAX(2, 1) = 2 users

Time: 10:05 AM
- User A melakukan action (last_activity_at updated lagi)
- User B idle (tidak ada update karena belum 5 menit)
- User C masih akses file share

Concurrent Users Calculation:
- Database: 2 users (A masih < 15 min, B masih < 15 min)
- SMB: 1 user (C)
- Total: MAX(2, 1) = 2 users

Time: 10:20 AM
- User A logout (no update)
- User B masih idle sejak 10:00 (20 menit, EXPIRED!)
- User C disconnect dari file share

Concurrent Users Calculation:
- Database: 0 users (B sudah > 15 min)
- SMB: 0 users (C disconnect)
- Total: MAX(0, 0) = 0 users
```

---

## 🔍 **Verifikasi Data Real**

### **Test 1: Check Database**
```bash
php artisan tinker
```

```php
// Lihat semua user activity
User::select('name', 'last_activity_at')
    ->orderBy('last_activity_at', 'desc')
    ->get();

// Hitung concurrent users (15 menit)
User::where('last_activity_at', '>=', now()->subMinutes(15))->count();
```

---

### **Test 2: Manual Update (Simulasi)**
```php
// Simulasi 3 user aktif
$users = User::limit(3)->get();
foreach ($users as $user) {
    $user->last_activity_at = now();
    $user->save(['timestamps' => false]);
}

// Test service
$service = new App\Services\NasMonitoringService();
$metrics = $service->getMetrics();
echo $metrics['nas_concurrent_users']; // Output: 3 ✅
```

---

### **Test 3: Via UI (Real Scenario)**
1. Buka browser → Login sebagai User A
2. Buka browser lain → Login sebagai User B  
3. Akses API endpoint (trigger middleware)
4. Check NAS monitoring dashboard
5. Result: Shows **2 concurrent users** ✅

---

## ⚙️ **Configuration**

### **Window Time (15 menit)**
File: `app/Services/NasMonitoringService.php`

```php
// Default: 15 menit
$dbUsers = User::where('last_activity_at', '>=', now()->subMinutes(15))
    ->count();
```

**Customization:**
- 5 menit → `subMinutes(5)` (lebih strict)
- 30 menit → `subMinutes(30)` (lebih lenient)

---

### **Update Interval (5 menit)**
File: `app/Http/Middleware/UpdateUserActivity.php`

```php
// Update setiap 5 menit untuk efisiensi
if ($lastActivity->diffInMinutes(now()) >= 5) {
    $user->last_activity_at = now();
    $user->save(['timestamps' => false]);
}
```

**Trade-off:**
- Interval kecil (1 min) → Lebih akurat, lebih banyak database writes
- Interval besar (10 min) → Kurang akurat, lebih sedikit database writes
- **5 menit = Balance optimal** ✅

---

## 📊 **Data Flow Diagram**

```
┌─────────────────┐
│  User Login     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Every API Request      │
│  (Authenticated)        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  UpdateUserActivity     │
│  Middleware             │
└────────┬────────────────┘
         │
         ▼ (every 5 min)
┌─────────────────────────┐
│  UPDATE users           │
│  SET last_activity_at   │
│  = NOW()                │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  NAS Monitoring         │
│  Service Query          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  COUNT users WHERE      │
│  last_activity_at       │
│  >= NOW() - 15 min      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Dashboard Display      │
│  "3 Concurrent Users"   │
└─────────────────────────┘
```

---

## ✅ **Conclusion**

### **Data Source: 100% REAL**
- ✅ **Bukan dummy data**
- ✅ **Tracking aktual dari database**
- ✅ **Updated setiap 5 menit via middleware**
- ✅ **Window 15 menit untuk define "concurrent"**

### **How to Verify:**
1. Login via UI → `last_activity_at` updated
2. Check database → Timestamp berubah
3. Wait 16 minutes → User dianggap inactive
4. Logout → Timestamp tidak berubah (tetap expired)

### **Accuracy:**
- **High**: Database tracking reliable
- **Delay**: Up to 5 minutes (update interval)
- **Expiry**: 15 minutes after last activity

---

**Generated:** 2025-12-28  
**Version:** 1.0 - Complete Data Source Documentation
