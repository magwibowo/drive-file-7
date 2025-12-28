import React, { useState, useEffect } from "react";
import BackupToolbar from "../components/Backup/BackupToolbar";
import BackupSetting from "../components/Backup/BackupSetting";
import BackupTable from "../components/Backup/BackupTable";
import NasHealthIndicator from "../components/Backup/NasHealthIndicator";
import BackupProgress from "../components/Backup/BackupProgress";
import "../pages/BackupPage.css";
import {
  fetchBackups,
  createBackup,
  deleteBackup,
  downloadBackup,
} from "../services/api";

import Notification from '../components/Notification/Notification';

export default function BackupPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // State untuk mengelola notifikasi
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "", // 'success' atau 'error'
  });

  const loadBackups = async () => {
    // ... (Fungsi ini tidak berubah)
    setLoading(true);
    try {
      const res = await fetchBackups();
      const sortedData = res.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setBackups(sortedData);
    } catch (err) {
      console.error("Gagal memuat backup:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const handleBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const response = await createBackup();
      console.log('Backup Response:', response); // Debug log
      
      await loadBackups();
      
      // Success notification dengan detail
      // Backend returns: { message: "...", file: "Z:\\backups\\backup_xxx.zip" }
      const fullPath = response.data?.file || response.data?.path || '';
      const filename = fullPath.split('\\').pop() || fullPath.split('/').pop() || 'backup.zip';
      
      setNotification({
        visible: true,
        message: `✅ Backup berhasil dibuat: ${filename}`,
        type: "success",
      });
    } catch (error) {
      // Better error messages
      console.error("Backup error details:", {
        response: error.response,
        message: error.message,
        data: error.response?.data
      });
      
      let errorMessage = "Gagal membuat backup. ";
      
      if (error.response?.data?.message) {
        // Use backend message directly
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        // Parse backend error
        const backendError = error.response.data.error;
        if (backendError.includes('mysqldump') || backendError.includes('dump')) {
          errorMessage += "Database backup gagal. Periksa koneksi MySQL.";
        } else if (backendError.includes('ZIP') || backendError.includes('zip')) {
          errorMessage += "Gagal membuat file ZIP.";
        } else if (backendError.includes('permission') || backendError.includes('Permission')) {
          errorMessage += "Tidak ada akses ke folder backup.";
        } else {
          errorMessage += backendError;
        }
      } else if (error.message === 'Network Error') {
        errorMessage += "Tidak dapat terhubung ke server.";
      } else {
        errorMessage += error.message || "Silakan coba lagi.";
      }
      
      setNotification({
        visible: true,
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownload = async (id) => {
    // ... (Fungsi ini tidak berubah)
    const backup = backups.find((b) => b.id === id);
    try {
      const res = await downloadBackup(id);
      const url = window.URL.createObjectURL(
        new Blob([res.data], { type: "application/zip" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", backup.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Gagal mengunduh backup:", error);
    }
  };

  const handleDelete = async (id) => {
    // --- PERUBAHAN ---
    // Mengganti window.confirm dengan logika state (jika diperlukan)
    // Untuk saat ini, kita biarkan window.confirm karena butuh konfirmasi Ya/Tidak
    const backup = backups.find((b) => b.id === id);
    if (
      window.confirm(`Apakah Anda yakin ingin menghapus backup ${backup.filename}?`)
    ) {
      try {
        await deleteBackup(id);
        await loadBackups();
        // Menampilkan notifikasi sukses
        setNotification({
          visible: true,
          message: "Backup berhasil dihapus.",
          type: "success",
        });
      } catch (err) {
        console.error("Gagal menghapus backup:", err);
        // Mengganti alert() dengan notifikasi kustom
        setNotification({
          visible: true,
          message: "Gagal menghapus backup!",
          type: "error",
        });
      }
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = backups.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Fungsi untuk menutup notifikasi
  const closeNotification = () => {
    setNotification({ ...notification, visible: false });
  };

  return (
    // Kita tambahkan div wrapper agar notifikasi bisa ditampilkan di atas segalanya
    <>
      {/* Progress Indicator Modal */}
      <BackupProgress isCreating={isCreatingBackup} message="Sedang membuat backup..." />

      {/* Notification */}
      {notification.visible && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      <div className="backup-page">
        <h2 className="page-title">
          <span className="icon">💾</span> Manajemen Backup
        </h2>

        {/* NAS Health Indicator - Shows drive status and health */}
        <NasHealthIndicator />

        <div className="toolbar-container">
          <BackupToolbar onBackup={handleBackup} loading={isCreatingBackup} />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="icon">🗂️</span> Daftar Backup ({backups.length})
          </div>
          <div className="card-body">
            {backups.length === 0 && !loading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px',
                color: '#666',
                fontSize: '15px'
              }}>
                📦 Belum ada backup. Klik tombol "Buat Backup Manual" untuk membuat backup pertama.
              </div>
            ) : (
              <BackupTable
                backups={currentItems} 
                loading={loading}
                onDownload={handleDownload}
                onDelete={handleDelete}
                itemsPerPage={itemsPerPage}
                totalBackups={backups.length}
                paginate={paginate}
                currentPage={currentPage}
              />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="icon">⚙️</span> Pengaturan Backup
          </div>
          <div className="card-body">
            <BackupSetting />
          </div>
        </div>
      </div>
    </>
  );
}