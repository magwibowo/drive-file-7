import { useEffect, useState } from "react";
import {
  fetchBackupSettings,
  updateBackupSettings,
  fetchBackupSchedule,
  updateBackupSchedule,
} from "../../services/api";

// 1. Import komponen Notifikasi
import Notification from '../Notification/Notification';

export default function BackupSetting() {
  const [backupPath, setBackupPath] = useState("");
  const [schedule, setSchedule] = useState("off");
  const [time, setTime] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. State untuk mengelola notifikasi (sama seperti di BackupPage.js)
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "",
  });

  useEffect(() => {
    // ... (Fungsi ini tidak perlu diubah)
    const loadSettings = async () => {
      try {
        setLoading(true);

        const pathData = await fetchBackupSettings();
        setBackupPath(pathData.backup_path || "");

        const scheduleData = await fetchBackupSchedule();
        if (scheduleData && scheduleData.schedule) {
          setSchedule(scheduleData.schedule.frequency || "off");
          setTime(scheduleData.schedule.time || "");
          setDayOfWeek(scheduleData.schedule.day_of_week || "");
          setDayOfMonth(scheduleData.schedule.day_of_month || "");
          setMonth(scheduleData.schedule.month || "");
        }

        setLoading(false);
      } catch (err) {
        console.error("Gagal ambil setting:", err.response?.data || err.message);
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handlePathSubmit = async (e) => {
    e.preventDefault();
    if (!backupPath || backupPath.trim() === "") return;
    const cleanPath = backupPath.trim().replace(/^"|"$/g, "");

    try {
      await updateBackupSettings(cleanPath);
      // 3. Ganti alert() dengan notifikasi kustom
      setNotification({
        visible: true,
        message: "Backup path berhasil disimpan!",
        type: "success",
      });
    } catch (err) {
      console.error(err.response?.data || err.message);
      // Ganti alert() dengan notifikasi kustom
      setNotification({
        visible: true,
        message: "Gagal menyimpan backup path!",
        type: "error",
      });
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateBackupSchedule({
        frequency: schedule,
        time: time || null,
        day_of_week: schedule === "weekly" ? dayOfWeek : null,
        day_of_month:
          schedule === "monthly" || schedule === "yearly" ? dayOfMonth : null,
        month: schedule === "yearly" ? month : null,
      });
      // Ganti alert() dengan notifikasi kustom
      setNotification({
        visible: true,
        message: "Jadwal backup berhasil disimpan!",
        type: "success",
      });
    } catch (err) {
      console.error(err.response?.data || err.message);
      // Ganti alert() dengan notifikasi kustom
      setNotification({
        visible: true,
        message: "Gagal menyimpan jadwal backup!",
        type: "error",
      });
    }
  };

  // Fungsi untuk menutup notifikasi
  const closeNotification = () => {
    setNotification({ ...notification, visible: false });
  };

  return (
    // Kita bungkus dengan <> agar bisa menaruh notifikasi di atasnya
    <>
      {/* 4. Render komponen notifikasi secara kondisional */}
      {notification.visible && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      <div className="settings-grid-container">
        {/* Kolom 1: Form Path */}
        <form onSubmit={handlePathSubmit} className="settings-form-card">
          <div className="form-content">
            <h4>Lokasi Penyimpanan</h4>
            <p className="form-description">
              Tentukan direktori folder untuk menyimpan file backup.
            </p>
            <div className="form-group">
              <label>Backup Path:</label>
              <input
                type="text"
                value={backupPath}
                onChange={(e) => setBackupPath(e.target.value)}
                className="form-input"
                placeholder="Contoh: D:\\backups"
                required
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Menyimpan..." : "Simpan Path"}
          </button>
        </form>

        {/* Kolom 2: Form Jadwal */}
        <form onSubmit={handleScheduleSubmit} className="settings-form-card">
          <div className="form-content">
            <h4>Jadwal Otatis</h4>
            <p className="form-description">
              Atur frekuensi backup otomatis sesuai kebutuhan Anda.
            </p>
            {/* ... sisa form tidak berubah ... */}
            <div className="form-group">
            <label>Frekuensi:</label>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="form-input"
            >
              <option value="off">Nonaktif</option>
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="yearly">Tahunan</option>
            </select>
          </div>

          {schedule !== "off" && (
            <>
              <div className="form-group">
                <label>Waktu (HH:MM):</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              {schedule === "weekly" && (
                <div className="form-group">
                  <label>Hari:</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="form-input"
                    required
                  >
                    <option value="">Pilih Hari</option>
                    <option value="1">Senin</option>
                    <option value="2">Selasa</option>
                    <option value="3">Rabu</option>
                    <option value="4">Kamis</option>
                    <option value="5">Jumat</option>
                    <option value="6">Sabtu</option>
                    <option value="0">Minggu</option>
                  </select>
                </div>
              )}

              {schedule === "monthly" && (
                <div className="form-group">
                  <label>Tanggal:</label>
                  <input
                    type="number"
                    value={dayOfMonth}
                    min="1"
                    max="31"
                    onChange={(e) => setDayOfMonth(e.target.value)}
                    className="form-input"
                    placeholder="1-31"
                    required
                  />
                </div>
              )}

              {schedule === "yearly" && (
                <div className="form-grid">
                  <div className="form-group">
                    <label>Bulan:</label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="form-input"
                      required
                    >
                      <option value="">Pilih Bulan</option>
                      {[...Array(12).keys()].map(m => (
                        <option key={m + 1} value={m + 1}>
                          {new Date(0, m).toLocaleString('id-ID', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tanggal:</label>
                    <input
                      type="number"
                      value={dayOfMonth}
                      min="1"
                      max="31"
                      onChange={(e) => setDayOfMonth(e.target.value)}
                      className="form-input"
                      placeholder="1-31"
                      required
                    />
                  </div>
                </div>
              )}
            </>
          )}
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Menyimpan..." : "Simpan Jadwal"}
          </button>
        </form>
      </div>
    </>
  );
}