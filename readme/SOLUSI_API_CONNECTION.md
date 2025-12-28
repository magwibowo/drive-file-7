# Solusi Masalah Koneksi API Server Monitoring

## Masalah yang Ditemukan

API tidak tersambung karena **2 masalah utama**:

### 1. ❌ Path API Salah
**Sebelum:**
```javascript
`${API_BASE_URL}/server-metrics/latest`
```

**Sesudah:**
```javascript
`${API_BASE_URL}/admin/server-metrics/latest`
```

Routes berada di dalam grup `admin` middleware:
```
GET|HEAD   api/admin/server-metrics/history
GET|HEAD   api/admin/server-metrics/latest  
POST       api/admin/server-metrics/poll
POST       api/admin/server-metrics/start
POST       api/admin/server-metrics/stop
```

### 2. ❌ Nama Token di localStorage Salah
**Sebelum:**
```javascript
localStorage.getItem("token")
```

**Sesudah:**
```javascript
localStorage.getItem("authToken")
```

Aplikasi menyimpan token dengan nama `authToken` (lihat di `AuthContext.js`), tapi komponen monitoring menggunakan `token`.

## File yang Sudah Diperbaiki

✅ **ServerMonitor.js**
- Path API: `/server-metrics/*` → `/admin/server-metrics/*`
- Token key: `"token"` → `"authToken"`
- Lokasi: 3 tempat (handleStartMonitoring, handleStopMonitoring, pollMetrics)

✅ **useServerMetrics.js**
- Path API: `/server-metrics/latest` → `/admin/server-metrics/latest`
- Token key: `'token'` → `'authToken'`

✅ **useLatestServerMetrics.js**
- Path API: `/server-metrics/latest` → `/admin/server-metrics/latest`
- Token key: `'token'` → `'authToken'`

## Cara Testing

### 1. Test Route (Backend)
```powershell
# Cek apakah route terdaftar
php artisan route:list --path=admin/server-metrics

# Test endpoint (harus return {"message":"Unauthenticated."})
curl -X GET http://localhost:8000/api/admin/server-metrics/latest -H "Accept: application/json"
```

### 2. Test di Browser (Frontend)
1. Login sebagai Super Admin
2. Buka halaman **Pengaturan → Tab Monitor**
3. Klik tombol **"Start Monitoring"**
4. Buka **DevTools Console (F12)**
5. Cek Network tab untuk request ke `/api/admin/server-metrics/start`
6. Seharusnya return **status 200** dengan data snapshot

### 3. Cek Token di Browser
```javascript
// Jalankan di Console Browser
localStorage.getItem('authToken')
// Harus menampilkan Bearer token
```

## Struktur Request yang Benar

### Start Monitoring
```http
POST /api/admin/server-metrics/start
Authorization: Bearer {authToken}
```

### Poll Metrics
```http
POST /api/admin/server-metrics/poll
Authorization: Bearer {authToken}
Content-Type: application/json

{
  "previous_snapshot": {
    "network_bytes_received": 123456,
    "network_bytes_sent": 654321,
    ...
  }
}
```

### Get Latest
```http
GET /api/admin/server-metrics/latest
Authorization: Bearer {authToken}
```

## Middleware & Auth Flow

```
Request → auth:sanctum → check.role:super_admin → Controller
```

Pastikan:
1. ✅ User sudah login
2. ✅ Token disimpan di localStorage dengan key `authToken`
3. ✅ User memiliki role `super_admin`
4. ✅ CORS sudah dikonfigurasi untuk port React (default: 3000)

## Konfigurasi CORS (Sudah OK)

File: `config/cors.php`
```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => ['http://localhost:3000'],
'supports_credentials' => true,
```

## Troubleshooting

### Jika masih error 401 (Unauthenticated)
```javascript
// Cek di Browser Console
console.log('Token:', localStorage.getItem('authToken'));
// Jika null, login ulang
```

### Jika masih error 403 (Forbidden)
```sql
-- Cek role user di database
SELECT name, email, role_id FROM users WHERE id = YOUR_USER_ID;
-- role_id = 1 untuk super_admin
```

### Jika error 500 (Server Error)
```powershell
# Cek Laravel logs
Get-Content storage/logs/laravel.log -Tail 50
```

### Jika error CORS
- Pastikan React berjalan di port 3000
- Atau tambahkan port di `config/cors.php`:
```php
'allowed_origins' => [
    'http://localhost:3000',
    'http://localhost:3001', // jika beda port
],
```

## Kesimpulan

Sekarang API sudah tersambung dengan benar karena:
1. ✅ Path API sudah benar: `/api/admin/server-metrics/*`
2. ✅ Token key sudah sesuai: `authToken`
3. ✅ Middleware & routes sudah terkonfigurasi
4. ✅ CORS sudah setup untuk localhost:3000

**Silakan test ulang di browser!** 🚀
