import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { downloadFile, deleteFile, toggleFavorite, uploadFile, renameFile, getDivisions } from '../services/api'; // Import getDivisions
import { getDivisionsWithFolders } from '../services/api';
import FolderCard from '../components/FolderCard/FolderCard';
import './DashboardView.css';

// Impor komponen
import Modal from '../components/Modal/Modal';
import FileUploadForm from '../components/FileUploadForm/FileUploadForm';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import Notification from '../components/Notification/Notification';
import FileCard from '../components/FileCard/FileCard';
import FilePreviewModal from '../components/FilePreviewModal/FilePreviewModal';
import SortControls from '../components/SortControls/SortControls';
import CustomDropdown from '../components/CustomDropdown/CustomDropdown';

import { FaPlus, FaDownload, FaTrash, FaStar, FaRegStar, FaEye, FaTimes, FaSave, FaPencilAlt, FaArrowLeft } from 'react-icons/fa'; // Import FaArrowLeft
import getFileIcon from '../utils/fileIcons';
import { truncateFilename } from '../utils/formatters';

// --- Komponen Dashboard untuk Super Admin ---

const SuperAdminDashboard = ({ onSelectDivision }) => {
    const { user } = useAuth();
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ isOpen: false, message: '', type: '' });

    useEffect(() => {
        const fetchDivisionsData = async () => {
            try {
                const response = await getDivisionsWithFolders();
                setDivisions(response.data);
            } catch (error) {
                console.error('Could not fetch divisions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDivisionsData();
    }, []);

    const handleDivisionSelect = (division) => {
        onSelectDivision(division);
    };

    if (loading) return <div>Loading data divisi...</div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>{user?.name} Dashboard</h1>
                <CustomDropdown
                    options={divisions}
                    onSelect={handleDivisionSelect}
                    triggerText="Pilih Divisi"
                />
            </div>
            {divisions.map(division => (
                <section key={division.id} style={{ marginBottom: '2rem' }}>
                    <h2>{division.name}</h2>
                    <div className="folders-grid">
                        {division.folders && division.folders.length > 0 ? (
                            division.folders.map(folder => (
                                <FolderCard key={folder.id} folder={folder} onClick={() => onSelectDivision(division)} />
                            ))
                        ) : (
                            <p style={{ color: '#888' }}>Belum ada folder di divisi ini.</p>
                        )}
                    </div>
                </section>
            ))}
            
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


// --- Komponen Dashboard untuk Admin/User Devisi ---

const DivisionUserDashboard = ({ viewingAsAdminForDivision, onExitAdminView }) => {
    const { user, searchQuery, loading: authLoading } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [isFilesLoading, setIsFilesLoading] = useState(true);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [notification, setNotification] = useState({ isOpen: false, message: '', type: '' });
    const [viewMode, setViewMode] = useState('list');
    const [previewFile, setPreviewFile] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [overwriteModal, setOverwriteModal] = useState({ isOpen: false, file: null, message: '' });
    const [renameModal, setRenameModal] = useState({ isOpen: false, file: null, newName: '', extension: '' });
    const [renameUploadModal, setRenameUploadModal] = useState({ isOpen: false, file: null, newName: '' });
    const [sortBy, setSortBy] = useState('updated_at');
    const [sortOrder, setSortOrder] = useState('desc');
    const [selectedFileIds, setSelectedFileIds] = useState([]);

    const fetchFiles = React.useCallback(async () => {
        setIsFilesLoading(true);
        try {
            const folder_id = searchParams.get('folder_id');
            let url = folder_id ? `/files?folder_id=${folder_id}` : '/files';
            
            // Jika super admin sedang melihat divisi lain, tambahkan division_id ke URL
            if (viewingAsAdminForDivision) {
                const separator = url.includes('?') ? '&' : '?';
                url += `${separator}division_id=${viewingAsAdminForDivision.id}`;
            }

            const res = await fetch(process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}${url}` : `http://localhost:8000/api${url}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            const data = await res.json();
            setFolders(data.folders || []);
            setFiles(data.files || []);
            setBreadcrumbs(data.breadcrumbs || []);
        } catch (error) {
            console.error('Could not fetch items:', error);
        } finally {
            setIsFilesLoading(false);
        }
    }, [searchParams, viewingAsAdminForDivision]);

    useEffect(() => {
        if (!authLoading && user) {
            const fid = searchParams.get('folder_id');
            setCurrentFolderId(fid ? parseInt(fid, 10) : null);
            fetchFiles();
        }
    }, [authLoading, user, searchParams, fetchFiles]);

    // ... (sisa fungsi-fungsi handler seperti handleDownload, handleDeleteClick, dll. tetap sama) ...
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

    const handleToggleFavorite = async (file) => {
        try {
            await toggleFavorite(file.id);
            setFiles(currentFiles =>
                currentFiles.map(f =>
                    f.id === file.id ? { ...f, is_favorited: !f.is_favorited } : f
                )
            );
        } catch (error) {
            console.error('Favorite toggle error:', error.response ? error.response.data : error.message);
            setNotification({ isOpen: true, message: 'Gagal mengubah status favorit.', type: 'error' });
        }
    };
    
    const handlePreview = async (file) => {
        try {
            console.log(`Mencoba memuat pratinjau untuk file: ${file.nama_file_asli}`);
            const response = await downloadFile(file.id);
            if (!response) {
                throw new Error("Tidak ada respons dari server.");
            }
            if (!(response.data instanceof Blob)) {
                 throw new Error("Server tidak mengembalikan data file. Kemungkinan terjadi error di backend.");
            }
            if (response.data.size === 0) {
                throw new Error("Data file kosong atau tidak valid dari server.");
            }
            
            console.log("Data file berhasil diterima, membuat URL sementara...");
            const fileUrl = window.URL.createObjectURL(response.data);
            
            setPreviewFile({ url: fileUrl, mime: file.tipe_file, name: file.nama_file_asli });
            setIsPreviewOpen(true);

        } catch (error) {
            console.error('GAGAL MEMUAT PRATINJAU:', error);
            
            let errorMessage = 'Gagal memuat data pratinjau. Silakan coba lagi.';
            if (error.response) {
                errorMessage = `Gagal memuat pratinjau: Server merespons dengan status ${error.response.status}.`;
            } else {
                errorMessage = `Gagal memuat pratinjau: ${error.message}`;
            }

            setNotification({ isOpen: true, message: errorMessage, type: 'error' });
        }
    };

    const closePreview = () => {
        if (previewFile && previewFile.url) {
            window.URL.revokeObjectURL(previewFile.url);
        }
        setIsPreviewOpen(false);
        setPreviewFile(null);
    };

    const confirmDelete = async () => {
        if (!fileToDelete) return;
        try {
            await deleteFile(fileToDelete.id);
            setNotification({ isOpen: true, message: 'File berhasil dipindahkan ke sampah.', type: 'success' });
            fetchFiles();
        } catch (error) {
            console.error('Delete error:', error.response ? error.response.data : error.message);
            setNotification({ isOpen: true, message: 'Gagal menghapus file.', type: 'error' });
        } finally {
            setIsDeleteModalOpen(false);
            setFileToDelete(null);
        }
    };
    
    const handleUploadComplete = () => {
        setIsUploadModalOpen(false);
        fetchFiles();
        setNotification({ isOpen: true, message: 'File berhasil diunggah!', type: 'success' });
    };

    const handleConflict = (file, message) => {
        setOverwriteModal({ isOpen: true, file: file, message: message });
        setIsUploadModalOpen(false);
    };

    const handleRenameClick = (file) => {
        let targetFile = file;
        if (!file || !file.id) {
            const fileName = file?.file?.name || file?.name;
            if (fileName) {
                targetFile = files.find(f => f.nama_file_asli === fileName);
            }
        }
        if (!targetFile || !targetFile.id) {
            setNotification({ isOpen: true, message: 'File tidak ditemukan untuk diubah nama. Silakan refresh halaman setelah replace file.', type: 'error' });
            return;
        }

        const originalName = targetFile.nama_file_asli;
        const lastDotIndex = originalName.lastIndexOf('.');
        
        let baseName = originalName;
        let extension = '';

        if (lastDotIndex > 0 && lastDotIndex < originalName.length - 1) {
            baseName = originalName.substring(0, lastDotIndex);
            extension = originalName.substring(lastDotIndex);
        }

        setRenameModal({ isOpen: true, file: targetFile, newName: baseName, extension: extension });
    };

    const confirmRename = async () => {
        if (!renameModal.file || !renameModal.newName) return;
        try {
            const finalNewName = renameModal.newName.trim() + renameModal.extension;
            const response = await renameFile(renameModal.file.id, finalNewName);
            setFiles(currentFiles =>
                currentFiles.map(f => (f.id === renameModal.file.id ? response.data.file : f))
            );
            setNotification({ isOpen: true, message: 'Nama file berhasil diubah.', type: 'success' });
            setRenameModal({ isOpen: false, file: null, newName: '', extension: '' });
        } catch (error) {
            const message = error.response?.data?.message || 'Gagal mengubah nama file.';
            setNotification({ isOpen: true, message, type: 'error' });
        }
    };

    const handleSortChange = (column, order) => {
        setSortBy(column);
        setSortOrder(order);
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
        const allFileIds = sortedAndFilteredFiles.map(file => file.id);
        setSelectedFileIds(allFileIds);
    };

    const handleBulkDownload = () => {
        selectedFileIds.forEach(fileId => {
            const fileToDownload = files.find(f => f.id === fileId);
            if (fileToDownload) {
                handleDownload(fileToDownload);
            }
        });
    };

    const handleBulkDelete = () => {
        setIsBulkDeleteModalOpen(true);
    };

    const handleUploadError = (err) => {
        setIsUploadModalOpen(false); // Close the main upload modal
        if (err.response) {
            // Quota full error
            if (err.response.status === 403) {
                setNotification({ 
                    isOpen: true, 
                    message: err.response.data.message || 'Gagal: Kuota penyimpanan penuh.', 
                    type: 'error' 
                });
            } 
            // Other server-side errors
            else {
                setNotification({ 
                    isOpen: true, 
                    message: err.response.data.message || 'Gagal mengunggah file. Terjadi masalah di server.', 
                    type: 'error' 
                });
            }
        } else {
            // Network or other errors
            setNotification({ 
                isOpen: true, 
                message: 'Gagal mengunggah file. Periksa koneksi Anda.', 
                type: 'error' 
            });
        }
    };

    const confirmBulkDelete = async () => {
        const promises = selectedFileIds.map(id => deleteFile(id));
        try {
            await Promise.all(promises);
            setNotification({ isOpen: true, message: `${selectedFileIds.length} file berhasil dipindahkan ke sampah.`, type: 'success' });
            fetchFiles();
            setSelectedFileIds([]);
        } catch (error) {
            console.error('Bulk delete error:', error);
            setNotification({ isOpen: true, message: 'Gagal menghapus beberapa file.', type: 'error' });
        } finally {
            setIsBulkDeleteModalOpen(false);
        }
    };

const executeUpload = async (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options.newName) {
        formData.append('new_name', options.newName);
    }
    if (options.overwrite) {
        formData.append('overwrite', true);
    }

    try {
        const fid = searchParams.get('folder_id');
        if (fid) {
            formData.append('folder_id', fid);
        }

        // FIX: Tambahkan division_id jika super admin upload ke drive divisi lain
        if (viewingAsAdminForDivision) {
            formData.append('division_id', viewingAsAdminForDivision.id);
        }

        await uploadFile(formData, options);
        const successMessage = options.overwrite
            ? 'File berhasil ditimpa!'
            : (options.newName
                ? 'File berhasil diunggah dengan nama baru!'
                : 'File berhasil diunggah!');
        setNotification({ isOpen: true, message: successMessage, type: 'success' });
        fetchFiles();
    } catch (err) {
        if (err.response) {
            if (err.response.status === 409) {
                handleConflict(file, err.response.data.message);
            } else if (err.response.status === 403) {
                setNotification({
                    isOpen: true,
                    message: err.response.data.message || 'Gagal: Kuota penyimpanan penuh.',
                    type: 'error'
                });
            } else {
                console.error('Upload error:', err.response.data);
                setNotification({ isOpen: true, message: 'Gagal mengunggah file. Terjadi masalah di server.', type: 'error' });
            }
        } else {
            console.error('Upload error:', err.message);
            setNotification({ isOpen: true, message: 'Gagal mengunggah file. Periksa koneksi Anda.', type: 'error' });
        }
    }
};

    const confirmOverwrite = () => {
        executeUpload(overwriteModal.file, { overwrite: true });
        setOverwriteModal({ isOpen: false, file: null, message: '' });
    };

    const closeNotification = () => {
        setNotification({ isOpen: false, message: '', type: '' });
    };

    const sortedAndFilteredFiles = files
        .filter(file => file.nama_file_asli.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            let valA, valB;
            if (sortBy === 'nama_file_asli') {
                valA = a.nama_file_asli ? a.nama_file_asli.toLowerCase() : '';
                valB = b.nama_file_asli ? b.nama_file_asli.toLowerCase() : '';
            } else if (sortBy === 'uploader.name') {
                valA = a.uploader ? a.uploader.name.toLowerCase() : '';
                valB = b.uploader ? b.uploader.name.toLowerCase() : '';
            } else if (sortBy === 'updated_at') {
                valA = new Date(a.updated_at).getTime();
                valB = new Date(b.updated_at).getTime();
            }
            if (valA < valB) {
                return sortOrder === 'asc' ? -1 : 1;
            }
            if (valA > valB) {
                return sortOrder === 'asc' ? 1 : -1;
            }
            return 0;
        });

    if (authLoading) return <div>Loading user data...</div>;
    if (isFilesLoading) return <div>Loading files...</div>;

    const driveName = viewingAsAdminForDivision 
        ? `${viewingAsAdminForDivision.name} Drive` 
        : (user?.division?.name ? `${user.division.name} Drive` : 'My Drive');

    return (
        <div className="division-dashboard">
            <div className="dashboard-content">
                <div className="dashboard-toolbar">
                    {viewingAsAdminForDivision && (
                        <button onClick={onExitAdminView} className="back-button" style={{ marginRight: '1rem' }}>
                            <FaArrowLeft />
                        </button>
                    )}
                    <h1>{driveName}</h1>
                    <button className="upload-button" onClick={() => setIsUploadModalOpen(true)}>
                        <FaPlus size={14} /> <span>Tambah File</span>
                    </button>
                </div>

                <div className="controls-container">
                    <div className="view-toggle" style={{ marginBottom: '1rem' }}>
                        <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''}>List</button>
                        <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}>Grid</button>
                    </div>
                    {selectedFileIds.length > 0 ? (
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
                                        else setNotification({ isOpen: true, message: 'File yang ingin diganti namanya tidak ditemukan.', type: 'error' });
                                    }}><FaPencilAlt /></button>
                                </>
                            )}
                        </div>
                    ) : (
                        <SortControls sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} />
                    )}
                </div>

                <div className="breadcrumbs" style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                    <span className="breadcrumb-item" style={{ cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setSearchParams({}); setCurrentFolderId(null); }}>
                        {driveName}
                    </span>
                    {breadcrumbs.map((bc, idx) => (
                        <span key={bc.id} className="breadcrumb-item" style={{ cursor: 'pointer' }} onClick={() => { setSearchParams({ folder_id: bc.id }); setCurrentFolderId(bc.id); }}>
                            {' > '}{bc.name}
                        </span>
                    ))}
                </div>

                {folders && folders.length > 0 && (
                    <section className="folder-section">
                        <h2>Folders</h2>
                        <div className="folders-grid">
                            {folders.map((folder) => (
                                <FolderCard
                                    key={folder.id}
                                    folder={folder}
                                    onClick={() => {
                                        setCurrentFolderId(folder.id);
                                        setSearchParams({ folder_id: folder.id });
                                    }}
                                />
                            ))}
                        </div>
                    </section>
                )}

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
                                {sortedAndFilteredFiles.map(file => (
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
                                        <td>{file.uploader ? file.uploader.name : '-'}</td>
                                        <td>{new Date(file.updated_at).toLocaleDateString('id-ID')}</td>
                                        <td>{(file.ukuran_file / 1024 / 1024).toFixed(2)} MB</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="stats-grid">
                        {sortedAndFilteredFiles.map(file => (
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
            </div>

            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload File Baru">
                <FileUploadForm 
                    onUploadComplete={handleUploadComplete} 
                    onConflict={handleConflict} 
                    onUploadError={handleUploadError} 
                    currentFolderId={currentFolderId}
                    divisionId={viewingAsAdminForDivision?.id}
                />
            </Modal>

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

            <ConfirmationModal
                isOpen={overwriteModal.isOpen}
                onClose={() => setOverwriteModal({ isOpen: false, file: null, message: '' })}
                onConfirm={confirmOverwrite}
                message={overwriteModal.message || `File dengan nama "${overwriteModal.file?.name}" sudah ada. Timpa file?`}
                confirmText="Timpa"
                isDanger={true}
                customActions={
                    <button onClick={() => {
                        setRenameUploadModal({ isOpen: true, file: overwriteModal.file, newName: '' });
                        setOverwriteModal({ isOpen: false, file: null, message: '' });
                    }} className="modal-button cancel-button">
                        Ganti Nama
                    </button>
                }
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
                        <button type="button" className="modal-button cancel-button" onClick={() => setRenameModal({ ...renameModal, isOpen: false })}>
                            <FaTimes /> Batal
                        </button>
                        <button type="button" className="modal-button confirm-button" onClick={confirmRename}>
                            <FaSave /> Simpan
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal 
                isOpen={renameUploadModal.isOpen} 
                onClose={() => setRenameUploadModal({ ...renameUploadModal, isOpen: false })} 
                title="Ganti Nama dan Upload"
            >
                <div>
                    <p>File dengan nama ini sudah ada. Masukkan nama baru untuk mengunggah:</p>
                    <input 
                        type="text" 
                        placeholder={`Nama asli: ${renameUploadModal.file?.name}`}
                        value={renameUploadModal.newName}
                        onChange={(e) => setRenameUploadModal({ ...renameUploadModal, newName: e.target.value })}
                        className="form-input w-full mt-2"
                    />
                    <div className="confirmation-modal-actions">
                        <button type="button" className="modal-button cancel-button" onClick={() => setRenameUploadModal({ ...renameUploadModal, isOpen: false })}>
                            <FaTimes /> Batal
                        </button>
                        <button type="button" className="modal-button confirm-button" onClick={() => {
                            executeUpload(renameUploadModal.file, { newName: renameUploadModal.newName });
                            setRenameUploadModal({ isOpen: false, file: null, newName: '' });
                        }}>
                            <FaSave /> Simpan dan Upload
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

            <FilePreviewModal
                isOpen={isPreviewOpen}
                onClose={closePreview}
                fileUrl={previewFile?.url}
                mimeType={previewFile?.mime}
                fileName={previewFile?.name}
            />
        </div>
    );
};


// --- Komponen Utama DashboardPage ---
const DashboardPage = () => {
    const { user } = useAuth();
    const [viewingDivision, setViewingDivision] = useState(null); // State untuk melacak divisi yang dilihat admin

    if (user?.role?.name === 'super_admin') {
        if (viewingDivision) {
            return <DivisionUserDashboard 
                        viewingAsAdminForDivision={viewingDivision} 
                        onExitAdminView={() => setViewingDivision(null)} 
                    />;
        }
        return <SuperAdminDashboard onSelectDivision={setViewingDivision} />;
    }
    
    return <DivisionUserDashboard />;
};

export default DashboardPage;

