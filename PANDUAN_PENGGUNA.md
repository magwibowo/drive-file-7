# Panduan Pengguna - Sistem Manajemen File DAOP 7 Madiun

## BAGIAN 1: PENDAHULUAN

Selamat datang di Sistem Manajemen File (SMF) DAOP 7 Madiun. Dokumen ini akan memandu Anda dalam menggunakan berbagai fitur yang tersedia di dalam sistem.

### 1. Memulai Penggunaan Sistem
Bagian ini menjelaskan langkah-langkah awal untuk menggunakan sistem.

#### 1.1. Alamat Akses Sistem
Untuk mengakses Sistem Manajemen File, silakan buka browser web Anda dan kunjungi alamat berikut:
-   **URL:** `http://1.0:3000`

*Catatan: Alamat ini digunakan untuk lingkungan pengembangan lokal. Alamat untuk sistem produksi mungkin berbeda.*

#### 1.2. Prosedur Login dan Logout
**Prosedur Login:**
1.  Setelah membuka alamat sistem, Anda akan melihat halaman login.
2.  Masukkan **NIPP** (Nomor Induk Pokok Pegawai) Anda di kolom yang tersedia.
3.  Masukkan **Password** Anda.
4.  Klik tombol **"Login"** untuk masuk ke sistem.

**Prosedur Logout:**
1.  Untuk keluar dari sistem, klik nama Anda atau ikon profil yang biasanya terletak di pojok kanan atas layar.
2.  Pilih opsi **"Logout"** dari menu dropdown yang muncul.
3.  Anda akan diarahkan kembali ke halaman login.

#### 1.3. Lupa Password
Sistem saat ini tidak memiliki fitur reset password mandiri. Jika Anda lupa atau kehilangan password Anda, silakan ikuti prosedur berikut:
-   Hubungi **Admin Divisi** Anda atau **Super Admin** sistem.
-   Admin akan membantu Anda untuk mereset password Anda secara manual.

#### 1.4. Tampilan Utama (Dashboard)
Setelah berhasil login, Anda akan diarahkan ke **Dashboard**, yang merupakan tampilan utama sistem.
-   **Navigasi Utama**: Di sisi kiri layar, Anda akan menemukan menu navigasi utama untuk mengakses berbagai fitur.
-   **Area Konten**: Bagian tengah layar menampilkan daftar file dan folder.
-   **Breadcrumb**: Di bagian atas area konten, terdapat navigasi *breadcrumb* yang menunjukkan lokasi Anda saat ini.

---

## BAGIAN 2: PANDUAN PENGGUNAAN FITUR

### 2.1. Panduan User Divisi

Setelah login, Anda akan masuk ke dashboard utama.

#### 2.1.1. Navigasi Utama
Menu navigasi utama berada di sisi kiri layar, berisi:
-   **Dashboard**: Halaman utama yang menampilkan file dan folder Anda.
-   **Terbaru**: Menampilkan file yang baru saja Anda akses atau modifikasi.
-   **Favorit**: Menampilkan file yang telah Anda tandai sebagai favorit.
-   **Sampah**: Menampilkan file dan folder yang telah Anda hapus.
-   **Profil**: Halaman untuk melihat informasi Profil.

#### 2.1.2. Manajemen File
-   **Upload File**:
    1.  Di halaman Dashboard, klik tombol "Upload File".
    2.  Pilih file dari komputer Anda.
    3.  File akan otomatis ter-upload ke folder yang sedang aktif.
-   **Unduh File**: Klik ikon Download (panah ke bawah) di sebelah nama file.
-   **Rename File**:
    1.  Klik salah satu file, lalu pilih Icon Pena pada tombol aksi diatas.
    2.  Masukkan nama baru dan tekan Enter.
-   **Menandai Favorit**: Klik ikon bintang di sebelah nama file. Klik lagi untuk menghapus dari favorit.
-   **Menghapus File**: Klik ikon sampah di sebelah nama file. File akan dipindahkan ke folder Sampah.
-   **Mengembalikan File dari Sampah**:
    1.  Pergi ke halaman Sampah.
    2.  Klik tombol Pulihkan di sebelah file yang ingin dikembalikan.
-   **Menghapus File Secara Permanen**: Di halaman Sampah, klik tombol hapus permanen. Tindakan ini tidak dapat dibatalkan.

### 2.2. Panduan Admin Divisi

Setelah login, Anda akan masuk ke dashboard utama seperti User Divisi. Admin Divisi juga memiliki semua fitur Pengguna Biasa, Namun ditambah menu Panel Admin di navigasi profil.

Saat mengakses Panel Admin. Di dalamnya terdapat menu untuk:
-   **Kelola Pengguna**: Mengelola akun pengguna di dalam divisi Anda.
-   **Kelola Folder**: Mengelola folder utama di dalam divisi Anda.
-   **Log Aktivitas**: Melihat riwayat aktivitas yang terjadi di divisi Anda.

#### 2.2.1. Manajemen Folder
-   **Membuat Folder Baru**:
    1.  Klik tombol Folder Baru.
    2.  Masukkan nama folder dan klik Tambah Folder.
-   **Navigasi Folder**: Klik dua kali pada nama folder untuk masuk ke dalamnya. Gunakan breadcrumb di bagian atas untuk kembali ke folder sebelumnya.
-   **Rename & Hapus Folder**: Sama seperti file, gunakan menu opsi di sebelah nama folder.

#### 2.2.2. Manajemen Pengguna Divisi
Masuk ke Panel Admin > Kelola Pengguna.
-   **Menambah Pengguna**:
    1.  Klik tombol "Tambah User".
    2.  Isi detail pengguna (Nama, NIPP, Password).
    3.  Klik Simpan.
-   **Mengedit Pengguna**: Klik ikon Edit (pensil) di sebelah nama pengguna, ubah informasi, lalu simpan.
-   **Menghapus Pengguna**: Klik ikon Sampah. Akun akan dipindahkan ke daftar pengguna sampah.
-   **Mengelola Pengguna yang berada di Sampah**: Terdapat tab untuk melihat pengguna yang sudah dihapus, di mana Anda bisa memulihkan atau menghapusnya secara permanen.

#### 2.2.3. Log Aktivitas Divisi
Masuk ke Panel Admin > Log Aktivitas untuk melihat jejak rekam semua aktivitas file dan folder yang dilakukan oleh pengguna di dalam divisi Anda.

### 2.3. Panduan Super Admin

Super Admin memiliki akses tertinggi dan menu "Super Admin Console" di navigasi profil untuk mengakses fitur-fitur tingkat lanjut.

#### 2.3.1. Manajemen Divisi
1.  Navigasi ke Super Admin > Manajemen > Kelola Divisi.
2.  Di halaman ini Anda dapat:
    -   **Melihat Semua Divisi**: Daftar divisi beserta jumlah pengguna dan total penyimpanan yang digunakan.
    -   **Menambah Divisi**:
        1.  Klik tombol "Tambah Divisi".
        2.  Klik "Simpan".
    -   **Mengedit Divisi**: Klik ikon Edit (pensil) untuk mengubah nama atau kuota penyimpanan.
    -   **Menghapus Divisi**: Klik ikon sampah (tong sampah). Tindakan ini akan sangat berpengaruh pada pengguna dan file di dalamnya dan harus dilakukan dengan hati-hati.

#### 2.3.2. Manajemen Pengguna Keseluruhan
1.  Navigasi ke Super Admin > Manajemen > Kelola Pengguna.
2.  Anda dapat melihat, menambah, mengedit, dan menghapus pengguna dari Semua divisi.

#### 2.3.3. Log Aktivitas Pengguna Keseluruhan
-   **Riwayat Login**: Di menu Manajemen, terdapat halaman "Login History" untuk melihat riwayat login semua pengguna.
-   **Log Aktivitas Global**: Super admin dapat melihat log aktivitas dari seluruh sistem.

#### 2.3.4. Manajemen Kuota Divisi
1.  Navigasi ke Super Admin > Pengaturan > Kuota Divisi.
2.  Klik atur kuota pada Divisi, lalu set berapa Kapasitas (MB/GB)nya.

#### 2.3.5. Manajemen Backup
1.  Navigasi ke Super Admin > Pengaturan > Backup.
2.  Di halaman ini Anda dapat:
    -   Melihat daftar backup yang sudah ada.
    -   Melakukan backup manual saat itu juga.
    -   Mengatur jadwal backup otomatis.
    -   Mengunduh atau menghapus file backup.