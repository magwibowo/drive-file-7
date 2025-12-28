// src/pages/KelolaFolderPage.js

import React, { useState, useEffect, useCallback } from 'react'; 
import { useSearchParams, useParams } from 'react-router-dom'; 
import apiClient from '../services/api';
import './KelolaFolderPage.css';
import { FaPlus, FaEdit, FaTrash, FaFolder, FaTrashRestore, FaArrowLeft } from 'react-icons/fa';
import FolderFormModal from '../components/Dashboard/FolderFormModal';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import { useAuth } from '../context/AuthContext';

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === null || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const KelolaFolderPage = () => {
  const { divisionId } = useParams(); 
  const { user } = useAuth();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTrashView, setIsTrashView] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null);
  
  const [searchParams, setSearchParams] = useSearchParams();
  // MODIFIKASI: Kita tidak perlu state untuk currentParentId, cukup variabel biasa
  const currentParentId = searchParams.get('parent_id') ? parseInt(searchParams.get('parent_id'), 10) : null;
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [divisionName, setDivisionName] = useState('');

const fetchFolders = useCallback(async () => {
    setLoading(true);
    if (isTrashView) {
      setBreadcrumbs([]);
    }
    
    try {
      // Siapkan parameter untuk panggilan API
      const params = {
        parent_id: isTrashView ? undefined : currentParentId,
      };

      // Jika yang membuka adalah super_admin, tambahkan division_id ke parameter
      if (user.role.name === 'super_admin' && divisionId) {
        params.division_id = divisionId;

        // Ambil juga nama divisi untuk ditampilkan di judul jika belum ada
        if (!divisionName) {
            const divResponse = await apiClient.get(`/admin/divisions/${divisionId}`);
            setDivisionName(divResponse.data.name);
        }
      }

      const endpoint = isTrashView ? '/admin/folders/trashed' : '/admin/folders';
      const { data } = await apiClient.get(endpoint, { params });
      setFolders(data);

      if (params.parent_id && !isTrashView) {
        const { data: showData } = await apiClient.get(`/admin/folders/${params.parent_id}`);
        setBreadcrumbs(showData.breadcrumbs || []);
      } else {
        setBreadcrumbs([]);
      }
    } catch (err) {
      setError('Gagal memuat data folder.');
      console.error(err);
    } finally {
      setLoading(false);
    }
    // MODIFIKASI: Tambahkan dependensi baru di sini
  }, [isTrashView, currentParentId, user, divisionId, divisionName]);

  // MODIFIKASI: useEffect sekarang jauh lebih sederhana dan aman
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]); // <-- Cukup fetchFolders sebagai dependensi

  const handleSave = () => {
    fetchFolders();
  };

  const handleOpenCreateModal = () => {
    setFolderToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (folder) => {
    setFolderToEdit(folder);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setFolderToEdit(null);
  };
  
  const openConfirmationModal = (folder, action) => {
    setSelectedFolder(folder);
    setModalAction(action);
    setIsConfirmModalOpen(true);
  };

  const closeConfirmationModal = () => {
    setIsConfirmModalOpen(false);
    setSelectedFolder(null);
    setModalAction(null);
  };

  const handleConfirmAction = async () => {
    if (!selectedFolder || !modalAction) return;

    try {
      switch (modalAction) {
        case 'delete':
          await apiClient.delete(`/admin/folders/${selectedFolder.id}`);
          break;
        case 'restore':
          await apiClient.post(`/admin/folders/${selectedFolder.id}/restore`);
          break;
        case 'forceDelete':
          await apiClient.delete(`/admin/folders/${selectedFolder.id}/force`);
          break;
        default:
          return;
      }
      fetchFolders();
    } catch (err) {
      alert(err.response?.data?.message || `Gagal melakukan aksi: ${modalAction}`);
    } finally {
      closeConfirmationModal();
    }
  };
  

  const pageTitle = user.role.name === 'super_admin' ? `Kelola Folder: ${divisionName}` : 'Kelola Folder';
  const breadcrumbBase = user.role.name === 'super_admin' ? divisionName : (user?.division?.name ? `${user.division.name} Drive` : 'My Drive');
  const getModalDetails = () => {
    if (!modalAction || !selectedFolder) return {};
    switch(modalAction) {
      case 'delete':
        return {
          message: `Apakah Anda yakin ingin memindahkan folder "${selectedFolder.name}" ke sampah?`,
          isDanger: true,
          confirmText: 'Ya, Pindahkan'
        };
      case 'restore':
        return {
          message: `Apakah Anda yakin ingin memulihkan folder "${selectedFolder.name}"?`,
          isDanger: false,
          confirmText: 'Ya, Pulihkan'
        };
      case 'forceDelete':
        return {
          message: `Apakah Anda yakin ingin menghapus folder "${selectedFolder.name}" secara permanen? Aksi ini tidak dapat dibatalkan.`,
          isDanger: true,
          confirmText: 'Ya, Hapus Permanen'
        };
      default:
        return {};
    }
  };

  if (loading) return <div>Memuat data folder...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const modalDetails = getModalDetails();

  return (
    <>
      <div className="kelola-folder-page">
        <div className="page-header">
          <div>
            {!isTrashView && (
              <div className="breadcrumbs">
                <span className="breadcrumb-item" onClick={() => { setSearchParams({}); }}>{breadcrumbBase}</span>
                {breadcrumbs.map(bc => (
                  <span key={bc.id} className="breadcrumb-item" onClick={() => { setSearchParams({ parent_id: bc.id }); }}>{' > '}{bc.name}</span>
                ))}
              </div>
            )}
            <h1>{isTrashView ? `Sampah: ${divisionName}` : pageTitle}</h1>
          </div>
          
          <div className="button-group">
            {isTrashView ? (
              <button className="btn btn-secondary" onClick={() => setIsTrashView(false)}>
                <FaArrowLeft /> Kembali ke Folder
              </button>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => setIsTrashView(true)}>
                  <FaTrash /> Lihat Sampah
                </button>
                <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                  <FaPlus /> Tambah Folder
                </button>
              </>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Folder</th>
                <th>Dibuat Oleh</th>
                <th>{isTrashView ? 'Tanggal Dihapus' : 'Tanggal Diubah'}</th>
                <th>Ukuran Total</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {folders.map((folder) => (
                <tr key={folder.id} onClick={() => {
                  if (!isTrashView) {
                    setSearchParams({ parent_id: folder.id });
                  }
                }}>
                  <td className="folder-name-cell">
                    <FaFolder /> <span>{folder.name}</span>
                  </td>
                  <td>{folder.user?.name || 'N/A'}</td>
                  <td>{new Date(isTrashView ? folder.deleted_at : folder.updated_at).toLocaleDateString('id-ID')}</td>
                  <td>{formatBytes(folder.files_sum_ukuran_file)}</td>
                  <td className="action-buttons">
                    {isTrashView ? (
                      <>
                        <button
                          className="btn-icon btn-restore"
                          title="Pulihkan"
                          onClick={(e) => { e.stopPropagation(); openConfirmationModal(folder, 'restore'); }}
                        >
                          <FaTrashRestore />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          title="Hapus Permanen"
                          onClick={(e) => { e.stopPropagation(); openConfirmationModal(folder, 'forceDelete'); }}
                        >
                          <FaTrash />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-icon btn-edit"
                          title="Ubah Nama"
                          onClick={(e) => { e.stopPropagation(); handleOpenEditModal(folder); }}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          title="Pindahkan ke Sampah"
                          onClick={(e) => { e.stopPropagation(); openConfirmationModal(folder, 'delete'); }}
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!isTrashView && (
      <FolderFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSave={handleSave}
        folderToEdit={folderToEdit}
        parentId={currentParentId}
        // BARU: Kirim divisionId ke modal jika user adalah super_admin
        divisionId={user.role.name === 'super_admin' ? divisionId : null}
      />
      )}
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleConfirmAction}
        message={modalDetails.message}
        isDanger={modalDetails.isDanger}
        confirmText={modalDetails.confirmText}
      />
    </>
  );
};

export default KelolaFolderPage;