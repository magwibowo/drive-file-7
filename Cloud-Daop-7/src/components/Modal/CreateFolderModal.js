// src/components/Modal/CreateFolderModal.js
import React, { useState } from 'react';
import { createFolder } from '../../services/api'; // Menggunakan fungsi createFolder dari api.js

const CreateFolderModal = ({ isOpen, onClose, currentFolderId, onFolderCreated }) => {
    const [folderName, setFolderName] = useState('');
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // State untuk loading

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!folderName.trim()) {   
            setError('Nama folder tidak boleh kosong.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await createFolder(folderName, currentFolderId);
            onFolderCreated(); // Panggil fungsi untuk refresh data di halaman utama
            handleClose();
        } catch (err) {
            // Menampilkan pesan error validasi dari backend
            if (err.response && err.response.status === 422) {
                setError(err.response.data.errors.name[0]);
            } else {
                setError(err.response?.data?.message || 'Gagal membuat folder.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFolderName('');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Buat Folder Baru</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        placeholder="Nama Folder"
                        className="form-input"
                        autoFocus // Otomatis fokus ke input saat modal terbuka
                    />
                    {error && <p className="text-danger mt-2">{error}</p>}
                    <div className="modal-actions">
                        <button type="button" onClick={handleClose} className="btn-secondary" disabled={isSubmitting}>
                            Batal
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateFolderModal;