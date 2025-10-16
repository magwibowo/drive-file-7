// src/pages/TrashPage.js

import React, { useState, useEffect, useMemo } from 'react';
import { getTrashedFiles, restoreFile, forceDeleteFile, getDivisions } from '../services/api';
import FilterBar from '../components/FilterBar/FilterBar';
import { useAuth } from '../context/AuthContext'; // Use useAuth hook
import './DashboardView.css';
import './TrashPage.css';

// Impor komponen
import Modal from '../components/Modal/Modal';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import Notification from '../components/Notification/Notification';
import { FaTrash, FaUndo, FaSave, FaTimes } from 'react-icons/fa';

const TrashPage = () => {
    const { user } = useAuth(); // Get user from useAuth hook

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fileType, setFileType] = useState('');
    const [modifiedDate, setModifiedDate] = useState('');
    const [ownerSearch, setOwnerSearch] = useState('');
    const [divisions, setDivisions] = useState([]);
    const [divisionFilter, setDivisionFilter] = useState('');

    // State untuk modal konfirmasi
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, file: null });
    const [overwriteModal, setOverwriteModal] = useState({ isOpen: false, file: null, message: '' });
    const [renameModal, setRenameModal] = useState({ isOpen: false, file: null, newName: '', extension: '' });

    const [notification, setNotification] = useState({ isOpen: false, message: '', type: '' });

    const fetchTrashedFiles = async () => {
        setLoading(true);
        try {
            const response = await getTrashedFiles();
            setFiles(response.data);
        } catch (error) {
            console.error('Could not fetch trashed files:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrashedFiles();
        const fetchDivisionsData = async () => {
            try {
                const response = await getDivisions();
                setDivisions(response.data);
            } catch (error) {
                console.error('Failed to fetch divisions:', error);
            }
        };
        fetchDivisionsData();
    }, []);

    const filteredFiles = useMemo(() => {
        let currentFiles = [...files];

        // Apply owner search filter
        if (ownerSearch) {
            currentFiles = currentFiles.filter(file =>
                (file.uploader?.name ?? '').toLowerCase().includes(ownerSearch.toLowerCase())
            );
        }

        // Apply file type filter
        if (fileType) {
            currentFiles = currentFiles.filter(file => {
                const extension = file.nama_file_asli.split('.').pop().toLowerCase();
                if (fileType === 'doc') return ['doc', 'docx'].includes(extension);
                if (fileType === 'xls') return ['xls', 'xlsx'].includes(extension);
                if (fileType === 'jpg') return ['jpg', 'jpeg'].includes(extension);
                return extension === fileType;
            });
        }

        // Apply modified date filter (using deleted_at as proxy for modification in trash)
        if (modifiedDate) {
            currentFiles = currentFiles.filter(file => {
                const fileDate = new Date(file.deleted_at);
                const now = new Date();
                now.setHours(0, 0, 0, 0); // Normalize to start of day

                if (modifiedDate === 'today') {
                    return fileDate.toDateString() === now.toDateString();
                } else if (modifiedDate === '7days') {
                    const sevenDaysAgo = new Date(now);
                    sevenDaysAgo.setDate(now.getDate() - 7);
                    return fileDate >= sevenDaysAgo;
                } else if (modifiedDate === '30days') {
                    const thirtyDaysAgo = new Date(now);
                    thirtyDaysAgo.setDate(now.getDate() - 30);
                    return fileDate >= thirtyDaysAgo;
                } else if (modifiedDate === '1year') {
                    const oneYearAgo = new Date(now);
                    oneYearAgo.setFullYear(now.getFullYear() - 1);
                    return fileDate >= oneYearAgo;
                }
                return true;
            });
        }

        // Apply division filter
        if (divisionFilter) {
            currentFiles = currentFiles.filter(file =>
                file.division?.id === parseInt(divisionFilter)
            );
        }

        return currentFiles;
    }, [files, fileType, modifiedDate, ownerSearch, divisionFilter, divisions]); // Removed sort from dependency array

    const closeNotification = () => setNotification({ isOpen: false, message: '', type: '' });

    // --- Logika Hapus Permanen ---
    const handleDeleteClick = (file) => {
        setDeleteModal({ isOpen: true, file });
    };

    const confirmForceDelete = async () => {
        if (!deleteModal.file) return;
        try {
            await forceDeleteFile(deleteModal.file.id);
            setNotification({ isOpen: true, message: 'File berhasil dihapus permanen.', type: 'success' });
            fetchTrashedFiles();
        } catch (error) {
            setNotification({ isOpen: true, message: 'Gagal menghapus file.', type: 'error' });
        } finally {
            setDeleteModal({ isOpen: false, file: null });
        }
    };

    // --- Logika Restore & Konflik ---
    const handleRestoreClick = async (file) => {
        executeRestore(file.id);
    };

    const handleRename = () => {
        const fileToRename = overwriteModal.file;
        if (!fileToRename) return;

        const originalName = fileToRename.nama_file_asli;
        const lastDotIndex = originalName.lastIndexOf('.');
        
        let baseName = originalName;
        let extension = '';

        if (lastDotIndex > 0 && lastDotIndex < originalName.length - 1) {
            baseName = originalName.substring(0, lastDotIndex);
            extension = originalName.substring(lastDotIndex);
        }

        setRenameModal({ isOpen: true, file: fileToRename, newName: baseName, extension: extension });
        setOverwriteModal({ isOpen: false, file: null, message: '' });
    };

    const executeRestore = async (fileId, options = {}) => {
        try {
            await restoreFile(fileId, options);
            setNotification({ isOpen: true, message: 'File berhasil dipulihkan.', type: 'success' });
            fetchTrashedFiles();
            setOverwriteModal({ isOpen: false, file: null, message: '' });
            setRenameModal({ isOpen: false, file: null, newName: '', extension: '' });
        } catch (error) {
            if (error.response && error.response.status === 409) {
                const file = files.find(f => f.id === fileId);
                setOverwriteModal({ isOpen: true, file: file, message: error.response.data.message });
            } else {
                setNotification({ isOpen: true, message: 'Gagal memulihkan file.', type: 'error' });
                setOverwriteModal({ isOpen: false, file: null, message: '' });
            }
        }
    };

    const confirmOverwrite = () => {
        executeRestore(overwriteModal.file.id, { overwrite: true });
    };

    const confirmRename = () => {
        if (!renameModal.newName.trim()) {
            setNotification({ isOpen: true, message: 'Nama file tidak boleh kosong.', type: 'error' });
            return;
        }
        const finalNewName = renameModal.newName.trim() + renameModal.extension;
        if (finalNewName === renameModal.file.nama_file_asli) {
            setNotification({ isOpen: true, message: 'Nama file masih sama, silahkan diubah kembali.', type: 'error' });
            return;
        }
        executeRestore(renameModal.file.id, { newName: finalNewName });
    };

    if (loading) return <div>Loading trashed files...</div>;

    return (
        <div className="division-dashboard">
            <div className="dashboard-toolbar"><h1>Sampah</h1></div>
            <FilterBar
                onFileTypeChange={setFileType}
                onModifiedDateChange={setModifiedDate}
                onOwnerSearch={setOwnerSearch}
                userRole={user?.role?.id}
                divisions={divisions}
                onDivisionChange={setDivisionFilter}
            />
            <div className="file-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Pemilik</th>
                            <th>Tanggal Dihapus</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFiles.map(file => (
                            <tr key={file.id}>
                                <td>{file.nama_file_asli}</td>
                                <td>{file.uploader?.name || 'Pengguna Dihapus'}</td>
                                <td>{new Date(file.deleted_at).toLocaleDateString('id-ID')}</td>
                                <td>
                                    <button onClick={() => handleRestoreClick(file)} className="action-button restore-button">Pulihkan</button>
                                    <button onClick={() => handleDeleteClick(file)} className="action-button delete-button">Hapus Permanen</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, file: null })}
                onConfirm={confirmForceDelete}
                message={`PERINGATAN: File "${deleteModal.file?.nama_file_asli}" akan dihapus permanen. Lanjutkan?`}
                confirmText="Hapus Permanen"
                isDanger={true}
                confirmIcon={FaTrash}
            />

            <ConfirmationModal
                isOpen={overwriteModal.isOpen}
                onClose={() => setOverwriteModal({ isOpen: false, file: null, message: '' })}
                onConfirm={confirmOverwrite}
                message={overwriteModal.message}
                confirmText="Timpa File"
                isDanger={true}
                confirmIcon={FaSave}
                customActions={
                    <button onClick={handleRename} className="modal-button cancel-button">
                        <FaUndo /> Ganti Nama & Pulihkan
                    </button>
                }
            />

            <Modal isOpen={renameModal.isOpen} onClose={() => setRenameModal({ isOpen: false, file: null, newName: '', extension: '' })} title="Ganti Nama & Pulihkan">
                <div>
                    <p>File akan dipulihkan dengan nama baru:</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input 
                            type="text" 
                            value={renameModal.newName}
                            onChange={(e) => setRenameModal({ ...renameModal, newName: e.target.value })}
                            className="form-input w-full mt-2"
                        />
                        {renameModal.extension && <span className="file-extension mt-2">{renameModal.extension}</span>}
                    </div>
                    <div className="confirmation-modal-actions">
                        <button type="button" className="modal-button cancel-button" onClick={() => setRenameModal({ isOpen: false, file: null, newName: '', extension: '' })}>
                            <FaTimes /> Batal
                        </button>
                        <button type="button" className="modal-button confirm-button" onClick={confirmRename}>
                            <FaSave /> Simpan dengan Nama Baru
                        </button>
                    </div>
                </div>
            </Modal>

            {notification.isOpen && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={closeNotification}
                />
            )}
        </div>
    );
};

export default TrashPage;