# 🌐 SETUP AKSES LAN - 10.7.8.18/Cloud-Daop-7

## ✅ Konfigurasi Sudah Diupdate

Konfigurasi berikut sudah diupdate otomatis:

### 1. **React Frontend** (`sistem-manajeman-file_ui/package.json`)
```json
"homepage": "/Cloud-Daop-7"
```

### 2. **React API URL** (`sistem-manajeman-file_ui/.env`)
```bash
REACT_APP_API_URL=http://10.7.8.18/api
```

### 3. **Laravel Backend** (`.env`)
```bash
APP_URL=http://10.7.8.18
SESSION_DOMAIN=10.7.8.18
SANCTUM_STATEFUL_DOMAINS=10.7.8.18,10.7.8.18:3000,10.7.8.18:8000
```

---

## 🚀 LANGKAH DEPLOYMENT

### **STEP 1: Build React Frontend**
```powershell
cd C:\laragon\www\drive-file-7\sistem-manajeman-file_ui

# Install dependencies (jika belum)
npm install

# Build production
npm run build

# Copy ke Laravel public folder
xcopy /E /I /Y build ..\sistem-manajeman-file\public\Cloud-Daop-7
```

### **STEP 2: Setup Web Server**

#### **OPSI A: Apache (Laragon/XAMPP)**

Buat file konfigurasi: `C:\laragon\etc\apache2\sites-enabled\daop7.conf`

```apache
<VirtualHost *:80>
    ServerName 10.7.8.18
    DocumentRoot "C:/laragon/www/drive-file-7/sistem-manajeman-file/public"
    
    <Directory "C:/laragon/www/drive-file-7/sistem-manajeman-file/public">
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # API CORS Headers
    <IfModule mod_headers.c>
        Header set Access-Control-Allow-Origin "http://10.7.8.18"
        Header set Access-Control-Allow-Credentials "true"
        Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
    </IfModule>
    
    ErrorLog "C:/laragon/www/drive-file-7/sistem-manajeman-file/storage/logs/apache-error.log"
    CustomLog "C:/laragon/www/drive-file-7/sistem-manajeman-file/storage/logs/apache-access.log" combined
</VirtualHost>
```

**Restart Apache:**
```powershell
# Di Laragon: Menu > Apache > Restart
# Atau manual:
net stop Apache2.4
net start Apache2.4
```

#### **OPSI B: IIS (Windows Server)**

1. Buka **IIS Manager** (`inetmgr`)
2. Klik kanan **Sites** → **Add Website**
3. Konfigurasi:
   - **Site name**: Daop7FileManagement
   - **Physical path**: `C:\laragon\www\drive-file-7\sistem-manajeman-file\public`
   - **Binding**:
     - Type: http
     - IP address: 10.7.8.18
     - Port: 80
     - Host name: (kosongkan)

4. Install **URL Rewrite Module** (jika belum)
   - Download: https://www.iis.net/downloads/microsoft/url-rewrite

5. Buat file `web.config` di `public` folder:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <!-- Cloud-Daop-7 Frontend -->
                <rule name="Cloud-Daop-7 SPA" stopProcessing="true">
                    <match url="^Cloud-Daop-7/(.*)$" />
                    <conditions>
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="Cloud-Daop-7/index.html" />
                </rule>
                
                <!-- Laravel API -->
                <rule name="Laravel API" stopProcessing="true">
                    <match url="^(.*)$" />
                    <conditions>
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="index.php" />
                </rule>
            </rules>
        </rewrite>
        
        <!-- CORS Headers -->
        <httpProtocol>
            <customHeaders>
                <add name="Access-Control-Allow-Origin" value="http://10.7.8.18" />
                <add name="Access-Control-Allow-Credentials" value="true" />
                <add name="Access-Control-Allow-Methods" value="GET, POST, PUT, DELETE, OPTIONS" />
                <add name="Access-Control-Allow-Headers" value="Content-Type, Authorization, X-Requested-With" />
            </customHeaders>
        </httpProtocol>
    </system.webServer>
</configuration>
```

#### **OPSI C: PHP Built-in Server (Testing Only)**

```powershell
cd C:\laragon\www\drive-file-7\sistem-manajeman-file
php -S 10.7.8.18:80 -t public
```

⚠️ **WARNING**: Opsi ini hanya untuk testing, tidak untuk production!

---

### **STEP 3: Firewall Configuration**

```powershell
# Allow HTTP port 80
netsh advfirewall firewall add rule name="HTTP Port 80" dir=in action=allow protocol=TCP localport=80

# Check if rule exists
netsh advfirewall firewall show rule name="HTTP Port 80"
```

---

### **STEP 4: Clear Laravel Cache**

```powershell
cd C:\laragon\www\drive-file-7\sistem-manajeman-file

php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Generate production cache
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

### **STEP 5: Test Access**

#### **Dari Server (Local)**
```powershell
# Test API
curl http://10.7.8.18/api/user

# Test Frontend
Start-Process http://10.7.8.18/Cloud-Daop-7
```

#### **Dari Komputer Lain di LAN**
1. Buka browser
2. Akses: **http://10.7.8.18/Cloud-Daop-7**
3. Login dengan akun admin

---

## 🔍 TROUBLESHOOTING

### Problem 1: "Cannot access from other computers"

**Check:**
```powershell
# Verify server listening on 10.7.8.18
netstat -an | findstr "10.7.8.18:80"

# Should show:
# TCP    10.7.8.18:80    0.0.0.0:0    LISTENING
```

**Fix:**
- Pastikan Apache/IIS bind ke 10.7.8.18 (bukan 127.0.0.1)
- Check firewall: `netsh advfirewall firewall show rule name=all | findstr "80"`

---

### Problem 2: "404 Not Found on /Cloud-Daop-7"

**Check:**
```powershell
# Verify build folder exists
Test-Path C:\laragon\www\drive-file-7\sistem-manajeman-file\public\Cloud-Daop-7\index.html

# Should return: True
```

**Fix:**
```powershell
cd C:\laragon\www\drive-file-7\sistem-manajeman-file_ui
npm run build
xcopy /E /I /Y build ..\sistem-manajeman-file\public\Cloud-Daop-7
```

---

### Problem 3: "CORS Error in Browser Console"

**Fix Laravel CORS** (`config/cors.php`):
```php
'allowed_origins' => ['http://10.7.8.18'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

**Clear cache:**
```powershell
php artisan config:clear
php artisan config:cache
```

---

### Problem 4: "Session/Login Issues"

**Check .env:**
```bash
SESSION_DOMAIN=10.7.8.18
SANCTUM_STATEFUL_DOMAINS=10.7.8.18,10.7.8.18:3000,10.7.8.18:8000
```

**Clear sessions:**
```powershell
php artisan cache:clear
php artisan session:clear
```

---

## 📝 VERIFICATION CHECKLIST

- [ ] React build berhasil di `public/Cloud-Daop-7/`
- [ ] `.env` APP_URL = `http://10.7.8.18`
- [ ] Web server (Apache/IIS) running
- [ ] Firewall allow port 80
- [ ] Bisa akses dari server: `http://10.7.8.18/Cloud-Daop-7`
- [ ] Bisa akses dari komputer lain di LAN
- [ ] Login berhasil
- [ ] Upload file berhasil
- [ ] NAS monitoring berfungsi

---

## 🎯 QUICK ACCESS

**Frontend**: http://10.7.8.18/Cloud-Daop-7  
**API**: http://10.7.8.18/api  
**Login**: admin@contoh.com / password

---

## 📚 DOKUMENTASI LANJUTAN

- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
- [NAS_CONFIGURATION_GUIDE.md](NAS_CONFIGURATION_GUIDE.md)
- [TROUBLESHOOTING_MONITORING.md](TROUBLESHOOTING_MONITORING.md)
