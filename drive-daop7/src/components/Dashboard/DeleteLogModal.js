import React, { useState } from 'react';
import Modal from '../Modal/Modal';
import './DeleteLogModal.css';

const DeleteLogModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
}) => {
    const [selectedRange, setSelectedRange] = useState('1_day');

    if (!isOpen) return null;

    const handleDelete = () => {
        onConfirm(selectedRange);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Hapus Log">
            <div className="delete-log-content">
                <p>Pilih rentang waktu untuk menghapus log:</p>
                <div className="delete-options">
                    <select value={selectedRange} onChange={(e) => setSelectedRange(e.target.value)} className="form-select">
                        <option value="1_day">1 Hari</option>
                        <option value="3_days">3 Hari</option>
                        <option value="1_week">1 Minggu</option>
                        <option value="1_month">1 Bulan</option>
                        <option value="1_year">1 Tahun</option>
                        <option value="all">Hapus Semua</option>
                    </select>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Batal
                    </button>
                    <button type="button" onClick={handleDelete} className="btn btn-danger">
                        Hapus
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteLogModal;
