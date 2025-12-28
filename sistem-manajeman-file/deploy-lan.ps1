# ========================================
# QUICK LAN DEPLOYMENT - 10.7.8.18/Cloud-Daop-7
# ========================================

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        DEPLOY KE LAN - 10.7.8.18/Cloud-Daop-7             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Target configuration
$TARGET_IP = "10.7.8.18"
$BASE_PATH = "/Cloud-Daop-7"

Write-Host "📋 Target Configuration:" -ForegroundColor Yellow
Write-Host "   IP Address: $TARGET_IP"
Write-Host "   Base Path: $BASE_PATH"
Write-Host "   Full URL: http://$TARGET_IP$BASE_PATH`n"

# ========================================
# STEP 1: CLEAR CACHES
# ========================================
Write-Host "🧹 STEP 1: Clearing Laravel caches..." -ForegroundColor Yellow
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
Write-Host "✅ Caches cleared`n" -ForegroundColor Green

# ========================================
# STEP 2: BUILD REACT FRONTEND
# ========================================
Write-Host "🎨 STEP 2: Building React frontend..." -ForegroundColor Yellow

Push-Location ..\sistem-manajeman-file_ui

Write-Host "   Installing dependencies..." -ForegroundColor Cyan
npm install --silent

Write-Host "   Building for production..." -ForegroundColor Cyan
$env:GENERATE_SOURCEMAP = "false"
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ React build successful" -ForegroundColor Green
    
    # Copy to Laravel public
    Write-Host "   Copying build to Laravel public..." -ForegroundColor Cyan
    
    # Remove old build
    if (Test-Path ..\sistem-manajeman-file\public\Cloud-Daop-7) {
        Remove-Item ..\sistem-manajeman-file\public\Cloud-Daop-7 -Recurse -Force
    }
    
    # Copy new build
    Copy-Item -Path build -Destination ..\sistem-manajeman-file\public\Cloud-Daop-7 -Recurse
    Write-Host "   ✅ Build copied to public/Cloud-Daop-7`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Build failed`n" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# ========================================
# STEP 3: CREATE .HTACCESS FOR APACHE
# ========================================
Write-Host "⚙️  STEP 3: Creating .htaccess configuration..." -ForegroundColor Yellow

$htaccess = @"
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Redirect root to Cloud-Daop-7
    RewriteRule ^$ /Cloud-Daop-7/ [R=301,L]
    
    # Handle Cloud-Daop-7 frontend routing
    RewriteCond %{REQUEST_URI} ^/Cloud-Daop-7
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^Cloud-Daop-7/(.*)$ /Cloud-Daop-7/index.html [L]
    
    # API routes
    RewriteCond %{REQUEST_URI} ^/api
    RewriteRule ^(.*)$ public/index.php [L]
    
    # Laravel public assets
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ public/$1 [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-Content-Type-Options "nosniff"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# CORS for API
<IfModule mod_headers.c>
    SetEnvIf Origin "http(s)?://$TARGET_IP(:[0-9]+)?$" AccessControlAllowOrigin=$0
    Header set Access-Control-Allow-Origin %{AccessControlAllowOrigin}e env=AccessControlAllowOrigin
    Header set Access-Control-Allow-Credentials "true"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With"
</IfModule>
"@

$htaccess | Out-File -FilePath .htaccess -Encoding UTF8
Write-Host "✅ .htaccess created`n" -ForegroundColor Green

# ========================================
# STEP 4: CACHE OPTIMIZATION
# ========================================
Write-Host "🚀 STEP 4: Generating production caches..." -ForegroundColor Yellow
php artisan config:cache
php artisan route:cache
php artisan view:cache
Write-Host "✅ Production caches generated`n" -ForegroundColor Green

# ========================================
# STEP 5: CHECK WEB SERVER
# ========================================
Write-Host "🌐 STEP 5: Checking web server..." -ForegroundColor Yellow

# Check if Apache/Nginx is running
$apache = Get-Process -Name "httpd" -ErrorAction SilentlyContinue
$nginx = Get-Process -Name "nginx" -ErrorAction SilentlyContinue

if ($apache) {
    Write-Host "   ✅ Apache detected" -ForegroundColor Green
    Write-Host "`n   Configure Apache VirtualHost:" -ForegroundColor Cyan
    Write-Host "   DocumentRoot: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "   ServerName: $TARGET_IP`n"
} elseif ($nginx) {
    Write-Host "   ✅ Nginx detected" -ForegroundColor Green
    Write-Host "`n   Configure Nginx:" -ForegroundColor Cyan
    Write-Host "   root $(Get-Location);" -ForegroundColor Yellow
    Write-Host "   server_name $TARGET_IP;`n"
} else {
    Write-Host "   ⚠️  No web server detected" -ForegroundColor Yellow
    Write-Host "`n   Untuk testing, jalankan PHP built-in server:" -ForegroundColor Cyan
    Write-Host "   php -S $TARGET_IP`:80 -t public`n" -ForegroundColor Yellow
}

# ========================================
# STEP 6: VERIFY CONFIGURATION
# ========================================
Write-Host "🔍 STEP 6: Verifying configuration..." -ForegroundColor Yellow

# Check frontend build
if (Test-Path public\Cloud-Daop-7\index.html) {
    Write-Host "   ✅ Frontend build exists" -ForegroundColor Green
} else {
    Write-Host "   ❌ Frontend build missing" -ForegroundColor Red
}

# Check .env
$envContent = Get-Content .env -Raw
if ($envContent -match "APP_URL=http://$TARGET_IP") {
    Write-Host "   ✅ APP_URL configured" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  APP_URL not set to $TARGET_IP" -ForegroundColor Yellow
}

if ($envContent -match "SANCTUM_STATEFUL_DOMAINS.*$TARGET_IP") {
    Write-Host "   ✅ SANCTUM domains configured" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  SANCTUM domains not configured" -ForegroundColor Yellow
}

# Check React .env
if (Test-Path ..\sistem-manajeman-file_ui\.env) {
    $reactEnv = Get-Content ..\sistem-manajeman-file_ui\.env -Raw
    if ($reactEnv -match "REACT_APP_API_URL=http://$TARGET_IP") {
        Write-Host "   ✅ React API URL configured" -ForegroundColor Green
    }
} else {
    Write-Host "   ⚠️  React .env missing" -ForegroundColor Yellow
}

# ========================================
# SUMMARY
# ========================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              🎉 DEPLOYMENT SELESAI!                       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📊 AKSES APLIKASI:`n" -ForegroundColor Cyan
Write-Host "   🌐 Web: http://$TARGET_IP$BASE_PATH" -ForegroundColor Yellow
Write-Host "   🔧 API: http://$TARGET_IP/api" -ForegroundColor Yellow
Write-Host ""

Write-Host "📝 LANGKAH SELANJUTNYA:`n" -ForegroundColor Cyan

if (-not $apache -and -not $nginx) {
    Write-Host "   1. Setup Web Server (Apache/Nginx/IIS)" -ForegroundColor Yellow
    Write-Host "      ATAU jalankan PHP built-in server:" -ForegroundColor Yellow
    Write-Host "      php -S $TARGET_IP`:80 -t public`n" -ForegroundColor Cyan
    
    Write-Host "   2. Pastikan port 80 terbuka di firewall:" -ForegroundColor Yellow
    Write-Host "      netsh advfirewall firewall add rule name=`"HTTP`" dir=in action=allow protocol=TCP localport=80`n" -ForegroundColor Cyan
    
    Write-Host "   3. Test akses dari komputer lain di LAN:" -ForegroundColor Yellow
    Write-Host "      http://$TARGET_IP$BASE_PATH`n" -ForegroundColor Cyan
} else {
    Write-Host "   1. Restart web server untuk apply konfigurasi" -ForegroundColor Yellow
    Write-Host "   2. Test akses: http://$TARGET_IP$BASE_PATH" -ForegroundColor Yellow
    Write-Host "   3. Verify API: http://$TARGET_IP/api/user`n" -ForegroundColor Yellow
}

Write-Host "⚠️  CATATAN PENTING:`n" -ForegroundColor Yellow
Write-Host "   • Pastikan firewall allow port 80/443"
Write-Host "   • Komputer client harus di network yang sama (LAN)"
Write-Host "   • Jika pakai Apache, set DocumentRoot ke folder ini"
Write-Host "   • Untuk production, gunakan HTTPS dengan SSL certificate`n"

$openTest = Read-Host "Test akses di browser sekarang? (y/n)"
if ($openTest -eq 'y') {
    Start-Process "http://$TARGET_IP$BASE_PATH"
}

Write-Host "`n✨ Setup selesai! Aplikasi siap diakses di LAN!`n" -ForegroundColor Green
