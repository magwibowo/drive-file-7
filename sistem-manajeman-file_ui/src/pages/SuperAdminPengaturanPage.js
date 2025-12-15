import { useState } from "react";
// Impor komponen dari kedua branch
import BackupPage from "./BackupPage";
import DivisionQuotaPage from "./DivisionQuotaPage";
import ServerMonitor from "../components/ServerMonitor/ServerMonitor";
import "./SuperAdminPengaturanPage.css";

export default function SuperAdminPengaturanPage() {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="settings-container">
      <h1 className="settings-title">⚙️ Pengaturan</h1>

      {/* Tab Menu yang sudah digabung */}
      <div className="tab-menu">
        <button
          className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          Umum
        </button>
        <button
          className={`tab-btn ${activeTab === "backup" ? "active" : ""}`}
          onClick={() => setActiveTab("backup")}
        >
          Backup Data
        </button>
        {/* Tombol tab "Kuota Divisi" dari branch production_ui ditambahkan kembali */}
        <button
          className={`tab-btn ${activeTab === "quota" ? "active" : ""}`}
          onClick={() => setActiveTab("quota")}
        >
          Kuota Divisi
        </button>
        <button
          className={`tab-btn ${activeTab === "monitor" ? "active" : ""}`}
          onClick={() => setActiveTab("monitor")}
        >
          Server Monitor
        </button>
      </div>

      {/* Isi Konten yang sudah digabung */}
      <div className="tab-content">
        {activeTab === "general" && (
          <div>
            <p>⚙️ Pengaturan umum sistem ditaruh di sini...</p>
          </div>
        )}

        {/* Gunakan komponen BackupPage yang baru dari feature/backup-fix */}
        {activeTab === "backup" && <BackupPage />}
        
        {/* Konten untuk tab "Kuota Divisi" dari production_ui ditambahkan kembali */}
        {activeTab === "quota" && <DivisionQuotaPage />}

        {/* Tab Server Monitor */}
        {activeTab === "monitor" && <ServerMonitor />}
      </div>
    </div>
  );
}