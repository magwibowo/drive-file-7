// src/components/RenameModal/RenameModal.js
import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import { FaSave, FaTimes } from 'react-icons/fa';
import './RenameModal.css';

const RenameModal = ({ isOpen, onClose, onRename, file }) => {
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (file) {
            setNewName(file.nama_file_asli);
        }
    }, [file]);

    if (!isOpen) return null;

    const handleRename = () => {
        if (file && newName.trim()) {
            onRename(file, newName.trim());
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ganti Nama File">
            <div className="rename-modal-body">
                <p>Masukkan nama file baru untuk "{file?.nama_file_asli}":</p>
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="form-input w-full mt-2"
                />
                <div className="confirmation-modal-actions">
                    <button type="button" className="modal-button cancel-button" onClick={onClose}>
                        <FaTimes /> Batal
                    </button>
                    <button type="button" className="modal-button confirm-button" onClick={handleRename}>
                        <FaSave /> Simpan
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default RenameModal;
