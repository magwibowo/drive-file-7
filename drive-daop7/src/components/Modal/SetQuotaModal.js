import { useState, useEffect } from 'react';
import './SetQuotaModal.css';

export default function SetQuotaModal({ isOpen, onClose, onSave, division }) {
  const [quotaValue, setQuotaValue] = useState('10');
  const [quotaUnit, setQuotaUnit] = useState('GB');

  useEffect(() => {
    if (division) {
      const currentQuota = division.storage_quota || 0;
      if (currentQuota > 0) {
        const gigaBytes = currentQuota / (1024 ** 3);
        if (gigaBytes >= 1) {
          setQuotaValue(gigaBytes.toFixed(0));
          setQuotaUnit('GB');
        } else {
          const megaBytes = currentQuota / (1024 ** 2);
          setQuotaValue(megaBytes.toFixed(0));
          setQuotaUnit('MB');
        }
      } else {
        setQuotaValue('10');
        setQuotaUnit('GB');
      }
    }
  }, [division]);

  const handleSave = () => {
    // Langsung teruskan nilai mentah ke parent
    onSave(quotaValue, quotaUnit);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="sqm-overlay" onClick={onClose}>
      <div className="sqm-content" onClick={(e) => e.stopPropagation()}>
        <div className="sqm-header">
          <h3 className="sqm-title">Atur Kuota untuk {division?.name}</h3>
          <button className="sqm-close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="sqm-body">
          <p>Masukkan batas penyimpanan baru. Masukkan 0 untuk tanpa batas.</p>
          <div className="sqm-input-group">
            <input 
              type="number"
              value={quotaValue}
              onChange={(e) => setQuotaValue(e.target.value)}
              className="sqm-quota-input"
            />
            <select
              value={quotaUnit}
              onChange={(e) => setQuotaUnit(e.target.value)}
              className="sqm-quota-select"
            >
              <option value="GB">GB</option>
              <option value="MB">MB</option>
            </select>
          </div>
          <div className="sqm-actions">
            <button className="sqm-btn-secondary" onClick={onClose}>Batal</button>
            <button className="sqm-btn-primary" onClick={handleSave}>Simpan Perubahan</button>
          </div>
        </div>
      </div>
    </div>
  );
}