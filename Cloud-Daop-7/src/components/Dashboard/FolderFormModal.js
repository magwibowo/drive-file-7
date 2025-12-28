// src/components/Dashboard/FolderFormModal.js

import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import Modal from '../Modal/Modal';
// Kita bisa gunakan kembali CSS dari form lain untuk konsistensi
import './DivisiFormModal.css';

// Tambahkan divisionId di akhir
const FolderFormModal = ({ isOpen, onClose, onSave, folderToEdit, parentId, divisionId }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = folderToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      setName(isEditMode ? folderToEdit.name : '');
      setError(null);
    }
  }, [folderToEdit, isOpen, isEditMode]);

// GANTI FUNGSI LAMA DENGAN YANG INI
const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        // 1. Memastikan folderToEdit dan ID-nya ada sebelum melanjutkan
        if (!folderToEdit || !folderToEdit.id) {
          throw new Error('Folder ID tidak ditemukan, gagal memperbarui.');
        }

        // 2. Siapkan data HANYA dengan nama baru untuk dikirim
        const folderData = {
          name: name,
        };

        // 3. Panggil API dengan URL yang dijamin benar
        await apiClient.put(`/admin/folders/${folderToEdit.id}`, folderData);

      } else {
        // Logika untuk membuat folder baru (ini sudah benar)
        const folderData = {
          name: name,
          parent_id: parentId,
        };
        if (divisionId) {
          folderData.division_id = divisionId;
        }
        await apiClient.post('/admin/folders', folderData);
      }
      
      onSave();
      onClose();

    } catch (err) {
      const errorMessage = err.response?.data?.errors?.name?.[0] || err.response?.data?.message || err.message || 'Terjadi kesalahan.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Ubah Nama Folder' : 'Buat Folder Baru'}>
      <form onSubmit={handleSubmit} className="divisi-form">
        <div className="form-group">
          <label htmlFor="folder-name">Nama Folder</label>
          <input
            id="folder-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Laporan Bulanan"
            required
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FolderFormModal;
