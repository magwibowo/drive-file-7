import React, { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import "../../pages/BackupPage.css";

const BackupToolbar = ({ onBackup, loading }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    if (typeof onBackup === 'function') {
      onBackup();
    } else {
      console.error("Error: onBackup is not a function");
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title="Konfirmasi Backup"
        message="Apakah Anda yakin ingin membuat backup sekarang?"
        details={[
          "Backup database MySQL",
          "Backup semua file uploads",
          "Menyimpan ke NAS (Z:\\backups)",
          "Estimasi waktu: 10-30 detik"
        ]}
      />
      
      <div className="backup-toolbar">
        <button
          onClick={handleClick}
          disabled={loading}
          className="btn btn-primary"
          style={{
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
            position: 'relative',
          }}
        >
          {loading ? (
            <>
              <span className="spinner">⏳</span>
              <span> Membuat Backup...</span>
            </>
          ) : (
            "📦 Buat Backup Manual"
          )}
        </button>
        {loading && (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            ⚡ Sedang memproses backup, mohon tunggu...
          </div>
        )}
      </div>
    </>
  );
};

export default BackupToolbar;