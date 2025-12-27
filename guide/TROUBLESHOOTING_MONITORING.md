# 🔍 Troubleshooting: Data Tidak Muncul Tiap 2 Detik

## ✅ Status Backend: FULLY WORKING

**Test Results:**
```
✅ START endpoint: Working
✅ POLL endpoint: Working (saving to DB every 2 seconds)
✅ LATEST endpoint: Working
✅ Database: Receiving data correctly
✅ WindowsMetricsService: WMI queries successful
✅ Delta calculations: Mathematically correct
```

**Sample Data from Latest Test:**
```json
{
    "rx": 26382,              // 25.76 KB/s
    "tx": 13706,              // 13.38 KB/s
    "reads": 9,               // 9 IOPS
    "writes": 141.5,          // 141.5 IOPS
    "free_space": 161143889920, // ~150 GB
    "latency": 31             // 31ms
}
```

---

## 🔴 Problem: Frontend Not Showing Live Data

Karena backend sudah **100% working**, masalahnya ada di **frontend**. Kemungkinan penyebab:

### 1. ❌ User Belum Klik "Start Monitoring"

**Gejala:**
- Tombol "Start Monitoring" masih terlihat
- Tidak ada status "Monitoring Active"
- Metrics menampilkan 0.00 semua

**Solusi:**
1. Buka halaman **Pengaturan → Tab Server Monitor**
2. Klik tombol **"Start Monitoring"**
3. Status harus berubah menjadi **"Monitoring Active"** dengan dot hijau beranimasi
4. Tunggu 2 detik, data akan mulai muncul

---

### 2. ❌ Authentication Token Tidak Valid

**Gejala:**
- Console browser menampilkan error 401 Unauthorized
- Network tab menunjukkan request gagal dengan status 401

**Cara Check:**
1. Tekan **F12** untuk buka DevTools
2. Buka tab **Console**
3. Ketik: `localStorage.getItem('authToken')`
4. Jika return `null`, berarti tidak login

**Solusi:**
```javascript
// Logout dan login ulang
localStorage.clear();
// Kemudian login lagi sebagai Super Admin
```

---

### 3. ❌ CORS Error

**Gejala:**
- Console menampilkan:
  ```
  Access to XMLHttpRequest at 'http://localhost:8000/api/admin/server-metrics/start' 
  from origin 'http://localhost:3000' has been blocked by CORS policy
  ```

**Solusi:**
Pastikan file `config/cors.php` di Laravel berisi:
```php
'allowed_origins' => ['http://localhost:3000'],
'supports_credentials' => true,
```

**Test CORS:**
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS \
     http://localhost:8000/api/admin/server-metrics/start
```

---

### 4. ❌ Network Request Failing

**Gejala:**
- Console menampilkan error 404 atau 500
- Data tidak muncul setelah klik Start

**Cara Check:**
1. Buka **DevTools (F12)** → Tab **Network**
2. Filter: **XHR**
3. Klik **"Start Monitoring"**
4. Lihat request ke:
   - `/api/admin/server-metrics/start` (harus 200 OK)
   - `/api/admin/server-metrics/poll` (harus 200 OK, repeat every 2s)

**Expected Network Activity:**
```
[POST] /api/admin/server-metrics/start → 200 OK
Wait 2s...
[POST] /api/admin/server-metrics/poll → 200 OK
Wait 2s...
[POST] /api/admin/server-metrics/poll → 200 OK
... (repeat every 2 seconds)
```

---

### 5. ❌ React Component Not Polling

**Gejala:**
- START request berhasil (200 OK)
- Tapi tidak ada POLL request di Network tab
- Metrics tetap 0.00

**Possible Causes:**
1. JavaScript error di component
2. `setInterval` tidak berjalan
3. `previousSnapshot` null

**Debug Steps:**

**A. Check Console Errors**
```
F12 → Console tab → Look for red errors
```

**B. Add Console Logs (Temporary Debug)**

Edit `ServerMonitor.js` line ~145:
```javascript
const startPolling = () => {
  console.log('🚀 Starting polling...'); // Add this
  if (pollingInterval.current) return;
  pollingInterval.current = setInterval(() => {
    console.log('⏱️ Polling tick...'); // Add this
    pollMetrics();
  }, 2000);
};
```

Refresh browser dan check console untuk log messages.

---

### 6. ❌ Component Not Mounted

**Gejala:**
- Tab "Server Monitor" tidak menampilkan komponen
- Halaman kosong atau loading forever

**Check:**
1. Apakah `SuperAdminPengaturanPage.js` di-import dengan benar?
2. Apakah routing ke halaman Pengaturan benar?

**Verify Component Loaded:**
```javascript
// Di browser console
window.location.pathname // harus '/pengaturan' atau similar
```

---

## 🧪 Manual Testing Steps

### Step 1: Verify Backend
```bash
cd c:\laragon\www\drive-file-7\sistem-manajeman-file
php test-monitoring-flow.php
```

**Expected:** All ✅ checks pass

### Step 2: Clear Browser Cache & Storage
```javascript
// Di browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Step 3: Login Fresh
1. Login dengan akun Super Admin
2. Verify token: `localStorage.getItem('authToken')`
3. Should return long string (Bearer token)

### Step 4: Start Monitoring with DevTools Open
1. F12 → Console tab
2. F12 → Network tab
3. Filter: XHR
4. Buka Pengaturan → Server Monitor
5. Klik "Start Monitoring"
6. Watch for:
   - ✅ No red errors in Console
   - ✅ POST /start returns 200
   - ✅ POST /poll repeats every 2s
   - ✅ Metrics cards update

### Step 5: Check Database
```bash
cd c:\laragon\www\drive-file-7\sistem-manajeman-file
php artisan tinker --execute="echo App\Models\ServerMetric::count();"
```

**Expected:** Number increasing every 2 seconds

---

## 🎯 Quick Diagnostic Checklist

Run these in browser console:

```javascript
// 1. Check if logged in
console.log('Token:', localStorage.getItem('authToken'));

// 2. Check API base URL
console.log('API URL:', process.env.REACT_APP_API_URL || 'http://localhost:8000/api');

// 3. Test API endpoint directly
fetch('http://localhost:8000/api/admin/server-metrics/latest', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    'Accept': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('API Response:', d))
.catch(e => console.error('API Error:', e));
```

---

## 📊 Expected Behavior

**When Working Correctly:**

1. **Before Start:**
   - Button: "Start Monitoring" visible
   - All metrics show: 0.00
   - No network activity

2. **After Click Start:**
   - Button changes to: "Stop Monitoring"
   - Status indicator: "Monitoring Active" dengan dot hijau
   - POST /start → 200 OK (1x)
   - POST /poll → 200 OK (every 2s)

3. **Metrics Update:**
   - Network RX: Updates every 2s (e.g., 25.76 KB/s)
   - Network TX: Updates every 2s (e.g., 13.38 KB/s)
   - Disk Reads: Updates every 2s (e.g., 9.00 IOPS)
   - Disk Writes: Updates every 2s (e.g., 141.50 IOPS)
   - Disk Free: Updates every 2s (e.g., 150.08 GB)
   - Latency: Updates every 2s (e.g., 31 ms)

4. **Database:**
   - New record inserted every 2 seconds
   - Can verify with: `SELECT COUNT(*) FROM server_metrics`

---

## 🚨 Common Mistakes

### ❌ Mistake #1: Using Wrong Component
```javascript
// WRONG - This only reads existing data
import ServerMonitorDashboard from '...';
<ServerMonitorDashboard />

// CORRECT - This has start/stop/poll logic
import ServerMonitor from '...';
<ServerMonitor />
```

### ❌ Mistake #2: Wrong API Path
```javascript
// WRONG
/api/server-metrics/start

// CORRECT
/api/admin/server-metrics/start
```

### ❌ Mistake #3: Wrong Token Key
```javascript
// WRONG
localStorage.getItem('token')

// CORRECT
localStorage.getItem('authToken')
```

---

## ✅ Verification Commands

Run these to verify everything is working:

```powershell
# 1. Backend server running
netstat -ano | Select-String ":8000"
# Should show: TCP 127.0.0.1:8000 LISTENING

# 2. Frontend server running
netstat -ano | Select-String ":3000"
# Should show: TCP 0.0.0.0:3000 LISTENING

# 3. Database has data
cd c:\laragon\www\drive-file-7\sistem-manajeman-file
php artisan tinker --execute="echo App\Models\ServerMetric::count();"
# Should show number > 0

# 4. Routes registered
php artisan route:list --path=admin/server-metrics
# Should show 5 routes

# 5. Test backend flow
php test-monitoring-flow.php
# All ✅ should pass
```

---

## 💡 Next Steps

1. **Open browser DevTools (F12)**
2. **Go to Console tab** - Look for JavaScript errors
3. **Go to Network tab** - Watch for API calls
4. **Login as Super Admin**
5. **Navigate to Pengaturan → Server Monitor**
6. **Click "Start Monitoring"**
7. **Watch console and network activity**

**If still not working, take screenshot of:**
- Console errors (if any)
- Network tab showing failed requests (if any)
- Metrics display showing 0.00

---

## 📞 Support Info

**Backend Status:** ✅ Fully Working  
**Issue Location:** Frontend Integration  
**Most Likely Cause:** User tidak klik "Start Monitoring" atau token expired

**Test Script Location:**  
`c:\laragon\www\drive-file-7\sistem-manajeman-file\test-monitoring-flow.php`
