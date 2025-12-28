// src/components/Dashboard/DivisiFormModal.js

import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api';
import Modal from '../Modal/Modal'; 
import './DivisiFormModal.css';

const DivisiFormModal = ({ isOpen, onClose, onSave, divisionToEdit }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditMode = divisionToEdit !== null;

    useEffect(() => {
        // Jika dalam mode edit, isi form dengan data yang ada
        if (isEditMode) {
            setName(divisionToEdit.name);
        } else {
            // Jika mode tambah, kosongkan form
            setName('');
        }
    }, [divisionToEdit, isOpen, isEditMode]);  // Reset form setiap kali modal dibuka

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const divisionData = { name };

        try {
            if (isEditMode) {
                // Panggil API untuk update
                await apiClient.put(`/admin/divisions/${divisionToEdit.id}`, divisionData);
            } else {
                // Panggil API untuk membuat baru
                await apiClient.post('/admin/divisions', divisionData);
            }
            onSave(); // Beri tahu halaman utama untuk refresh data
            onClose(); // Tutup modal
        } catch (err) {
            const errorMessage = err.response?.data?.errors?.name?.[0] || 'Terjadi kesalahan.';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Divisi' : 'Tambah Divisi Baru'}>
            <form onSubmit={handleSubmit} className="divisi-form">
                <div className="form-group">
                    <label htmlFor="division-name">Nama Divisi</label>
                    <input
                        id="division-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Pemasaran"
                        required
                    />
                </div>
                
                {error && <p className="error-message">{error}</p>}

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                        Batal
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default DivisiFormModal;