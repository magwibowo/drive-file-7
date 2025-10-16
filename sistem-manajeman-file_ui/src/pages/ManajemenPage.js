// src/pages/ManajemenPage.js

import React from 'react';
// Ganti Link menjadi NavLink untuk mendapatkan style .active
import { NavLink } from 'react-router-dom';
import ActivityLogTable from '../components/Dashboard/ActivityLogTable';
import './ManajemenPage.css';

const ManajemenPage = () => {
    return (
        <div className="manajemen-page">
            <h1>Manajemen Global</h1>

            <div className="manajemen-nav-tabs">
                <NavLink to="/super-admin/manajemen/divisi" className="nav-tab">
                    Kelola Divisi
                </NavLink>
                <NavLink to="/super-admin/manajemen/pengguna" className="nav-tab">
                    Kelola Pengguna
                </NavLink>
                {/* --- TAMBAHKAN TOMBOL BARU DI SINI --- */}
                <NavLink to="/super-admin/manajemen/login-history" className="nav-tab">
                    Riwayat Login
                </NavLink>
            </div>

            <div className="log-container">
                <h3>Log Aktivitas Terbaru</h3>
                <ActivityLogTable />
            </div>
        </div>
    );
};

export default ManajemenPage;