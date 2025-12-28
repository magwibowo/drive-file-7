// src/pages/KelolaPenggunaSampahPage.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrashedUsers, restoreUser, forceDeleteUser } from '../services/api';
import './KelolaDivisiPage.css'; // Menggunakan kembali CSS yang ada
import { FaTrashRestore, FaTrash, FaArrowLeft } from 'react-icons/fa';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';

const KelolaPenggunaSampahPage = () => {
    const [trashedUsers, setTrashedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State untuk modal konfirmasi
    const [modalState, setModalState] = useState({ isOpen: false, user: null, action: null });

    useEffect(() => {
        fetchTrashedUsers();
    }, []);

    const fetchTrashedUsers = async () => {
        setLoading(true);
        try {
            const response = await getTrashedUsers();
            setTrashedUsers(response.data);
        } catch (err) {
            setError('Gagal memuat data sampah pengguna.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleActionClick = (user, action) => {
        setModalState({ isOpen: true, user, action });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, user: null, action: null });
    };

    const handleConfirmAction = async () => {
        const { user, action } = modalState;
        if (!user || !action) return;

        try {
            if (action === 'restore') {
                await restoreUser(user.id);
            } else if (action === 'forceDelete') {
                await forceDeleteUser(user.id);
            }
            fetchTrashedUsers(); // Refresh data setelah aksi berhasil
        } catch (err) {
            alert(`Gagal melakukan aksi: ${action}`);
            console.error(err);
        } finally {
            handleCloseModal();
        }
    };

    const getModalMessage = () => {
        if (!modalState.user) return '';
        if (modalState.action === 'restore') {
            return `Apakah Anda yakin ingin memulihkan pengguna "${modalState.user.name}"?`;
        }
        if (modalState.action === 'forceDelete') {
            return `Apakah Anda yakin ingin menghapus pengguna "${modalState.user.name}" secara permanen? Aksi ini tidak bisa dibatalkan.`;
        }
        return '';
    };

    if (loading) return <div>Memuat data sampah pengguna...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <>
            <div className="kelola-divisi-page">
                <div className="page-header">
                    <Link to="/super-admin/manajemen/pengguna" className="back-link-button">
                        <FaArrowLeft /> Kembali
                    </Link>
                    <h1>Sampah Pengguna</h1>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>NIPP</th>
                                <th>Nama Lengkap</th>
                                <th>Email</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trashedUsers.length > 0 ? (
                                trashedUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.nipp || '-'}</td>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td className="action-buttons">
                                            <button className="btn-icon btn-restore" title="Pulihkan" onClick={() => handleActionClick(user, 'restore')}>
                                                <FaTrashRestore />
                                            </button>
                                            <button className="btn-icon btn-delete" title="Hapus Permanen" onClick={() => handleActionClick(user, 'forceDelete')}>
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center' }}>Tidak ada pengguna di dalam sampah.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmAction}
                message={getModalMessage()}
                isDanger={modalState.action === 'forceDelete'}
                confirmText={modalState.action === 'restore' ? 'Ya, Pulihkan' : 'Ya, Hapus Permanen'}
            />
        </>
    );
};

export default KelolaPenggunaSampahPage;