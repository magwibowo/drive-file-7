// File: src/pages/PilihDivisiPage.js (VERSI FINAL)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/api';
import { FaFolder, FaDatabase } from 'react-icons/fa';
import './PilihDivisiPage.css';

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const PilihDivisiPage = () => {
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });

    useEffect(() => {
        const fetchDivisions = async () => {
            try {
                // Ganti endpoint untuk mendapatkan data kuota
                const response = await apiClient.get('/admin/divisions');
                setDivisions(response.data);
            } catch (err) {
                setError('Gagal memuat data divisi.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDivisions();
    }, []);
    
    const processedDivisions = React.useMemo(() => {
        if (divisions.length === 0) return [];
        
        let sortableItems = [...divisions];

        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                // Gunakan files_sum_ukuran_file untuk sorting ukuran
                const keyA = sortConfig.key === 'total_storage' ? (a.files_sum_ukuran_file || 0) : a[sortConfig.key];
                const keyB = sortConfig.key === 'total_storage' ? (b.files_sum_ukuran_file || 0) : b[sortConfig.key];

                if (keyA < keyB) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (keyA > keyB) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [divisions, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    if (loading) return <div>Memuat data divisi...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="pilih-divisi-page">
            <h1>Pilih Divisi untuk Dikelola</h1>
                <div className="sort-controls">
                <span>Urutkan berdasarkan:</span>
                <button onClick={() => requestSort('name')} className={sortConfig.key === 'name' ? 'active' : ''}>
                    Nama
                </button>
                <button onClick={() => requestSort('total_storage')} className={sortConfig.key === 'total_storage' ? 'active' : ''}>
                    Ukuran
                </button>
                <button onClick={() => requestSort('folders_count')} className={sortConfig.key === 'folders_count' ? 'active' : ''}>
                    Folder
                </button>
            </div>
            <div className="division-grid">
                {processedDivisions.map(division => {
                    const used = division.files_sum_ukuran_file || 0;
                    const quota = division.storage_quota || 0;
                    const percentage = quota > 0 ? (used / quota) * 100 : 0;
                    
                    return (
                        <Link 
                            key={division.id} 
                            to={`/super-admin/kelola-folder/divisi/${division.id}`} 
                            className="division-card"
                        >
                            <h3>{division.name}</h3>
                            <div className="division-stats">
                                <span><FaFolder /> {division.folders_count || 0} Folder</span>
                                <div className="storage-info">
                                    <span>
                                        <FaDatabase /> {formatBytes(used)}
                                        {quota > 0 && ` / ${formatBytes(quota)}`}
                                    </span>
                                    
                                    {/* --- PROGRESS BAR DINAMIS --- */}
                                    {quota > 0 && (
                                        <div className="progress-bar-container">
                                            <div 
                                                className={`progress-bar ${percentage >= 85 ? 'danger' : percentage >= 50 ? 'warning' : 'primary'}`}
                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
};

export default PilihDivisiPage;