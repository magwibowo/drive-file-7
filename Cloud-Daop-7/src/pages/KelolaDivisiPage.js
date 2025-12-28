// src/pages/KelolaDivisiPage.js

import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import './KelolaDivisiPage.css';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import DivisiFormModal from '../components/Dashboard/DivisiFormModal';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal'; 
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

// Helper function untuk format byte
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0 || bytes === null) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const KelolaDivisiPage = () => {
    const navigate = useNavigate();
    const { triggerActivityLogRefresh } = useAppContext();
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [divisionToEdit, setDivisionToEdit] = useState(null);

    // --- State baru untuk modal HAPUS ---
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [divisionToDelete, setDivisionToDelete] = useState(null);
    
    // --- State baru untuk search bar ---
    const [searchQuery, setSearchQuery] = useState('');

    const fetchDivisions = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/divisions');
            setDivisions(response.data);
        } catch (err) {
            setError('Gagal memuat data divisi.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchDivisions();
    }, []);

    const handleOpenCreateModal = () => {
        setDivisionToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (division) => {
        setDivisionToEdit(division);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setDivisionToEdit(null);
    };

    const handleSave = () => {
        fetchDivisions(); 
        triggerActivityLogRefresh(); 
    };

    // --- Fungsi-fungsi baru untuk menangani HAPUS ---
    const handleDeleteClick = (division) => {
        setDivisionToDelete(division);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setDivisionToDelete(null);
    };

    const confirmDelete = async () => {
        if (!divisionToDelete) return;
        try {
            await apiClient.delete(`/admin/divisions/${divisionToDelete.id}`);
            fetchDivisions(); 
            triggerActivityLogRefresh();
        } catch (err) {
            // Menampilkan error dari backend jika ada (misal: divisi tidak bisa dihapus)
            alert(err.response?.data?.message || 'Gagal menghapus divisi.');
            console.error('Delete error:', err);
        } finally {
            handleCloseDeleteModal();
        }
    };
    
    // --- Filter divisions based on search query ---
    const filteredDivisions = divisions.filter(division =>
        division.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div>Memuat data divisi...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <>
            <div className="kelola-divisi-page">
                <div className="page-header">
                    <button onClick={() => navigate(-1)} className="back-button">
                        <FaArrowLeft />
                    </button>
                    <h1>Kelola Divisi</h1>
                </div>

                <div className="search-bar-wrapper">
                    <div className="search-group">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path></svg>
                        <input
                            type="text"
                            placeholder="Cari nama divisi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <button className="btn btn-primary" onClick={handleOpenCreateModal}>
                        <FaPlus /> Tambah Divisi
                    </button>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Nama Divisi</th>
                                <th>Pengguna</th>
                                <th>Penyimpanan</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDivisions.map((division, index) => (
                                <tr key={division.id}>
                                    <td>{index + 1}</td>
                                    <td>{division.name}</td>
                                    <td>{division.users_count}</td>
                                    <td>{formatBytes(division.files_sum_ukuran_file)}</td>
                                    <td className="action-buttons">
                                        <button className="btn-icon btn-edit" title="Edit" onClick={() => handleOpenEditModal(division)}>
                                            <FaEdit />
                                        </button>
                                        <button className="btn-icon btn-delete" title="Hapus" onClick={() => handleDeleteClick(division)}>
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <DivisiFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                divisionToEdit={divisionToEdit}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={confirmDelete}
                message={`Apakah Anda yakin ingin menghapus divisi \"${divisionToDelete?.name}\"? Semua file dan pengguna di dalamnya akan terpengaruh.`}
                isDanger={true}
                confirmText="Ya, Hapus"
            />
        </>
    );
};

export default KelolaDivisiPage;
