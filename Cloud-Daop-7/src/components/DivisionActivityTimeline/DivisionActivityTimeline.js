import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DivisionActivityTimeline.css';
import Pagination from '../Dashboard/Pagination';
import { FaPlus, FaEdit, FaTrash, FaFileAlt } from 'react-icons/fa';

const getActionIcon = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('created') || desc.includes('membuat') || desc.includes('mengunggah')) {
        return <div className="timeline-icon icon-create"><FaPlus /></div>;
    }
    if (desc.includes('updated') || desc.includes('mengubah')) {
        return <div className="timeline-icon icon-update"><FaEdit /></div>;
    }
    if (desc.includes('deleted') || desc.includes('menghapus')) {
        return <div className="timeline-icon icon-delete"><FaTrash /></div>;
    }
    return <div className="timeline-icon icon-default"><FaFileAlt /></div>;
};

const renderLogDetails = (details) => {
    if (!details) {
        return '';
    }
    if (typeof details === 'object' && details !== null && details.info) {
        return details.info;
    }
    if (typeof details === 'object' && details !== null) {
        return JSON.stringify(details);
    }
    return details;
};

const DivisionActivityTimeline = ({ title, fetchLogsFunction }) => {
    const [allLogs, setAllLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Filter states
    const [textFilter, setTextFilter] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const fetchLogs = useCallback(async (page) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchLogsFunction({ page });
            const responseData = response.data;
            setAllLogs(responseData.data || []);
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
    }, [fetchLogsFunction]);

    useEffect(() => {
        fetchLogs(currentPage);
    }, [fetchLogs, currentPage]);

    const handleResetFilter = () => {
        setStartDate(null);
        setEndDate(null);
        setTextFilter('');
    };

    const handlePageChange = (url) => {
        if (!url) return;
        const urlParams = new URLSearchParams(new URL(url).search);
        const page = urlParams.get('page') || 1;
        setCurrentPage(page);
    };

    const filteredLogs = useMemo(() => {
        let logsToFilter = [...allLogs];

        // Apply text filter
        if (textFilter) {
            logsToFilter = logsToFilter.filter(log =>
                (log.causer?.name?.toLowerCase() || 'pengguna tidak dikenal').includes(textFilter.toLowerCase()) ||
                (log.description?.toLowerCase() || '').includes(textFilter.toLowerCase()) ||
                (log.properties?.details?.toString().toLowerCase() || '').includes(textFilter.toLowerCase())
            );
        }

        // Apply date range filter
        const start = startDate ? new Date(startDate) : null;
        if (start) start.setHours(0, 0, 0, 0);

        const end = endDate ? new Date(endDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        if (start || end) {
            logsToFilter = logsToFilter.filter(log => {
                const logDate = new Date(log.created_at);
                if (start && logDate < start) return false;
                if (end && logDate > end) return false;
                return true;
            });
        }

        return logsToFilter;
    }, [allLogs, textFilter, startDate, endDate]);

    if (loading) {
        return <div className="activity-log-page"><p>Memuat log aktivitas...</p></div>;
    }

    if (error) {
        return <div className="activity-log-page"><p className="error-message">{error}</p></div>;
    }

    return (
        <div className="activity-log-page">
            <div className="log-card">
                <div className="log-card-header">
                    <h2>{title}</h2>
                    <div className="filter-controls">
                        <div className="search-group">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path></svg>
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="Cari aktivitas..."
                                value={textFilter}
                                onChange={(e) => setTextFilter(e.target.value)}
                            />
                        </div>
                        <div className="actions-group">
                            <DatePicker selected={startDate} onChange={(date) => setStartDate(date)} selectsStart startDate={startDate} endDate={endDate} dateFormat="dd/MM/yyyy" placeholderText="Tanggal Mulai" className="date-input" isClearable />
                            <span>-</span>
                            <DatePicker selected={endDate} onChange={(date) => setEndDate(date)} selectsEnd startDate={startDate} endDate={endDate} minDate={startDate} dateFormat="dd/MM/yyyy" placeholderText="Tanggal Selesai" className="date-input" isClearable />
                            <button className="btn btn-secondary" onClick={handleResetFilter}>Reset</button>
                        </div>
                    </div>
                </div>
                <div className="log-card-body">
                    {filteredLogs.length > 0 ? (
                        <>
                            <div className="timeline">
                                {filteredLogs.map(log => (
                                    <div key={log.id} className="timeline-item">
                                        {getActionIcon(log.description)}
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <span className="timeline-user">{log.causer?.name || 'Sistem'}</span>
                                                <span className="timeline-action">{log.description}</span>
                                            </div>
                                            <div className="timeline-body">
                                                {renderLogDetails(log.properties?.details)}
                                            </div>
                                            <div className="timeline-footer">
                                                {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pagination-container">
                               <Pagination meta={pagination?.meta} links={pagination?.links} onPageChange={handlePageChange} />
                            </div>
                        </>
                    ) : (
                        <p className="no-logs-message">Tidak ada aktivitas yang tercatat sesuai filter.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DivisionActivityTimeline;
