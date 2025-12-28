# ========================================
# DEPLOYMENT SCRIPT - Laravel File Management ke NAS
# ========================================
# Tanggal: 28 Desember 2025
# Author: Deployment Script Generator

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     DEPLOYMENT SCRIPT - SISTEM MANAJEMEN FILE KE NAS      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# ========================================
# STEP 1: KONFIGURASI
# ========================================
Write-Host "📋 STEP 1: KONFIGURASI ENVIRONMENT`n" -ForegroundColor Yellow

$NAS_IP = Read-Host "Masukkan IP Address NAS (contoh: 192.168.1.100)"
$SERVER_IP = Read-Host "Masukkan IP Address Server (tekan Enter jika sama dengan NAS)"
if ([string]::IsNullOrWhiteSpace($SERVER_IP)) {
    $SERVER_IP = $NAS_IP
}

$DB_PASSWORD = Read-Host "Masukkan Password Database Production (kosongkan jika tidak ada)" -AsSecureString
$DB_PASSWORD_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))

Write-Host "`n✅ Konfigurasi diterima:`n" -ForegroundColor Green
Write-Host "   NAS IP: $NAS_IP"
Write-Host "   Server IP: $SERVER_IP"
Write-Host "   Database Password: " -NoNewline
if ([string]::IsNullOrWhiteSpace($DB_PASSWORD_PLAIN)) {
    Write-Host "[Kosong]" -ForegroundColor Yellow
} else {
    Write-Host "[Tersimpan]" -ForegroundColor Green
}

# ========================================
# STEP 2: BACKUP .ENV LAMA
# ========================================
Write-Host "`n📦 STEP 2: BACKUP KONFIGURASI LAMA`n" -ForegroundColor Yellow

if (Test-Path .env) {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    Copy-Item .env ".env.backup.$timestamp"
    Write-Host "✅ File .env di-backup ke .env.backup.$timestamp" -ForegroundColor Green
} else {
    Write-Host "⚠️  File .env tidak ditemukan, akan dibuat baru" -ForegroundColor Yellow
}

# ========================================
# STEP 3: UPDATE LARAVEL .ENV
# ========================================
Write-Host "`n⚙️  STEP 3: UPDATE LARAVEL CONFIGURATION`n" -ForegroundColor Yellow

$envContent = Get-Content .env -Raw

# Update APP settings
$envContent = $envContent -replace 'APP_ENV=local', 'APP_ENV=production'
$envContent = $envContent -replace 'APP_DEBUG=true', 'APP_DEBUG=false'
$envContent = $envContent -replace 'APP_URL=http://localhost:8000', "APP_URL=http://${SERVER_IP}:8000"

# Update Database
if (![string]::IsNullOrWhiteSpace($DB_PASSWORD_PLAIN)) {
    $envContent = $envContent -replace 'DB_PASSWORD=.*', "DB_PASSWORD=$DB_PASSWORD_PLAIN"
}

# Update NAS Configuration
$envContent = $envContent -replace 'NAS_IP=127.0.0.1', "NAS_IP=$NAS_IP"
$envContent = $envContent -replace 'NAS_ENABLED=true', 'NAS_ENABLED=true'

# Update SANCTUM
$envContent = $envContent -replace 'SANCTUM_STATEFUL_DOMAINS=localhost:3000', "SANCTUM_STATEFUL_DOMAINS=${SERVER_IP}:3000,${SERVER_IP}:8000"

# Update SESSION
$envContent = $envContent -replace 'SESSION_DOMAIN=localhost', "SESSION_DOMAIN=$SERVER_IP"

# Save updated .env
$envContent | Set-Content .env -NoNewline
Write-Host "✅ File .env berhasil diupdate" -ForegroundColor Green

# ========================================
# STEP 4: UPDATE REACT .ENV
# ========================================
Write-Host "`n⚙️  STEP 4: UPDATE REACT CONFIGURATION`n" -ForegroundColor Yellow

$reactEnvPath = "..\sistem-manajeman-file_ui\.env"
"REACT_APP_API_URL=http://${SERVER_IP}:8000/api" | Set-Content $reactEnvPath
Write-Host "✅ React .env berhasil dibuat di $reactEnvPath" -ForegroundColor Green

# ========================================
# STEP 5: COMPOSER & NPM INSTALL
# ========================================
Write-Host "`n📦 STEP 5: INSTALL DEPENDENCIES`n" -ForegroundColor Yellow

Write-Host "Installing Composer dependencies..." -ForegroundColor Cyan
composer install --optimize-autoloader --no-dev
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Composer dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Composer install failed" -ForegroundColor Red
    exit 1
}

# ========================================
# STEP 6: LARAVEL OPTIMIZATION
# ========================================
Write-Host "`n🚀 STEP 6: OPTIMISASI LARAVEL`n" -ForegroundColor Yellow

Write-Host "Clearing caches..." -ForegroundColor Cyan
php artisan config:clear
php artisan cache:clear
php artisan view:clear
php artisan route:clear

Write-Host "Generating production caches..." -ForegroundColor Cyan
php artisan config:cache
php artisan route:cache
php artisan view:cache

Write-Host "✅ Laravel optimization complete" -ForegroundColor Green

# ========================================
# STEP 7: DATABASE MIGRATION
# ========================================
Write-Host "`n🗄️  STEP 7: DATABASE SETUP`n" -ForegroundColor Yellow

$runMigration = Read-Host "Jalankan database migration? (y/n)"
if ($runMigration -eq 'y') {
    php artisan migrate --force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database migration complete" -ForegroundColor Green
        
        $runSeeder = Read-Host "Jalankan database seeder untuk initial data? (y/n)"
        if ($runSeeder -eq 'y') {
            php artisan db:seed --force
            Write-Host "✅ Database seeding complete" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Migration failed, periksa koneksi database" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Migration dilewati" -ForegroundColor Yellow
}

# ========================================
# STEP 8: FILE PERMISSIONS
# ========================================
Write-Host "`n🔐 STEP 8: SET FILE PERMISSIONS`n" -ForegroundColor Yellow

Write-Host "Setting permissions untuk storage..." -ForegroundColor Cyan
icacls storage /grant "Everyone:(OI)(CI)F" /T | Out-Null
icacls bootstrap\cache /grant "Everyone:(OI)(CI)F" /T | Out-Null
Write-Host "✅ Permissions set for storage and bootstrap/cache" -ForegroundColor Green

# ========================================
# STEP 9: BUILD REACT FRONTEND
# ========================================
Write-Host "`n🎨 STEP 9: BUILD REACT FRONTEND`n" -ForegroundColor Yellow

$buildFrontend = Read-Host "Build React frontend untuk production? (y/n)"
if ($buildFrontend -eq 'y') {
    Push-Location ..\sistem-manajeman-file_ui
    
    Write-Host "Installing NPM dependencies..." -ForegroundColor Cyan
    npm install
    
    Write-Host "Building production bundle..." -ForegroundColor Cyan
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Copying build to Laravel public folder..." -ForegroundColor Cyan
        
        # Remove old build
        if (Test-Path ..\sistem-manajeman-file\public\manajemen-file) {
            Remove-Item ..\sistem-manajeman-file\public\manajemen-file -Recurse -Force
        }
        
        # Copy new build
        Copy-Item -Path build -Destination ..\sistem-manajeman-file\public\manajemen-file -Recurse
        Write-Host "✅ React build copied to public/manajemen-file" -ForegroundColor Green
    } else {
        Write-Host "❌ React build failed" -ForegroundColor Red
    }
    
    Pop-Location
} else {
    Write-Host "⏭️  React build dilewati" -ForegroundColor Yellow
}

# ========================================
# STEP 10: VERIFY NAS CONNECTION
# ========================================
Write-Host "`n🔍 STEP 10: VERIFY NAS CONNECTION`n" -ForegroundColor Yellow

$testLatency = Test-Connection -ComputerName $NAS_IP -Count 1 -Quiet
if ($testLatency) {
    $pingResult = Test-Connection -ComputerName $NAS_IP -Count 1
    $latency = $pingResult.ResponseTime
    Write-Host "✅ NAS accessible - Latency: ${latency}ms" -ForegroundColor Green
} else {
    Write-Host "❌ NAS tidak dapat dijangkau di IP $NAS_IP" -ForegroundColor Red
    Write-Host "   Periksa koneksi jaringan dan IP address" -ForegroundColor Yellow
}

# Check drive mapping
if (Test-Path Z:\) {
    Write-Host "✅ Drive Z:\ terhubung" -ForegroundColor Green
    
    # Test write permission
    $testFile = "Z:\test-deployment.txt"
    try {
        "Test deployment" | Out-File -FilePath $testFile -ErrorAction Stop
        Remove-Item $testFile -ErrorAction SilentlyContinue
        Write-Host "✅ Write permission ke Z:\ berhasil" -ForegroundColor Green
    } catch {
        Write-Host "❌ Tidak ada write permission ke Z:\" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Drive Z:\ belum di-map" -ForegroundColor Yellow
    Write-Host "   Jalankan: net use Z: \\$NAS_IP\share /persistent:yes" -ForegroundColor Cyan
}

# ========================================
# STEP 11: SETUP TASK SCHEDULER
# ========================================
Write-Host "`n⏰ STEP 11: SETUP TASK SCHEDULER`n" -ForegroundColor Yellow

$setupScheduler = Read-Host "Setup Windows Task Scheduler untuk backup otomatis? (y/n)"
if ($setupScheduler -eq 'y') {
    $phpPath = (Get-Command php).Source
    $artisanPath = Join-Path (Get-Location) "artisan"
    
    Write-Host "`nBuat Task Scheduler dengan konfigurasi berikut:" -ForegroundColor Cyan
    Write-Host "   Name: Laravel Scheduler - File Management"
    Write-Host "   Program: $phpPath"
    Write-Host "   Arguments: `"$artisanPath`" schedule:run"
    Write-Host "   Start in: $(Get-Location)"
    Write-Host "   Trigger: Daily at 00:00"
    Write-Host "   Run whether user is logged on or not: Yes`n"
    
    Write-Host "Tekan Enter untuk membuka Task Scheduler..." -ForegroundColor Yellow
    Read-Host
    
    Start-Process taskschd.msc
} else {
    Write-Host "⏭️  Task Scheduler setup dilewati" -ForegroundColor Yellow
    Write-Host "   Anda bisa setup manual nanti untuk backup otomatis" -ForegroundColor Cyan
}

# ========================================
# DEPLOYMENT SUMMARY
# ========================================
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              🎉 DEPLOYMENT SELESAI!                       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "📊 RINGKASAN DEPLOYMENT:`n" -ForegroundColor Cyan
Write-Host "   ✅ Environment: PRODUCTION"
Write-Host "   ✅ NAS IP: $NAS_IP"
Write-Host "   ✅ Server IP: $SERVER_IP"
Write-Host "   ✅ API URL: http://${SERVER_IP}:8000/api"
Write-Host "   ✅ Frontend URL: http://${SERVER_IP}:3000"
Write-Host ""

Write-Host "🚀 CARA MENJALANKAN APLIKASI:`n" -ForegroundColor Yellow
Write-Host "   1. Start Laravel Backend:"
Write-Host "      cd C:\laragon\www\drive-file-7\sistem-manajeman-file"
Write-Host "      php artisan serve --host=$SERVER_IP --port=8000"
Write-Host ""
Write-Host "   2. Start React Frontend (di terminal baru):"
Write-Host "      cd C:\laragon\www\drive-file-7\sistem-manajeman-file_ui"
Write-Host "      npm start"
Write-Host ""
Write-Host "   3. Akses aplikasi di browser:"
Write-Host "      http://${SERVER_IP}:3000`n"

Write-Host "📝 CATATAN PENTING:`n" -ForegroundColor Cyan
Write-Host "   • Pastikan drive Z:\ sudah di-map ke NAS"
Write-Host "   • Pastikan port 8000 dan 3000 tidak diblokir firewall"
Write-Host "   • Backup .env tersimpan di .env.backup.*"
Write-Host "   • Untuk production, gunakan web server (Apache/Nginx/IIS)"
Write-Host "   • Setup Task Scheduler untuk backup otomatis`n"

Write-Host "📚 DOKUMENTASI LANJUTAN:" -ForegroundColor Cyan
Write-Host "   • NAS_CONFIGURATION_GUIDE.md"
Write-Host "   • CONCURRENT_USERS_DATA_SOURCE.md"
Write-Host "   • DEPLOYMENT_CHECKLIST.md (akan dibuat)`n"

$openBrowser = Read-Host "Buka browser untuk test akses? (y/n)"
if ($openBrowser -eq 'y') {
    Start-Process "http://${SERVER_IP}:3000"
}

Write-Host "`n✨ Deployment script selesai! Selamat bekerja!`n" -ForegroundColor Green
