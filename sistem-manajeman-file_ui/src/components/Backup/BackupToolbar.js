import React, { useState } from "react";
import { createBackup } from "../../services/api";
import "../../pages/BackupPage.css";

const BackupToolbar = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleManualBackup = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await createBackup();
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Terjadi kesalahan pada server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="backup-toolbar">
      <button
        onClick={handleManualBackup}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "⏳ Membuat Backup..." : "➕ Buat Backup Manual"}
      </button>
      {message && <p className="status-message">{message}</p>}
    </div>
  );
};

export default BackupToolbar;