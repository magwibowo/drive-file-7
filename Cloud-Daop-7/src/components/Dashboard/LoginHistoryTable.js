// src/components/Dashboard/LoginHistoryTable.js - VERSI FINAL

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api'; 
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './LoginHistoryTable.css'; 
import Modal from '../Modal/Modal'; 

const LoginHistoryTable = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const [modalState, setModalState] = useState({
        showPurgeOptions: false,
        showFinalConfirm: false,
        showNotification: false,
        message: '',
        isError: false,
    });
    const [purgeRange, setPurgeRange] = useState('');
    const [itemsToDeleteCount, setItemsToDeleteCount] = useState(0);

    const fetchHistory = useCallback(async (page = 1, params = {}) => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/login-history?page=${page}`, { params });
            setHistory(response.data.data);
            setPagination({ currentPage: response.data.current_page, lastPage: response.data.last_page });
        } catch (err) {
            setModalState(prev => ({ ...prev, showNotification: true, message: 'Gagal memuat data. Coba lagi nanti.', isError: true }));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);
    
    // [PERBAIKAN] Menggunakan cara update state yang benar untuk mencegah bug
    const openPurgeOptionsModal = () => {
        setModalState(prev => ({
            ...prev, // Salin dulu state sebelumnya
            showPurgeOptions: true 
        }));
    };
    
    const closeAllModals = () => {
        setModalState({ showPurgeOptions: false, showFinalConfirm: false, showNotification: false, message: '', isError: false });
        setPurgeRange('');
        setItemsToDeleteCount(0);
    };

    const handleInitialPurgeAttempt = async () => {
        if (!purgeRange) {
            setModalState(prev => ({ ...prev, showNotification: true, message: 'Silakan pilih rentang waktu terlebih dahulu.', isError: true }));
            return;
        }
        try {
            const response = await api.get('/admin/login-history/count-purge', { params: { range: purgeRange } });
            const count = response.data.count;
            setItemsToDeleteCount(count);

            if (count > 0) {
                setModalState({ showPurgeOptions: false, showFinalConfirm: true }); // Reset dan buka modal baru
            } else {
                setModalState({ showPurgeOptions: false, showNotification: true, message: 'Tidak ada riwayat login untuk rentang yang dipilih.' });
            }
        } catch (err) {
            setModalState({ showPurgeOptions: false, showNotification: true, message: 'Gagal menghitung data.', isError: true });
        }
    };

    const handleFinalPurge = async () => {
        try {
            const response = await api.delete('/admin/login-history', { data: { range: purgeRange } });
            setModalState({ showFinalConfirm: false, showNotification: true, message: response.data.message });
            fetchHistory(); // Refresh tabel setelah berhasil
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Gagal menghapus riwayat.';
            setModalState({ showFinalConfirm: false, showNotification: true, message: errorMsg, isError: true });
        }
    };
    
    const formatDateForAPI = (date) => { if (!date) return null; const d = new Date(date); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const handleFilterSubmit = () => { const params = { start_date: formatDateForAPI(startDate), end_date: formatDateForAPI(endDate) }; fetchHistory(1, params); };
    const handleResetFilter = () => { setStartDate(null); setEndDate(null); fetchHistory(); };
    const handlePageChange = (newPage) => { if (newPage >= 1 && newPage <= pagination.lastPage) { const params = { start_date: formatDateForAPI(startDate), end_date: formatDateForAPI(endDate) }; fetchHistory(newPage, params); } };

    return (
            <div className="table-wrapper"> {/* <-- 1. UBAH CLASS DI SINI */}
                <div className="filter-controls">
                    {/* ... Konten filter controls Anda tetap sama ... */}
                    <div className="search-group" />
                    <div className="actions-group">
                        <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} selectsStart startDate={startDate} endDate={endDate} dateFormat="dd/MM/yyyy" placeholderText="Tanggal Mulai" className="date-input" isClearable />
                        <span>-</span>
                        <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} dateFormat="dd/MM/yyyy" placeholderText="Tanggal Selesai" className="date-input" isClearable />
                        <button className="btn btn-primary" onClick={handleFilterSubmit}>Filter</button>
                        <button className="btn btn-secondary" onClick={handleResetFilter}>Reset</button>
                        <button className="btn btn-danger" onClick={openPurgeOptionsModal}>Bersihkan Riwayat</button>
                    </div>
                </div>

            {loading ? <p>Memuat...</p> : (
                <>
                    <div className="table-container">
                       <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nama Pengguna</th>
                                    <th>Aksi</th>
                                    <th>Alamat IP</th>
                                    <th>Perangkat / Browser</th>
                                    <th>Waktu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.length > 0 ? (
                                    history.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.user?.name}</td>
                                            <td><span className={`action-badge ${item.action}`}>{item.action}</span></td>
                                            <td>{item.ip_address}</td>
                                            <td>{item.parsed_agent?.browser} on {item.parsed_agent?.platform}</td>
                                            <td>{format(new Date(item.created_at), 'd MMMM yyyy, HH:mm:ss', { locale: id })}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>Tidak ada riwayat login.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="pagination-controls">
                        <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={!pagination.currentPage || pagination.currentPage === 1}>&laquo; Sebelumnya</button>
                        <span>Halaman {pagination.currentPage || 1} dari {pagination.lastPage || 1}</span>
                        <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={!pagination.currentPage || pagination.currentPage === pagination.lastPage}>Selanjutnya &raquo;</button>
                    </div>
                </>
            )}

            <Modal isOpen={modalState.showPurgeOptions} onClose={closeAllModals} title="Bersihkan Riwayat Login">
                <p>Pilih rentang data yang ingin Anda hapus secara permanen.</p>
                <select onChange={(e) => setPurgeRange(e.target.value)} className="form-select" defaultValue="">
                    <option value="" disabled>-- Pilih Rentang Waktu --</option>
                    <option value="1-month">Lebih lama dari 1 bulan</option>
                    <option value="6-months">Lebih lama dari 6 bulan</option>
                    <option value="1-year">Lebih lama dari 1 tahun</option>
                    <option value="all">Hapus Semua Riwayat</option>
                </select>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={closeAllModals}>Batal</button>
                    <button className="btn btn-danger" onClick={handleInitialPurgeAttempt} disabled={!purgeRange}>Lanjutkan</button>
                </div>
            </Modal>

            <Modal isOpen={modalState.showFinalConfirm} onClose={closeAllModals} title="Konfirmasi Penghapusan Permanen">
                <p>Apakah Anda yakin ingin menghapus <strong>{itemsToDeleteCount} data</strong> riwayat login secara permanen?</p>
                <p style={{ fontWeight: 'bold', color: '#dc3545' }}>Aksi ini tidak dapat dibatalkan!</p>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={closeAllModals}>Batal</button>
                    <button className="btn btn-danger" onClick={handleFinalPurge}>Ya, Hapus {itemsToDeleteCount} Data</button>
                </div>
            </Modal>
            
            <Modal isOpen={modalState.showNotification} onClose={closeAllModals} title={modalState.isError ? "Terjadi Kesalahan" : "Berhasil"}>
                <p>{modalState.message}</p>
                <div className="modal-footer">
                    <button className="btn btn-primary" onClick={closeAllModals}>Tutup</button>
                </div>
            </Modal>
        </div>
    );
};

export default LoginHistoryTable;