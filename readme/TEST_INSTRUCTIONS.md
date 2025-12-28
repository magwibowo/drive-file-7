# 🔍 Instruksi Test Backup Button

## Langkah-langkah untuk user:

### 1. Buka Debug Page
Saya sudah membuka debug page di browser VS Code. Atau buka manual di:
```
http://localhost:8000/debug-backup.html
```

### 2. Test Login
- Credentials sudah terisi otomatis:
  - Login: `admin@contoh.com`
  - Password: `password`
- Click tombol **"Login"**
- Lihat hasil di kotak "Login result"
- Harus muncul: ✅ Login successful!

### 3. Test Create Backup
- Click tombol **"POST /api/backups/run (Create Backup)"**
- Tunggu 10-30 detik
- Lihat hasil:
  - ✅ = Berhasil
  - ❌ = Gagal (copy error message)

### 4. Jika Gagal
Screenshot atau copy paste:
1. Isi kotak "API Result" (error message)
2. Buka Browser DevTools (F12) → Console tab
3. Screenshot/copy semua error merah

### 5. Test di UI Asli
Jika debug page berhasil tapi UI asli tidak:
1. Login ke aplikasi: http://localhost:3000
2. Buka DevTools (F12) → Console tab
3. Navigate: Pengaturan → Tab "Backup Data"
4. Click "➕ Buat Backup Manual"
5. Lihat console, apakah ada error?
6. Lihat Network tab, apakah ada request ke `/api/backups/run`?
7. Screenshot/copy error

---

## Kemungkinan Masalah

### Jika Debug Page Berhasil:
✅ Backend OK
✅ API OK  
✅ Auth OK
❌ Problem di React frontend

### Jika Debug Page Gagal:
❌ Problem di backend/auth/CORS

---

Silakan test dan beri tahu hasil yang muncul!
