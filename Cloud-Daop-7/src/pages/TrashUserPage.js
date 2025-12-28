// src/pages/TrashUserPage.js

import React, { useState, useEffect, useCallback } from 'react';
import { getTrashedUsers, restoreUser, forceDeleteUser } from '../services/api';
import './AdminPanel.css';
import '../components/DataTable/DataTable.css';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import Notification from '../components/Notification/Notification';

const TrashUserPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState({ isOpen: false, user: null, action: null });
    const [notification, setNotification] = useState({ isOpen: false, message: '', type: '' });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getTrashedUsers();
            setUsers(response.data);
        } catch (error) {
            console.error("Gagal mengambil data user dari sampah:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleActionClick = (user, action) => {
        setModalState({ isOpen: true, user, action });
    };

    const confirmAction = async () => {
        const { user, action } = modalState;
        if (!user || !action) return;

        try {
            if (action === 'restore') {
                await restoreUser(user.id);
                setNotification({ isOpen: true, message: 'User berhasil dipulihkan.', type: 'success' });
            } else if (action === 'forceDelete') {
                await forceDeleteUser(user.id);
                setNotification({ isOpen: true, message: 'User berhasil dihapus permanen.', type: 'success' });
            }
            fetchUsers();
        } catch (error) {
            setNotification({ isOpen: true, message: 'Gagal melakukan aksi.', type: 'error' });
        } finally {
            setModalState({ isOpen: false, user: null, action: null });
        }
    };

    const closeNotification = () => {
        setNotification({ isOpen: false, message: '', type: '' });
    };

    if (loading) return <div>Loading...</div>;

    const modalMessages = {
        restore: `Anda yakin ingin memulihkan user "${modalState.user?.name}"?`,
        forceDelete: `PERINGATAN: User "${modalState.user?.name}" akan dihapus permanen. Lanjutkan?`
    };

    return (
        <div className="admin-page-container">
            <div className="admin-page-header">
                <h2>User di Sampah</h2>
            </div>
            <div className="table-container">
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
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.nipp || '-'}</td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <button onClick={() => handleActionClick(user, 'restore')} className="action-button restore-button">
                                        Pulihkan
                                    </button>
                                    <button onClick={() => handleActionClick(user, 'forceDelete')} className="action-button delete-button">
                                        Hapus Permanen
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, user: null, action: null })}
                onConfirm={confirmAction}
                message={modalMessages[modalState.action] || ''}
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

export default TrashUserPage;