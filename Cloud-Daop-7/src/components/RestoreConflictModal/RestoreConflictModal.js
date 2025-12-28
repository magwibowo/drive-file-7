import React, { useState } from 'react';
import Modal from '../Modal/Modal';
import { FaSave, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import './RestoreConflictModal.css';

const RestoreConflictModal = ({ isOpen, onClose, file, message, onResolve }) => {
    const [action, setAction] = useState('skip');
    const [newName, setNewName] = useState('');

    const handleApply = () => {
        if (action === 'rename' && !newName.trim()) {
            alert('Nama file tidak boleh kosong');
            return;
        }
        onResolve(action, newName);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Konflik Nama File">
            <div className="restore-conflict-modal">
                <div className="conflict-warning">
                    <FaExclamationTriangle className="warning-icon" />
                    <div>
                        <p><strong>{file?.nama_file_asli}</strong></p>
                        <p className="file-message">{message}</p>
                    </div>
                </div>

                <div className="action-section">
                    <p className="action-label">Pilih tindakan:</p>
                    <div className="action-buttons">
                        <button
                            type="button"
                            className={`action-btn skip-btn ${action === 'skip' ? 'active' : ''}`}
                            onClick={() => setAction('skip')}
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            className={`action-btn overwrite-btn ${action === 'overwrite' ? 'active' : ''}`}
                            onClick={() => setAction('overwrite')}
                        >
                            Timpa File Lama
                        </button>
                        <button
                            type="button"
                            className={`action-btn rename-btn ${action === 'rename' ? 'active' : ''}`}
                            onClick={() => setAction('rename')}
                        >
                            Ganti Nama
                        </button>
                    </div>

                    {action === 'rename' && (
                        <div className="rename-section">
                            <input
                                type="text"
                                placeholder="Masukkan nama file baru"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="rename-input"
                            />
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button onClick={onClose} className="modal-button cancel-button">
                        Tutup
                    </button>
                    <button onClick={handleApply} className="modal-button confirm-button">
                        <FaSave /> Terapkan
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default RestoreConflictModal;
