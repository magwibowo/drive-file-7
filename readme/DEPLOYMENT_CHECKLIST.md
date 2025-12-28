# 📋 DEPLOYMENT CHECKLIST - Sistem Manajemen File ke NAS

Tanggal: 28 Desember 2025  
Platform: Windows Server / NAS  
Stack: Laravel 10 + React 19

---

## 🎯 PRE-DEPLOYMENT CHECKLIST

### 1. Persiapan Infrastruktur
- [ ] NAS sudah terinstall dan accessible via network
- [ ] IP Address NAS sudah fixed (tidak DHCP)
- [ ] Server/PC yang akan menjalankan aplikasi sudah ready
- [ ] Network connection antara server dan NAS stabil
- [ ] Firewall rules sudah dikonfigurasi (port 8000, 3000, 3306)

### 2. Persiapan Software
- [ ] PHP 8.1+ sudah terinstall
- [ ] Composer sudah terinstall
- [ ] Node.js 18+ dan NPM sudah terinstall
- [ ] MySQL/MariaDB sudah terinstall dan running
- [ ] Git sudah terinstall (optional)

### 3. Persiapan Database
- [ ] Database `daop7filemanagement` sudah dibuat
- [ ] User database dengan privilege CREATE, ALTER, INSERT, UPDATE, DELETE
- [ ] Database credentials sudah dicatat
- [ ] Database bisa diakses dari server aplikasi

### 4. Persiapan NAS
- [ ] Share folder sudah dibuat (contoh: `\\192.168.1.100\LaravelStorage`)
- [ ] Folder `uploads` dan `backups` sudah dibuat
- [ ] Write permission untuk aplikasi sudah diberikan
- [ ] Drive Z:\ sudah di-map ke share NAS
- [ ] Command: `net use Z: \\192.168.1.100\LaravelStorage /persistent:yes`

---

## 🚀 DEPLOYMENT STEPS

### STEP 1: Clone/Copy Project
```powershell
# Copy project ke server
cd C:\
xcopy /E /I \\SOURCE\drive-file-7 C:\laragon\www\drive-file-7

# Atau git clone
cd C:\laragon\www
git clone https://github.com/your-repo/drive-file-7.git
```

**Verification:**
- [ ] Folder `sistem-manajeman-file` exists
- [ ] Folder `sistem-manajeman-file_ui` exists
- [ ] File `composer.json` dan `package.json` ada

---

### STEP 2: Jalankan Deployment Script

```powershell
cd C:\laragon\www\drive-file-7\sistem-manajeman-file
.\deploy-to-nas.ps1
```

Script akan menanyakan:
1. **IP Address NAS** (contoh: 192.168.1.100)
2. **IP Address Server** (kosongkan jika sama dengan NAS)
3. **Database Password** (untuk production)
4. **Run Migration?** (y/n)
5. **Build Frontend?** (y/n)
6. **Setup Task Scheduler?** (y/n)

**Verification:**
- [ ] Script berjalan tanpa error
- [ ] File `.env` berhasil diupdate
- [ ] React `.env` berhasil dibuat
- [ ] Composer dependencies terinstall
- [ ] Laravel cache berhasil di-generate

---

### STEP 3: Manual Configuration (Jika Ada)

#### Update .env (jika perlu edit manual)
```bash
APP_ENV=production
APP_DEBUG=false
APP_URL=http://192.168.1.100:8000

DB_HOST=127.0.0.1
DB_DATABASE=daop7filemanagement
DB_USERNAME=daop7_user
DB_PASSWORD=SecurePassword123

NAS_ENABLED=true
NAS_IP=192.168.1.100
NAS_DRIVE_LETTER=Z
NAS_DRIVE_PATH=Z:\
NAS_UPLOADS_PATH=Z:\uploads
NAS_BACKUPS_PATH=Z:\backups

SANCTUM_STATEFUL_DOMAINS=192.168.1.100:3000,192.168.1.100:8000
SESSION_DOMAIN=192.168.1.100
```

**Verification:**
- [ ] Semua variabel sudah diisi dengan benar
- [ ] IP address sesuai dengan environment production
- [ ] Database credentials valid

---

### STEP 4: Database Migration
```powershell
cd C:\laragon\www\drive-file-7\sistem-manajeman-file
php artisan migrate --force
php artisan db:seed --force
```

**Verification:**
- [ ] Migration berhasil tanpa error
- [ ] Table `users`, `folders`, `files`, `nas_metrics`, dll sudah terbuat
- [ ] Initial data (admin user) sudah di-seed

---

### STEP 5: Test NAS Connection
```powershell
# Test ping
ping 192.168.1.100

# Test drive mapping
Test-Path Z:\

# Test write permission
"Test" | Out-File Z:\test.txt
Get-Content Z:\test.txt
Remove-Item Z:\test.txt

# Test dari Laravel
php artisan tinker
> $service = new App\Services\NasMonitoringService();
> $service->isNasAvailable();
> exit
```

**Verification:**
- [ ] Ping ke NAS berhasil (latency < 50ms)
- [ ] Drive Z:\ accessible
- [ ] Write permission berhasil
- [ ] Laravel bisa akses NAS

---

### STEP 6: Build React Frontend
```powershell
cd C:\laragon\www\drive-file-7\sistem-manajeman-file_ui

# Install dependencies
npm install

# Build production
npm run build

# Copy ke Laravel public
xcopy /E /I /Y build ..\sistem-manajeman-file\public\manajemen-file
```

**Verification:**
- [ ] Build selesai tanpa error
- [ ] Folder `build` terbuat
- [ ] File copied ke `public/manajemen-file`
- [ ] File `index.html` ada di public folder

---

### STEP 7: Setup Task Scheduler (Backup Otomatis)

#### Manual Setup:
1. Buka **Task Scheduler** (`taskschd.msc`)
2. Create Task → General:
   - Name: `Laravel Scheduler - File Management`
   - Description: `Run Laravel scheduled tasks (backup, cleanup, etc)`
   - Security options: ✅ Run whether user is logged on or not
   - Configure for: Windows 10/Server 2019

3. Triggers:
   - New → Daily
   - Start: Setiap hari jam 00:00
   - Recur every: 1 days
   - ✅ Enabled

4. Actions:
   - New → Start a program
   - Program/script: `C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe`
   - Add arguments: `artisan schedule:run`
   - Start in: `C:\laragon\www\drive-file-7\sistem-manajeman-file`

5. Conditions:
   - ✅ Start only if the computer is on AC power (uncheck jika server)
   - ✅ Wake the computer to run this task

6. Settings:
   - ✅ Allow task to be run on demand
   - ✅ Run task as soon as possible after a scheduled start is missed
   - If the task fails, restart every: 10 minutes
   - Attempt to restart up to: 3 times

**Verification:**
- [ ] Task created successfully
- [ ] Test run task manually (klik kanan → Run)
- [ ] Check `storage/logs/laravel.log` untuk output

---

### STEP 8: Setup Web Server (Production)

#### Option A: Apache
```apache
# C:\laragon\etc\apache2\sites-enabled\file-management.conf
<VirtualHost *:80>
    ServerName 192.168.1.100
    DocumentRoot "C:/laragon/www/drive-file-7/sistem-manajeman-file/public"
    
    <Directory "C:/laragon/www/drive-file-7/sistem-manajeman-file/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Option B: Nginx
```nginx
# C:\nginx\conf\sites\file-management.conf
server {
    listen 80;
    server_name 192.168.1.100;
    root C:/laragon/www/drive-file-7/sistem-manajeman-file/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

#### Option C: PHP Built-in Server (Development/Testing)
```powershell
# Backend
php artisan serve --host=192.168.1.100 --port=8000

# Frontend (terminal baru)
cd ..\sistem-manajeman-file_ui
npm start
```

**Verification:**
- [ ] Web server running tanpa error
- [ ] Akses http://192.168.1.100 berhasil
- [ ] API endpoint accessible (http://192.168.1.100/api/user)

---

### STEP 9: Security Hardening

```powershell
# Remove sensitive files
Remove-Item .env.example -ErrorAction SilentlyContinue
Remove-Item README.md -ErrorAction SilentlyContinue
Remove-Item .git -Recurse -Force -ErrorAction SilentlyContinue

# Set production permissions
icacls . /remove "Everyone" /T
icacls storage /grant "NETWORK SERVICE:(OI)(CI)F" /T
icacls bootstrap\cache /grant "NETWORK SERVICE:(OI)(CI)F" /T

# Disable directory listing di .htaccess
"Options -Indexes" | Add-Content public\.htaccess
```

**Verification:**
- [ ] Sensitive files removed
- [ ] Permissions restricted
- [ ] Directory listing disabled

---

### STEP 10: Performance Optimization

```powershell
# Laravel optimization
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Composer optimization
composer dump-autoload --optimize --classmap-authoritative

# Enable OPcache (edit php.ini)
# opcache.enable=1
# opcache.memory_consumption=256
# opcache.interned_strings_buffer=16
# opcache.max_accelerated_files=10000
```

**Verification:**
- [ ] All caches generated
- [ ] Autoload optimized
- [ ] OPcache enabled (check `php -i | grep opcache`)

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 1. Application Access
- [ ] **Frontend accessible**: http://192.168.1.100:3000
- [ ] **API accessible**: http://192.168.1.100:8000/api
- [ ] **Login working**: Test dengan admin credentials
- [ ] **Dashboard loading**: All metrics displayed

### 2. File Operations
- [ ] **Upload file**: Test upload file ke folder
- [ ] **Download file**: Test download file
- [ ] **Preview file**: Test preview PDF, images, documents
- [ ] **Delete file**: Test soft delete dan restore
- [ ] **Folder management**: Create, rename, delete folder

### 3. NAS Integration
- [ ] **NAS metrics displaying**: Dashboard shows real data
- [ ] **Latency < 50ms**: Not constant 1ms
- [ ] **IOPS calculation**: Read + Write = Total
- [ ] **Concurrent users working**: Shows active users count
- [ ] **File saved to Z:\**: Check Z:\uploads\[division]

### 4. Backup System
- [ ] **Manual backup**: `php artisan backup:run` berhasil
- [ ] **Backup saved to Z:\backups**: File backup_*.zip ada
- [ ] **Backup via API**: POST /api/backups/run works
- [ ] **Scheduled backup**: Task Scheduler running
- [ ] **Retention policy**: Old backups auto-deleted

### 5. Monitoring & Logging
- [ ] **Server metrics**: CPU, Memory, Disk, Network displayed
- [ ] **Application metrics**: API response time, MySQL IOPS
- [ ] **Error logging**: Check `storage/logs/laravel.log`
- [ ] **No errors in console**: Browser console clean

### 6. Performance
- [ ] **Page load < 3s**: Dashboard loads quickly
- [ ] **API response < 500ms**: All API calls fast
- [ ] **File upload speed**: ~5-10 MB/s (depends on network)
- [ ] **Concurrent users support**: At least 10-20 users

---

## 🐛 TROUBLESHOOTING

### Issue 1: NAS Not Accessible
**Symptoms:** Latency shows null, file operations fail

**Solution:**
```powershell
# Check network
ping 192.168.1.100

# Check drive mapping
net use Z: /delete
net use Z: \\192.168.1.100\LaravelStorage /persistent:yes

# Check NAS service running
Get-Service -ComputerName 192.168.1.100 | Where-Object {$_.Status -eq "Running"}
```

### Issue 2: Concurrent Users Always 0
**Symptoms:** Dashboard shows 0 concurrent users even when logged in

**Solution:**
```powershell
# Check middleware registered
php artisan route:list --middleware=update.user.activity

# Check database column
php artisan tinker
> DB::table('users')->select('name', 'last_activity_at')->get();

# Manual update test
> $user = App\Models\User::first();
> $user->last_activity_at = now();
> $user->save();
```

### Issue 3: 500 Internal Server Error
**Symptoms:** White screen, 500 error

**Solution:**
```powershell
# Check logs
Get-Content storage\logs\laravel.log -Tail 50

# Check permissions
icacls storage
icacls bootstrap\cache

# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear
```

### Issue 4: CORS Error in Frontend
**Symptoms:** API calls blocked by browser

**Solution:**
```php
// config/cors.php
'allowed_origins' => ['http://192.168.1.100:3000'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

### Issue 5: Session Not Persisting
**Symptoms:** Logout after refresh

**Solution:**
```bash
# .env
SESSION_DRIVER=database
SESSION_DOMAIN=192.168.1.100
SANCTUM_STATEFUL_DOMAINS=192.168.1.100:3000
```

---

## 📊 MONITORING & MAINTENANCE

### Daily Tasks
- [ ] Check `storage/logs/laravel.log` untuk errors
- [ ] Verify backup created di Z:\backups
- [ ] Check NAS metrics di dashboard (latency, IOPS, concurrent users)
- [ ] Monitor disk space usage

### Weekly Tasks
- [ ] Review backup retention (delete old backups manually jika perlu)
- [ ] Check database size (`SELECT table_schema, SUM(data_length + index_length) FROM information_schema.tables`)
- [ ] Verify all users can login
- [ ] Test file upload/download functionality

### Monthly Tasks
- [ ] Update Laravel dependencies: `composer update`
- [ ] Update React dependencies: `npm update`
- [ ] Review and optimize database indexes
- [ ] Check for Laravel security updates
- [ ] Backup configuration files (.env, database)

---

## 📞 SUPPORT

### Resources
- **Laravel Documentation**: https://laravel.com/docs/10.x
- **React Documentation**: https://react.dev
- **Project Documentation**:
  - NAS_CONFIGURATION_GUIDE.md
  - CONCURRENT_USERS_DATA_SOURCE.md
  - SERVER_MONITOR_README.md
  - TROUBLESHOOTING_MONITORING.md

### Common Commands
```powershell
# Start Laravel
php artisan serve --host=192.168.1.100 --port=8000

# Start React
npm start

# Manual backup
php artisan backup:run

# Check NAS status
php artisan tinker
> app(App\Services\NasMonitoringService::class)->getMetrics();

# Clear all caches
php artisan optimize:clear

# View logs
Get-Content storage\logs\laravel.log -Tail 100 -Wait
```

---

## ✅ DEPLOYMENT COMPLETE!

Jika semua checklist di atas sudah ✅, maka aplikasi **siap production**!

**Akses aplikasi:**
- Frontend: http://192.168.1.100:3000
- Backend API: http://192.168.1.100:8000/api
- Login: admin@contoh.com / password (ganti di production!)

**Next Steps:**
1. Setup HTTPS dengan SSL certificate (recommended untuk production)
2. Setup domain name (optional)
3. Configure firewall untuk security
4. Setup monitoring/alerting system
5. Document admin procedures untuk tim IT

**Good luck! 🚀**
