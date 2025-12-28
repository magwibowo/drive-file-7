// src/pages/SuperAdminBeranda.js

import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import StatCard from '../components/Dashboard/StatCard';
import ChartCard from '../components/Dashboard/ChartCard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import './SuperAdminBeranda.css';

// [BARU] Tooltip kustom untuk grafik kuota agar lebih informatif
const CustomQuotaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip" style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px' }}>
                <p className="label"><strong>{label}</strong></p>
                <p>Penggunaan: {payload[0].payload.used} / {payload[0].payload.quota}</p>
                <p>Persentase: {payload[0].value}%</p>
            </div>
        );
    }
    return null;
};


const getBarColor = (percentage) => {
    if (percentage >= 80) {
        return '#dc0b20ff'; // Merah untuk penggunaan 80% ke atas
    }
    if (percentage >= 50) {
        return '#efb300ff'; // Kuning untuk penggunaan 50% - 79.9%
    }
    return '#00c82fff'; // Hijau untuk penggunaan di bawah 50%
};

const SuperAdminBeranda = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await apiClient.get('/admin/dashboard-stats');
                setData(response.data);
            } catch (err) {
                setError('Gagal memuat data dashboard. Pastikan backend berjalan.');
                console.error('Could not fetch dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div>Memuat data dasbor...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!data) return <div>Tidak ada data untuk ditampilkan.</div>;

    return (
        <div className="super-admin-beranda">
            <h1>Beranda</h1>

            {/* [DIROMBAK] Bagian Kartu Statistik Utama */}
            <div className="stats-grid">
                <StatCard title="Total Pengguna" value={data.summary.totalUsers} />
                <StatCard title="Total Divisi" value={data.summary.totalDivisions} />
                <StatCard title="Total Dokumen" value={data.summary.totalFiles} />
                <StatCard title="Penyimpanan Terpakai" value={data.summary.storageUsed} />
            </div>

            {/* [DIROMBAK] Bagian Grafik */}
            <div className="charts-grid">
                <ChartCard title="Upload 7 Hari Terakhir">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data.dailyUploads} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" name="Jumlah Upload" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* [BARU] Grafik Penggunaan Kuota per Divisi */}
                <ChartCard title="Penggunaan Kuota per Divisi">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.quotaPerDivision} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis unit="%" />
                            <Tooltip content={<CustomQuotaTooltip />} />
                            <Bar dataKey="percentage" name="Penggunaan Kuota (%)">
                                {data.quotaPerDivision.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
            
            {/* [DIROMBAK] Bagian Aktivitas Terbaru */}
            <div className="summary-grid">
                 {/* Kartu Ringkasan dihapus karena sudah naik ke atas */}
                 <ChartCard title="Aktivitas Terbaru Sistem">
                    <table className="recent-uploads-table">
                        <thead>
                            <tr>
                                <th>Aktor</th>
                                <th>Aksi</th>
                                <th>Waktu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.recentActivities.map(log => (
                                <tr key={log.id}>
                                    <td>{log.actor}</td>
                                    <td>{log.action}</td>
                                    <td>{log.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </ChartCard>
            </div>
        </div>
    );
};

export default SuperAdminBeranda;