// src/pages/KelolaPenggunaPage.js

import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import './KelolaPenggunaPage.css';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import PenggunaFormModal from '../components/Dashboard/PenggunaFormModal';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import Badge from '../components/Dashboard/Badge';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const getRoleBadgeType = (roleName) => {
    if (roleName === 'super_admin') return 'danger';
    if (roleName === 'admin_devisi') return 'primary';
    return 'secondary';
};

const KelolaPenggunaPage = () => {
    const navigate = useNavigate();
    const { triggerActivityLogRefresh } = useAppContext();
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State untuk form modal (Tambah/Edit)
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null);

    // State untuk modal konfirmasi Hapus
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // State untuk search bar
    const [searchQuery, setSearchQuery] = useState('');

    // Semua state dan fungsi handler Anda tidak berubah
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/users');
            setUsers(response.data);
        } catch (err) {
            setError('Gagal memuat data pengguna.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleOpenCreateModal = () => {
        setUserToEdit(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (user) => {
        setUserToEdit(user);
        setIsFormModalOpen(true);
    };
    
    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setUserToEdit(null);
    };

    const handleSave = () => {
        fetchUsers();
        triggerActivityLogRefresh();
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await apiClient.delete(`/admin/users/${userToDelete.id}`);
            fetchUsers();
            triggerActivityLogRefresh();
        } catch (err) {
            alert('Gagal menghapus pengguna.');
            console.error('Delete error:', err);
        } finally {
            handleCloseDeleteModal();
        }
    };

    const filteredUsers = users.filter(user =>
        (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.nipp && user.nipp.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.division && user.division.name && user.division.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) return <div>Memuat data pengguna...</div>;
    if (error) return <div className="error-message">{error}</div>;

return (
    <>
        <div className="page-container">

            <div className="page-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    <FaArrowLeft />
                </button>
                <h1>{user?.division?.name ? `${user.division.name} Drive` : 'Kelola Pengguna'}</h1>
            </div>

            <div className="search-bar-wrapper">
                <div className="search-group">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path></svg>
                    <input
                        type="text"
                        placeholder="Cari berdasarkan NIPP, nama, email, atau divisi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="actions-group">
                    <Link to="/super-admin/manajemen/pengguna/sampah" className="btn btn-secondary">
                        <FaTrash /> Arsip Pengguna
                    </Link>
                    <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                        <FaPlus /> Tambah Pengguna
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>NIPP</th>
                                <th>Nama Lengkap</th>
                                <th>Email</th>
                                <th>Divisi</th>
                                <th>Peran</th>
                                <th>Penyimpanan</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.nipp || '-'}</td>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.division?.name || 'N/A'}</td>
                                    <td>
                                        {user.role ? <Badge type={getRoleBadgeType(user.role.name)} text={user.role.name} /> : 'N/A'}
                                    </td>
                                    <td>{user.penyimpanan_digunakan}</td>
                                    <td className="action-buttons">
                                        <button className="btn-icon btn-edit" title="Edit" onClick={() => handleOpenEditModal(user)}>
                                            <FaEdit />
                                        </button>
                                        <button className="btn-icon btn-delete" title="Hapus" onClick={() => handleDeleteClick(user)}>
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div> {/* <-- Penutup untuk 'page-container' */}

        {/* Modal dirender di sini, di luar 'page-container' */}
        <PenggunaFormModal
            isOpen={isFormModalOpen}
            onClose={handleCloseFormModal}
            onSave={handleSave}
            userToEdit={userToEdit}
        />
        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={handleCloseDeleteModal}
            onConfirm={confirmDelete}
            message={`Apakah Anda yakin ingin menghapus pengguna \"${userToDelete?.name}\"?`}
            isDanger={true}
            confirmText="Ya, Hapus"
        />
    </>
    );

};

export default KelolaPenggunaPage;