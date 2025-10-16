import React, { useState, useEffect } from "react";
import BackupToolbar from "../components/Backup/BackupToolbar";
import BackupSettings from "../components/Backup/BackupSetting";
import BackupTable from "../components/Backup/BackupTable";
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

  // --- PENAMBAHAN ---
  // 2. State untuk mengelola notifikasi
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
      await createBackup();
      await loadBackups();
      // --- PERUBAHAN ---
      // Menampilkan notifikasi sukses
      setNotification({
        visible: true,
        message: "Backup manual berhasil dibuat.",
        type: "success",
      });
    } catch (error) {
      console.error("Gagal membuat backup:", error);
      // --- PERUBAHAN ---
      // Menampilkan notifikasi error
      setNotification({
        visible: true,
        message: "Gagal membuat backup manual.",
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
      {/* --- PENAMBAHAN --- */}
      {/* 3. Render komponen notifikasi secara kondisional */}
      {notification.visible && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      <div className="backup-page">
        <h2 className="page-title">
          <span className="icon"></span> Manajemen Backup
        </h2>

        <div className="toolbar-container">
          <BackupToolbar onBackup={handleBackup} loading={isCreatingBackup} />
        </div>

        <div className="card">
          <div className="card-header">
            <span className="icon">⚙️</span> Pengaturan Backup
          </div>
          <div className="card-body">
            <BackupSettings />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="icon">🗂️</span> Daftar Backup
          </div>
          <div className="card-body">
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
          </div>
        </div>
      </div>
    </>
  );
}