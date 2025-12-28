// src/pages/DaftarUserPage.js

// MODIFIKASI: Mengimpor hook dan ikon yang diperlukan
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api'; // MODIFIKASI: Kita akan gunakan apiClient langsung agar lebih fleksibel
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaTrashRestore, FaArrowLeft } from 'react-icons/fa'; // BARU: Ikon baru
import './AdminPanel.css';
import '../components/DataTable/DataTable.css';
import './DaftarUserPage.css';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import Notification from '../components/Notification/Notification';

const DaftarUserPage = () => {
    const { user: adminUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState({ isOpen: false, message: '', type: '' });
    
    // BARU: State untuk mengontrol tampilan sampah
    const [isTrashView, setIsTrashView] = useState(false);

    // BARU: State yang lebih generik untuk modal konfirmasi
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null); // 'delete', 'restore', 'forceDelete'
    const [selectedUser, setSelectedUser] = useState(null);

    // MODIFIKASI: fetchUsers sekarang dinamis bisa ambil data sampah
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const endpoint = isTrashView ? '/admin/users/trashed' : '/admin/users';
        try {
            const response = await apiClient.get(endpoint);
            setUsers(response.data);
        } catch (error) {
            console.error("Gagal mengambil data user:", error);
            setNotification({ isOpen: true, message: 'Gagal mengambil data user.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [isTrashView]); // Dependensi pada isTrashView

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]); // useEffect sekarang hanya bergantung pada fetchUsers

    // BARU: Handler untuk membuka modal konfirmasi secara generik
    const openConfirmationModal = (user, action) => {
        setSelectedUser(user);
        setModalAction(action);
        setIsConfirmModalOpen(true);
    };

    const closeConfirmationModal = () => {
        setIsConfirmModalOpen(false);
        setSelectedUser(null);
        setModalAction(null);
    };

    // BARU: Handler untuk menjalankan aksi setelah konfirmasi
    const handleConfirmAction = async () => {
        if (!selectedUser || !modalAction) return;

        let actionPromise;
        let successMessage = '';

        try {
            switch (modalAction) {
                case 'delete':
                    actionPromise = apiClient.delete(`/admin/users/${selectedUser.id}`);
                    successMessage = 'User berhasil dipindahkan ke sampah.';
                    break;
                case 'restore':
                    actionPromise = apiClient.put(`/admin/users/${selectedUser.id}/restore`);
                    successMessage = 'User berhasil dipulihkan.';
                    break;
                case 'forceDelete':
                    actionPromise = apiClient.delete(`/admin/users/${selectedUser.id}/force-delete`);
                    successMessage = 'User berhasil dihapus permanen.';
                    break;
                default:
                    return;
            }
            await actionPromise;
            setNotification({ isOpen: true, message: successMessage, type: 'success' });
            fetchUsers(); // Muat ulang daftar user
        } catch (error) {
            setNotification({ isOpen: true, message: `Gagal melakukan aksi.`, type: 'error' });
        } finally {
            closeConfirmationModal();
        }
    };
    
    const closeNotification = () => {
        setNotification({ isOpen: false, message: '', type: '' });
    };

    const filteredUsers = users.filter(user =>
        (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    // BARU: Fungsi untuk mendapatkan detail modal berdasarkan aksi
    const getModalDetails = () => {
        if (!modalAction || !selectedUser) return {};
        switch(modalAction) {
            case 'delete':
                return {
                    message: `Anda yakin ingin memindahkan user "${selectedUser.name}" ke sampah?`,
                    isDanger: true,
                    confirmText: 'Ya, Pindahkan'
                };
            case 'restore':
                return {
                    message: `Anda yakin ingin memulihkan user "${selectedUser.name}"?`,
                    isDanger: false,
                    confirmText: 'Ya, Pulihkan'
                };
            case 'forceDelete':
                return {
                    message: `Anda yakin ingin menghapus user "${selectedUser.name}" secara permanen?`,
                    isDanger: true,
                    confirmText: 'Ya, Hapus Permanen'
                };
            default: return {};
        }
    };

    if (loading) return <div>Loading...</div>;

    const modalDetails = getModalDetails();

    return (
        <div className="admin-page-container">
            {/* MODIFIKASI: Header halaman dibuat dinamis */}
            <div className="admin-header-container">
                <div className="admin-header-title">
                    <span className="page-subtitle">{adminUser?.division?.name ? `${adminUser.division.name} Drive` : 'Semua User'}</span>
                    <h1 className="page-main-title">{isTrashView ? 'User di Sampah' : 'Kelola User'}</h1>
                </div>
                <div className="button-group">
                    {isTrashView ? (
                        <button className="btn btn-secondary" onClick={() => setIsTrashView(false)}>
                            <FaArrowLeft /> Kembali ke Daftar User
                        </button>
                    ) : (
                        <>
                            <button className="btn btn-secondary" onClick={() => setIsTrashView(true)}>
                                <FaTrash /> Lihat Sampah
                            </button>
                            <Link to="/panel-admin/tambah-user" className="btn btn-primary">
                                <FaPlus /> Tambah User
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* MODIFIKASI: Tampilkan pencarian hanya di halaman utama */}
            {!isTrashView && (
                <div className="controls-container">
                    <input
                        type="search"
                        placeholder="Cari nama atau email..."
                        className="search-bar-admin"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            )}

            <div className="table-wrapper"> 
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>NIPP</th>
                            <th>Nama Lengkap</th>
                            <th>Username</th>
                            <th>Email</th>
                            {/* MODIFIKASI: Kolom dinamis */}
                            <th>{isTrashView ? 'Tanggal Dihapus' : 'Penyimpanan Digunakan'}</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td>{user.nipp || '-'}</td>
                                <td>{user.name}</td>
                                <td>{user.username || '-'}</td>
                                <td>{user.email}</td>
                                <td>{isTrashView ? new Date(user.deleted_at).toLocaleDateString('id-ID') : (user.penyimpanan_digunakan || '0 MB')}</td>
                                {/* MODIFIKASI: Tombol Aksi Dinamis */}
                                <td className="action-buttons">
                                    {isTrashView ? (
                                        <>
                                            <button className="btn-icon btn-restore" title="Pulihkan User" onClick={() => openConfirmationModal(user, 'restore')}>
                                                <FaTrashRestore />
                                            </button>
                                            <button className="btn-icon btn-delete" title="Hapus Permanen" onClick={() => openConfirmationModal(user, 'forceDelete')}>
                                                <FaTrash />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link to={`/panel-admin/users/edit/${user.id}`} className="btn-icon btn-edit" title="Edit User">
                                                <FaEdit />
                                            </Link>
                                            <button className="btn-icon btn-delete" title="Pindahkan ke Sampah" onClick={() => openConfirmationModal(user, 'delete')}>
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

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={closeConfirmationModal}
                onConfirm={handleConfirmAction}
                message={modalDetails.message}
                isDanger={modalDetails.isDanger}
                confirmText={modalDetails.confirmText}
            />

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

export default DaftarUserPage;