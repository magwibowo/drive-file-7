import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SuperAdminBackupPage.css";

export default function SuperAdminBackupPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const token = localStorage.getItem("authToken");

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('id-ID');
  };

  const fetchBackups = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/backup/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.status === 'success') {
        setBackups(res.data.files || []);
      } else {
        setBackups([]);
      }
    } catch (err) {
      console.error("Gagal mengambil daftar backup:", err);
      alert("Gagal mengambil daftar backup: " + (err.response?.data?.message || err.message));
    }
  };

  const handleBackup = async (type) => {
  try {
    setLoading(true);
    setLoadingType(type);
    let endpoint = "";
    let buttonText = "";
    if (type === "full") {
      endpoint = "backup";
      buttonText = "Backup Seluruh Data";
    } else if (type === "database") {
      endpoint = "database";
      buttonText = "Backup Database";
    } else if (type === "storage") {
      endpoint = "storage";
      buttonText = "Backup Storage";
    } //else if (type === "users") {
    //   endpoint = "users";
    //   buttonText = "Backup Data User";
    // }
    const res = await axios.post(
      `http://localhost:8000/api/backup/${endpoint}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 300000,
      }
    );
    if (res.data.status === 'success') {
      alert(`✅ ${buttonText} berhasil!\n${res.data.message}`);
      fetchBackups();
    } else {
      throw new Error(res.data.message || 'Backup gagal');
    }
  } catch (err) {
    // ...existing error handling...
  } finally {
    setLoading(false);
    setLoadingType(null);
  }
};

  const handleDelete = async (filename) => {
    if (!window.confirm(`Yakin ingin menghapus backup "${filename}"?`)) return;
    try {
      setLoading(true);
      setLoadingType(`delete-${filename}`);
      await axios.delete(`http://localhost:8000/api/backup/delete/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("✅ Backup berhasil dihapus!");
      fetchBackups();
    } catch (err) {
      console.error("Gagal menghapus backup:", err);
      alert("❌ Gagal menghapus backup: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleDownload = async (filename) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/backup/download/${filename}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download gagal:", err);
      alert("❌ Download gagal: " + err.message);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  return (
    <div className="backup-container">
      <h2 className="backup-title">🗄️ Manajemen Backup Sistem</h2>
      <div>
        <h3 className="backup-subtitle">Buat Backup Baru</h3>
        <div className="backup-actions">
          <button
            className="btn btn-primary"
            disabled={loading}
            onClick={() => handleBackup("full")}
          >
            {loading && loadingType === "full" ? "🔄 Memproses..." : "📦 Backup Seluruh Data"}
          </button>
          {/* <button
            className="btn btn-warning"
            disabled={loading}
            onClick={() => handleBackup("users")}
          >
            {loading && loadingType === "users" ? "🔄 Memproses..." : "👤 Backup Data User"}
          </button> */}
          <button
            className="btn btn-success"
            disabled={loading}
            onClick={() => handleBackup("database")}
          >
            {loading && loadingType === "database" ? "🔄 Memproses..." : "🗃️ Backup Database"}
          </button>
          <button
            className="btn btn-secondary"
            disabled={loading}
            onClick={() => handleBackup("storage")}
          >
            {loading && loadingType === "storage" ? "🔄 Memproses..." : "📁 Backup Storage"}
          </button>
          {/* <button
            className="btn btn-secondary"
            onClick={fetchBackups}
          >
            🔄 Refresh Daftar
          </button> */}
        </div>
      </div>

      {loading && (
        <div className="backup-loading">
          <span className="backup-loading-text">
            ⏳ Sedang memproses backup. Mohon tunggu, proses ini mungkin memakan waktu beberapa menit.
          </span>
        </div>
      )}

      <div>
        <h3 className="backup-subtitle">📋 Daftar File Backup</h3>
        {backups.length === 0 ? (
          <div className="backup-empty">
            📂 Belum ada file backup. Silakan buat backup terlebih dahulu.
          </div>
        ) : (
          <div className="backup-table-wrapper">
            <table className="backup-table">
              <thead>
                <tr>
                  <th>📄 Nama File</th>
                  <th className="text-center">📏 Ukuran</th>
                  <th className="text-center">📅 Tanggal</th>
                  <th className="text-center">🔧 Aksi</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="backup-filename">
                        {backup.name || backup}
                      </span>
                    </td>
                    <td className="text-center">
                      {backup.size ? formatFileSize(backup.size) : '-'}
                    </td>
                    <td className="text-center">
                      {backup.modified ? formatDate(backup.modified) : '-'}
                    </td>
                    <td className="text-center">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDownload(backup.name || backup)}
                        style={{ marginRight: "6px" }}
                      >
                        ⬇️ Download
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDelete(backup.name || backup)}
                        disabled={loading && loadingType === `delete-${backup.name || backup}`}
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}