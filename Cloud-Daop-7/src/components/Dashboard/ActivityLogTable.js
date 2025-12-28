// src/components/Dashboard/ActivityLogTable.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import apiClient from '../../services/api';
import './ActivityLogTable.css';
import { FaPlus, FaEdit, FaTrash, FaUndo, FaUser } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from './Pagination';
import { useAppContext } from '../../context/AppContext';
import DeleteLogModal from './DeleteLogModal';

// Helper object for action icons
const actionDetails = {
    create: { icon: <FaPlus />, className: 'create' },
    update: { icon: <FaEdit />, className: 'update' },
    delete: { icon: <FaTrash />, className: 'delete' },
    restore: { icon: <FaUndo />, className: 'restore' },
    default: { icon: <FaUser />, className: 'default' },
};

const getActionType = (action) => {
    const lowerCaseAction = action.toLowerCase();
    if (lowerCaseAction.includes('membuat') || lowerCaseAction.includes('mengunggah')) return 'create';
    if (lowerCaseAction.includes('mengubah')) return 'update';
    if (lowerCaseAction.includes('menghapus')) return 'delete';
    if (lowerCaseAction.includes('memulihkan')) return 'restore';
    return 'default';
};

const ActivityLogTable = () => {
    const { lastActivity, triggerActivityLogRefresh } = useAppContext();
    const [logs, setLogs] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [textFilter, setTextFilter] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const fetchLogs = useCallback(async (url = '/admin/activity-logs', params = {}) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await apiClient.get(url, { params });
            const responseData = response.data;
            setLogs(responseData.data || []);
            setPagination({
                meta: { from: responseData.from, to: responseData.to, total: responseData.total },
                links: { prev: responseData.prev_page_url, next: responseData.next_page_url }
            });
        } catch (err) {
            setError('Gagal memuat log aktivitas.');
            console.error('Failed to fetch activity logs:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchDivisions = async () => {
            try {
                const response = await apiClient.get('/admin/divisions');
                setDivisions(response.data || []);
            } catch (error) {
                console.error('Failed to fetch divisions:', error);
            }
        };

        fetchDivisions();
        fetchLogs();
    }, [lastActivity, fetchLogs]);

    const divisionMap = useMemo(() => {
        if (!divisions.length) return {};
        return divisions.reduce((acc, division) => {
            acc[division.id] = division.name;
            return acc;
        }, {});
    }, [divisions]);

    const formatDateForAPI = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const handleFilterSubmit = () => {
        const params = {
            start_date: formatDateForAPI(startDate),
            end_date: formatDateForAPI(endDate),
        };
        fetchLogs('/admin/activity-logs', params);
    };

    const handleResetFilter = () => {
        setStartDate(null);
        setEndDate(null);
        setTextFilter('');
        fetchLogs();
    };

    const handlePageChange = (url) => {
        const path = new URL(url).pathname + new URL(url).search;
        const finalPath = path.replace(/^\/api/, '');
        fetchLogs(finalPath);
    };

    const handleDeleteLogs = async (range) => {
        try {
            await apiClient.post('/admin/activity-logs/delete-by-range', { range });
            triggerActivityLogRefresh();
            setSuccessMessage('Log aktivitas berhasil dihapus.');
        } catch (err) {
            setError('Gagal menghapus log aktivitas.');
            console.error('Failed to delete activity logs:', err);
        } finally {
            setShowDeleteModal(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const divisionName = divisionMap[log.user?.division_id] || '';
        const searchText = textFilter.toLowerCase();

        return (
            (log.user?.name?.toLowerCase() || '').includes(searchText) ||
            divisionName.toLowerCase().includes(searchText) ||
            (log.action?.toLowerCase() || '').includes(searchText) ||
            (log.details?.info?.toLowerCase() || '').includes(searchText)
        );
    });

    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div className="table-wrapper">
            <div className="filter-controls">
                <div className="search-group">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path></svg>
                    <input 
                        type="text"
                        className="filter-input"
                        placeholder="Cari log berdasarkan pelaku, divisi, aksi, atau detail..."
                        value={textFilter}
                        onChange={(e) => setTextFilter(e.target.value)}
                    />
                </div>
                <div className="actions-group">
                    <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} selectsStart startDate={startDate} endDate={endDate} dateFormat="dd/MM/yyyy" placeholderText="Tanggal Mulai" className="date-input" isClearable />
                    <span>-</span>
                    <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} dateFormat="dd/MM/yyyy" placeholderText="Tanggal Selesai" className="date-input" isClearable />
                    <button className="btn btn-primary" onClick={handleFilterSubmit}>Filter</button>
                    <button className="btn btn-secondary" onClick={handleResetFilter}>Reset</button>
                    <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)} title="Hapus Log">
                        <FaTrash />
                    </button>
                </div>
            </div>

            {loading ? (
                <p>Memuat log aktivitas...</p> 
            ) : (
                <>
                    {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Waktu</th>
                                    <th>Pelaku</th>
                                    <th>Divisi</th>
                                    <th>Aksi</th>
                                    <th>Target</th>
                                    <th>Detail</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map(log => {
                                        const actionType = getActionType(log.action);
                                        const { icon, className } = actionDetails[actionType];

                                        return (
                                            <tr key={log.id}>
                                                <td className="log-time">{new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}</td>
                                                <td>{log.user?.name ?? 'Sistem'}</td>
                                                <td>{divisionMap[log.division_id] || log.division_id || '-'}</td>
                                                <td className="log-action">
                                                    <div className={`action-icon-wrapper ${className}`}>
                                                        {icon}
                                                    </div>
                                                    <span>{log.action}</span>
                                                </td>
                                                <td className="log-target">{log.target_type ? `${log.target_type.split(String.fromCharCode(92)).pop()} #${log.target_id}` : '-'}</td>
                                                <td>{log.details?.info ?? '-'}</td>
                                                <td>
                                                    <span className={`status-badge status-${log.status.toLowerCase()}`}>{log.status}</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center' }}>Tidak ada data log yang ditemukan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination meta={pagination?.meta} links={pagination?.links} onPageChange={handlePageChange} />
                </>
            )}
            <DeleteLogModal 
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)} 
                onConfirm={handleDeleteLogs} 
            />
        </div>
    );
};

export default ActivityLogTable;