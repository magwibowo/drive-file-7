import { useState, useEffect } from "react";
import apiClient from "../services/api"; 
import SetQuotaModal from "../components/Modal/SetQuotaModal";
import ConfirmationModal from "../components/ConfirmationModal/ConfirmationModal"; // Impor
import Notification from "../components/Notification/Notification"; // Impor
import "./DivisionQuotaPage.css"; 

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function DivisionQuotaPage() {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState(null);

  // State untuk konfirmasi & notifikasi
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: () => {} });
  const [notification, setNotification] = useState({ isOpen: false, message: '', type: '' });

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/admin/divisions");
        setDivisions(response.data);
        setError(null);
      } catch (err) {
        setError("Gagal memuat data divisi.");
        setNotification({ isOpen: true, message: 'Gagal memuat data divisi.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchDivisions();
  }, []);

  const handleOpenModal = (division) => {
    setSelectedDivision(division);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDivision(null);
  };

  const handleSaveQuota = (value, unit) => {
    let quotaInBytes = 0;
    const numValue = parseFloat(value);
    if (unit === 'GB') {
      quotaInBytes = numValue * (1024 ** 3);
    } else if (unit === 'MB') {
      quotaInBytes = numValue * (1024 ** 2);
    }
    
    setConfirmModal({
      isOpen: true,
      message: `Anda yakin ingin mengatur kuota untuk ${selectedDivision.name} menjadi ${value} ${unit}?`,
      onConfirm: () => executeSave(quotaInBytes)
    });
  };

  const executeSave = async (quotaInBytes) => {
    if (!selectedDivision) return;
    try {
      const response = await apiClient.put(`/admin/divisions/${selectedDivision.id}/quota`, {
        storage_quota: quotaInBytes,
      });
      setDivisions(divisions.map(d => 
        d.id === selectedDivision.id ? response.data.division : d
      ));
      handleCloseModal();
      setNotification({ isOpen: true, message: 'Kuota berhasil diperbarui!', type: 'success' });
    } catch (err) {
      console.error("Gagal menyimpan kuota:", err);
      setNotification({ isOpen: true, message: 'Gagal memperbarui kuota.', type: 'error' });
    } finally {
      setConfirmModal({ isOpen: false, message: '', onConfirm: () => {} });
    }
  };

  if (loading) return <p>Memuat data divisi...</p>;
  if (error && !notification.isOpen) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="quota-container">
      <h2>Pengaturan Kuota Penyimpanan per Divisi</h2>
      <p>Atur batas maksimal penyimpanan untuk setiap divisi di bawah ini.</p>
      
      <div className="division-list">
        {divisions.map((division) => {
          const used = division.files_sum_ukuran_file || 0;
          const quota = division.storage_quota || 0;
          const percentage = quota > 0 ? (used / quota) * 100 : 0;

          return (
            <div key={division.id} className="division-item">
              <div className="division-info">
                <strong className="division-name">{division.name}</strong>
                <div className="usage-details">
                  <span className="division-usage-absolute">
                    {formatBytes(used)} / {quota > 0 ? formatBytes(quota) : "∞"}
                  </span>
                  {quota > 0 && (
                    <span className="division-usage-percentage">
                      ({percentage.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="progress-bar-container">
                <div 
                  className={`progress-bar ${percentage >= 85 ? 'danger' : percentage >= 50 ? 'warning' : 'primary'}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              <button 
                className="btn-atur-kuota" 
                onClick={() => handleOpenModal(division)}
              >
                Atur Kuota
              </button>
            </div>
          );
        })}
      </div>

      <SetQuotaModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        onSave={handleSaveQuota}
        division={selectedDivision}
      />
      
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        message={confirmModal.message}
        isDanger={false}
        confirmText="Ya, Simpan"
      />

      {notification.isOpen && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ isOpen: false, message: '', type: '' })}
        />
      )}
    </div>
  );
}