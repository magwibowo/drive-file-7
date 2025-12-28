import React, { useState } from 'react';
import Modal from '../Modal/Modal';
import { FaSave, FaTimes, FaExclamationTriangle, FaClipboardList, FaSyncAlt, FaBan, FaFile } from 'react-icons/fa';
import './BatchConflictModal.css';

const BatchConflictModal = ({ isOpen, onClose, conflictedFiles, onResolve }) => {
    const [viewMode, setViewMode] = useState('initial'); // 'initial' atau 'detailed'
    const [fileDecisions, setFileDecisions] = useState(() => {
        const initial = {};
        conflictedFiles.forEach(cf => {
            initial[cf.id] = { action: 'skip', newName: '' };
        });
        return initial;
    });

    const handleActionChange = (fileId, action) => {
        setFileDecisions(prev => ({
            ...prev,
            [fileId]: { ...prev[fileId], action }
        }));
    };

    const handleNewNameChange = (fileId, newName) => {
        setFileDecisions(prev => ({
            ...prev,
            [fileId]: { ...prev[fileId], newName }
        }));
    };

    const handleChoosePerFile = () => {
        setViewMode('detailed');
    };

    const handleApply = () => {
        onResolve(fileDecisions);
        onClose();
        setViewMode('initial');
    };

    const handleSkipAll = () => {
        onClose();
        setViewMode('initial');
    };

    const handleOverwriteAll = () => {
        const allOverwrite = {};
        conflictedFiles.forEach(cf => {
            allOverwrite[cf.id] = { action: 'overwrite', newName: '' };
        });
        onResolve(allOverwrite);
        onClose();
        setViewMode('initial');
    };

    const handleRenameAll = () => {
        const allRename = {};
        conflictedFiles.forEach(cf => {
            allRename[cf.id] = { action: 'auto_rename', newName: '' };
        });
        onResolve(allRename);
        onClose();
        setViewMode('initial');
    };

    const handleBack = () => {
        setViewMode('initial');
    };

    // Cek apakah nama file conflict dengan file yang sudah ada
    const checkNameConflict = (fileName) => {
        return conflictedFiles.some(cf => cf.file.name.toLowerCase() === fileName.toLowerCase());
    };

    // Validasi apakah semua keputusan sudah valid
    const isAllDecisionsValid = () => {
        return conflictedFiles.every(cf => {
            const decision = fileDecisions[cf.id];
            
            // Jika action masih 'skip' (default), berarti belum dipilih
            if (!decision || decision.action === 'skip') {
                return false;
            }
            
            // Jika action 'rename', harus ada newName dan tidak boleh conflict
            if (decision.action === 'rename') {
                if (!decision.newName || decision.newName.trim() === '') {
                    return false;
                }
                // Cek apakah nama baru conflict dengan file yang sudah ada
                if (checkNameConflict(decision.newName.trim())) {
                    return false;
                }
            }
            
            return true;
        });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Konflik Nama File">
            <div className="batch-conflict-modal">
                <div className="conflict-warning">
                    <FaExclamationTriangle className="warning-icon" />
                    <p>
                        {conflictedFiles.length} file memiliki nama yang sama dengan file yang sudah ada.
                    </p>
                </div>

                {viewMode === 'initial' ? (
                    // Initial View - 4 Pilihan Utama
                    <div className="initial-options">
                        <p className="options-title">Apa yang ingin Anda lakukan?</p>
                        
                        <div className="option-cards">
                            <button className="option-card" onClick={handleChoosePerFile}>
                                <div className="option-icon"><FaClipboardList /></div>
                                <div className="option-content">
                                    <h3>Pilih Per File</h3>
                                    <p>Tentukan aksi untuk setiap file</p>
                                </div>
                            </button>

                            <button className="option-card danger" onClick={handleOverwriteAll}>
                                <div className="option-icon"><FaSyncAlt /></div>
                                <div className="option-content">
                                    <h3>Timpa Semua</h3>
                                    <p>Ganti semua file lama dengan yang baru</p>
                                </div>
                            </button>

                            <button className="option-card success" onClick={handleRenameAll}>
                                <div className="option-icon"><FaSave /></div>
                                <div className="option-content">
                                    <h3>Simpan Baru Semua</h3>
                                    <p>Auto-rename: File(1).png, File(2).png</p>
                                </div>
                            </button>

                            <button className="option-card" onClick={handleSkipAll}>
                                <div className="option-icon"><FaBan /></div>
                                <div className="option-content">
                                    <h3>Lewati Semua</h3>
                                    <p>Batalkan upload file yang conflict</p>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    // Detailed View - Per File Selection
                    <>
                        <div className="conflict-files-list">
                            {conflictedFiles.map(cf => (
                                <div key={cf.id} className="conflict-file-item">
                                    <div className="file-info">
                                        <FaFile className="file-icon" />
                                        <div className="file-info-content">
                                            <strong>{cf.file.name}</strong>
                                            <span className="file-message">{cf.message}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="file-actions">
                                        <div className="action-buttons">
                                            <button
                                                type="button"
                                                className={`action-btn skip-btn ${fileDecisions[cf.id]?.action === 'skip' ? 'active' : ''}`}
                                                onClick={() => handleActionChange(cf.id, 'skip')}
                                            >
                                                Lewati
                                            </button>
                                            <button
                                                type="button"
                                                className={`action-btn overwrite-btn ${fileDecisions[cf.id]?.action === 'overwrite' ? 'active' : ''}`}
                                                onClick={() => handleActionChange(cf.id, 'overwrite')}
                                            >
                                                Timpa
                                            </button>
                                            <button
                                                type="button"
                                                className={`action-btn rename-auto-btn ${fileDecisions[cf.id]?.action === 'auto_rename' ? 'active' : ''}`}
                                                onClick={() => handleActionChange(cf.id, 'auto_rename')}
                                            >
                                                Simpan Baru
                                            </button>
                                            <button
                                                type="button"
                                                className={`action-btn rename-btn ${fileDecisions[cf.id]?.action === 'rename' ? 'active' : ''}`}
                                                onClick={() => { handleActionChange(cf.id, 'rename'); handleNewNameChange(cf.id, ''); }}
                                            >
                                                Ganti Nama
                                            </button>
                                        </div>

                                        {fileDecisions[cf.id]?.action === 'rename' && fileDecisions[cf.id]?.newName !== undefined && (
                                            <>
                                                <input
                                                    type="text"
                                                    placeholder="Masukkan nama file baru"
                                                    value={fileDecisions[cf.id]?.newName || ''}
                                                    onChange={(e) => handleNewNameChange(cf.id, e.target.value)}
                                                    className={`rename-input ${
                                                        fileDecisions[cf.id]?.newName && 
                                                        checkNameConflict(fileDecisions[cf.id]?.newName.trim()) 
                                                        ? 'error' : ''
                                                    }`}
                                                />
                                                {fileDecisions[cf.id]?.newName && checkNameConflict(fileDecisions[cf.id]?.newName.trim()) && (
                                                    <span className="rename-error">
                                                        <FaExclamationTriangle /> Nama file sudah ada, gunakan nama lain
                                                    </span>
                                                )}
                                                {fileDecisions[cf.id]?.action === 'rename' && !fileDecisions[cf.id]?.newName?.trim() && (
                                                    <span className="rename-warning">
                                                        Nama file harus diisi
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="batch-actions">
                            <button onClick={handleBack} className="modal-button cancel-button">
                                <FaTimes /> Kembali
                            </button>
                            <button 
                                onClick={handleApply} 
                                className="modal-button confirm-button"
                                disabled={!isAllDecisionsValid()}
                            >
                                <FaSave /> Terapkan
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default BatchConflictModal;
