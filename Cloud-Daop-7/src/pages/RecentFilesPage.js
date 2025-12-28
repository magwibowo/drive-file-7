// src/pages/RecentFilesPage.js
import React, { useState, useMemo, useEffect } from 'react';
import { getAllFiles, getDivisions, toggleFavorite, downloadFile, deleteFile, renameFile } from '../services/api';
import useFileFetcher from '../hooks/useFileFetcher';
import FilterBar from '../components/FilterBar/FilterBar';
import { useAuth } from '../context/AuthContext';
import { FaStar, FaRegStar, FaDownload, FaTrash, FaEye, FaTimes, FaPencilAlt } from 'react-icons/fa';
import getFileIcon from '../utils/fileIcons';
import { truncateFilename } from '../utils/formatters';
import FileCard from '../components/FileCard/FileCard';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import FilePreviewModal from '../components/FilePreviewModal/FilePreviewModal';
import Notification from '../components/Notification/Notification';
import Modal from '../components/Modal/Modal';
import './DashboardView.css';

const RecentFilesPage = () => {
    const { files, setFiles, loading, refresh: fetchFiles } = useFileFetcher(getAllFiles);
    const { user, searchQuery } = useAuth();

    const [fileType, setFileType] = useState('');
    const [modifiedDate, setModifiedDate] = useState('');
    const [ownerSearch, setOwnerSearch] = useState('');
    const [divisions, setDivisions] = useState([]);
    const [divisionFilter, setDivisionFilter] = useState('');
    const [selectedFileIds, setSelectedFileIds] = useState([]);
    const [viewMode, setViewMode] = useState('list');
    const [notification, setNotification] = useState({ isOpen: false, message: '', type: '' });

    // State for modals
    const [fileToDelete, setFileToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [renameModal, setRenameModal] = useState({ isOpen: false, file: null, newName: '', extension: '' });

    useEffect(() => {
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

    const filteredAndSortedFiles = useMemo(() => {
        let currentFiles = [...files];

        // Apply global search query first
        if (searchQuery) {
            currentFiles = currentFiles.filter(file =>
                file.nama_file_asli.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Then apply local filters
        if (ownerSearch) {
            currentFiles = currentFiles.filter(file =>
                (file.uploader?.name ?? '').toLowerCase().includes(ownerSearch.toLowerCase())
            );
        }
        if (fileType) {
            currentFiles = currentFiles.filter(file => {
                const extension = file.nama_file_asli.split('.').pop().toLowerCase();
                if (fileType === 'doc') return ['doc', 'docx'].includes(extension);
                if (fileType === 'xls') return ['xls', 'xlsx'].includes(extension);
                if (fileType === 'jpg') return ['jpg', 'jpeg'].includes(extension);
                return extension === fileType;
            });
        }
        if (modifiedDate) {
            currentFiles = currentFiles.filter(file => {
                const fileDate = new Date(file.updated_at);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                if (modifiedDate === 'today') return fileDate.toDateString() === now.toDateString();
                if (modifiedDate === '7days') {
                    const sevenDaysAgo = new Date(now);
                    sevenDaysAgo.setDate(now.getDate() - 7);
                    return fileDate >= sevenDaysAgo;
                }
                if (modifiedDate === '30days') {
                    const thirtyDaysAgo = new Date(now);
                    thirtyDaysAgo.setDate(now.getDate() - 30);
                    return fileDate >= thirtyDaysAgo;
                }
                if (modifiedDate === '1year') {
                    const oneYearAgo = new Date(now);
                    oneYearAgo.setFullYear(now.getFullYear() - 1);
                    return fileDate >= oneYearAgo;
                }
                return true;
            });
        }
        if (divisionFilter) {
            currentFiles = currentFiles.filter(file =>
                file.division?.id === parseInt(divisionFilter)
            );
        }

        // Finally, sort by most recent
        return currentFiles.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    }, [files, fileType, modifiedDate, ownerSearch, divisionFilter, searchQuery]);

    const getRelativeTimeGroup = (date) => {
        const now = new Date();
        const fileDate = new Date(date);

        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const startOfWeek = new Date(startOfToday);
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startOfWeek.setDate(diff);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        if (fileDate >= startOfToday) return "Hari ini";
        if (fileDate >= startOfWeek) return "Minggu ini";
        if (fileDate >= startOfMonth) return "Bulan ini";
        if (fileDate >= startOfYear) return "Tahun ini";
        return "Lebih lama";
    };

    const groupedFiles = useMemo(() => {
        const groups = {
            "Hari ini": [],
            "Minggu ini": [],
            "Bulan ini": [],
            "Tahun ini": [],
            "Lebih lama": [],
        };

        filteredAndSortedFiles.forEach(file => {
            const group = getRelativeTimeGroup(file.updated_at);
            if (groups[group]) {
                groups[group].push(file);
            }
        });

        return groups;
    }, [filteredAndSortedFiles]);

    // Handlers from DashboardPage
    const handleDownload = async (file) => {
        try {
            const response = await downloadFile(file.id);
            const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.nama_file_asli);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error.response ? error.response.data : error.message);
            setNotification({ isOpen: true, message: 'Gagal mengunduh file.', type: 'error' });
        }
    };

    const handleDeleteClick = (file) => {
        setFileToDelete(file);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!fileToDelete) return;
        try {
            await deleteFile(fileToDelete.id);
            setNotification({ isOpen: true, message: 'File berhasil dipindahkan ke sampah.', type: 'success' });
            fetchFiles(); // Refresh files
        } catch (error) {
            setNotification({ isOpen: true, message: 'Gagal menghapus file.', type: 'error' });
        } finally {
            setIsDeleteModalOpen(false);
            setFileToDelete(null);
        }
    };

    const handleToggleFavorite = async (file) => {
        try {
            await toggleFavorite(file.id);
            setFiles(currentFiles =>
                currentFiles.map(f =>
                    f.id === file.id ? { ...f, is_favorited: !f.is_favorited } : f
                )
            );
        } catch (error) {
            console.error('Favorite toggle error:', error);
            setNotification({ isOpen: true, message: 'Gagal mengubah status favorit.', type: 'error' });
        }
    };

    const handlePreview = async (file) => {
        try {
            const response = await downloadFile(file.id);
            const fileUrl = window.URL.createObjectURL(response.data);
            setPreviewFile({ url: fileUrl, mime: file.tipe_file, name: file.nama_file_asli });
            setIsPreviewOpen(true);
        } catch (error) {
            setNotification({ isOpen: true, message: 'Gagal memuat pratinjau.', type: 'error' });
        }
    };

    const closePreview = () => {
        if (previewFile && previewFile.url) {
            window.URL.revokeObjectURL(previewFile.url);
        }
        setIsPreviewOpen(false);
        setPreviewFile(null);
    };

    const handleRenameClick = (file) => {
        const originalName = file.nama_file_asli;
        const lastDotIndex = originalName.lastIndexOf('.');
        let baseName = originalName;
        let extension = '';
        if (lastDotIndex > 0 && lastDotIndex < originalName.length - 1) {
            baseName = originalName.substring(0, lastDotIndex);
            extension = originalName.substring(lastDotIndex);
        }
        setRenameModal({ isOpen: true, file: file, newName: baseName, extension: extension });
    };

    const confirmRename = async () => {
        if (!renameModal.file || !renameModal.newName) return;
        try {
            const finalNewName = renameModal.newName.trim() + renameModal.extension;
            await renameFile(renameModal.file.id, finalNewName);
            setNotification({ isOpen: true, message: 'Nama file berhasil diubah.', type: 'success' });
            fetchFiles();
        } catch (error) {
            const message = error.response?.data?.message || 'Gagal mengubah nama file.';
            setNotification({ isOpen: true, message, type: 'error' });
        } finally {
            setRenameModal({ isOpen: false, file: null, newName: '', extension: '' });
        }
    };

    const handleFileSelect = (fileId) => {
        setSelectedFileIds(prevSelected => {
            if (prevSelected.includes(fileId)) {
                return prevSelected.filter(id => id !== fileId);
            } else {
                return [...prevSelected, fileId];
            }
        });
    };

    const handleSelectAllClick = () => {
        const allFileIds = filteredAndSortedFiles.map(file => file.id);
        setSelectedFileIds(allFileIds);
    };

    const handleBulkDownload = () => {
        selectedFileIds.forEach(fileId => {
            const fileToDownload = files.find(f => f.id === fileId);
            if (fileToDownload) handleDownload(fileToDownload);
        });
    };

    const handleBulkDelete = () => {
        setIsBulkDeleteModalOpen(true);
    };

    const confirmBulkDelete = async () => {
        const promises = selectedFileIds.map(id => deleteFile(id));
        try {
            await Promise.all(promises);
            setNotification({ isOpen: true, message: `${selectedFileIds.length} file berhasil dipindahkan ke sampah.`, type: 'success' });
            fetchFiles();
            setSelectedFileIds([]);
        } catch (error) {
            setNotification({ isOpen: true, message: 'Gagal menghapus beberapa file.', type: 'error' });
        } finally {
            setIsBulkDeleteModalOpen(false);
        }
    };

    if (loading) return <div>Loading files...</div>;

    return (
        <div className="division-dashboard">
            <div className="dashboard-toolbar">
                <h1>File Terbaru</h1>
            </div>
            <FilterBar
                onFileTypeChange={setFileType}
                onModifiedDateChange={setModifiedDate}
                onOwnerSearch={setOwnerSearch}
                userRole={user?.role?.id}
                divisions={divisions}
                onDivisionChange={setDivisionFilter}
            />
            <div className="controls-container">
                <div className="view-toggle" style={{ marginBottom: '1rem' }}>
                    <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''}>List</button>
                    <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}>Grid</button>
                </div>
                {selectedFileIds.length > 0 && (
                    <div className="action-toolbar">
                        <button className="action-button" onClick={() => setSelectedFileIds([])}><FaTimes /> ({selectedFileIds.length} dipilih)</button>
                        <button className="action-button" onClick={handleSelectAllClick}>Pilih Semua</button>
                        <button className="action-button" onClick={handleBulkDownload} disabled={selectedFileIds.length === 0}><FaDownload /></button>
                        <button className="action-button" onClick={handleBulkDelete} disabled={selectedFileIds.length === 0}><FaTrash /></button>
                        {selectedFileIds.length === 1 && (
                            <>
                                <button className="action-button" onClick={() => {
                                    const fileToPreview = files.find(f => f.id === selectedFileIds[0]);
                                    if (fileToPreview) handlePreview(fileToPreview);
                                }}><FaEye /></button>
                                <button className="action-button" onClick={() => {
                                    const fileToRename = files.find(f => f.id === selectedFileIds[0]);
                                    if (fileToRename) handleRenameClick(fileToRename);
                                }}><FaPencilAlt /></button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {viewMode === 'list' ? (
                <div className="file-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="col-nama">Nama</th>
                                <th>Pemilik</th>
                                <th>Tanggal diubah</th>
                                <th>Ukuran file</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(groupedFiles).map(([group, filesInGroup]) => (
                                filesInGroup.length > 0 && (
                                    <React.Fragment key={group}>
                                        <tr>
                                            <td colSpan="4" className="group-header">
                                                <strong>{group}</strong>
                                            </td>
                                        </tr>
                                        {filesInGroup.map(file => (
                                            <tr
                                                key={file.id}
                                                onClick={() => handleFileSelect(file.id)}
                                                className={selectedFileIds.includes(file.id) ? 'selected' : ''}
                                            >
                                                <td className="nama-cell">
                                                    <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(file); }} className="action-button favorite-button" title="Favorite">
                                                        {file.is_favorited ? <FaStar color="#ffc107" /> : <FaRegStar color="#6c757d" />}
                                                    </button>
                                                    <span className="file-icon">
                                                        {getFileIcon(file.tipe_file, file.nama_file_asli)}
                                                    </span>
                                                    <span title={file.nama_file_asli}>
                                                        {truncateFilename(file.nama_file_asli, 54)}
                                                    </span>
                                                </td>
                                                <td>{file.uploader ? file.uploader.name : 'User Dihapus'}</td>
                                                <td>{new Date(file.updated_at).toLocaleDateString('id-ID')}</td>
                                                <td>{(file.ukuran_file / 1024 / 1024).toFixed(2)} MB</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                )
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="stats-grid">
                    {filteredAndSortedFiles.map(file => (
                        <FileCard
                            key={file.id}
                            file={file}
                            onPreview={handlePreview}
                            onDownload={handleDownload}
                            onDelete={handleDeleteClick}
                            onToggleFavorite={handleToggleFavorite}
                            onRename={handleRenameClick}
                            onSelect={handleFileSelect}
                            isSelected={selectedFileIds.includes(file.id)}
                        />
                    ))}
                </div>
            )}

            {/* Modals and Notifications */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                message={`Apakah Anda yakin ingin menghapus file "${fileToDelete?.nama_file_asli}"?`}
                isDanger={true}
                confirmText="Hapus"
            />
            <ConfirmationModal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                onConfirm={confirmBulkDelete}
                message={`Apakah Anda yakin ingin menghapus ${selectedFileIds.length} file yang dipilih?`}
                isDanger={true}
                confirmText="Hapus Semua"
            />
            <Modal
                isOpen={renameModal.isOpen}
                onClose={() => setRenameModal({ ...renameModal, isOpen: false })}
                title="Ganti Nama File"
            >
                <div>
                    <p>Masukkan nama file baru untuk "{renameModal.file?.nama_file_asli}":</p>
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
                        <button type="button" className="modal-button cancel-button" onClick={() => setRenameModal({ ...renameModal, isOpen: false })}>Batal</button>
                        <button type="button" className="modal-button confirm-button" onClick={confirmRename}>Simpan</button>
                    </div>
                </div>
            </Modal>
            <FilePreviewModal
                isOpen={isPreviewOpen}
                onClose={closePreview}
                fileUrl={previewFile?.url}
                mimeType={previewFile?.mime}
                fileName={previewFile?.name}
            />
            {notification.isOpen && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification({ isOpen: false, message: '', type: '' })}
                />
            )}
        </div>
    );
};

export default RecentFilesPage;
