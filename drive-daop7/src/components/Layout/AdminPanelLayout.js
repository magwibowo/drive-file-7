// src/components/Layout/AdminPanelLayout.js
import React from 'react';
// Hook dan ikon yang tidak terpakai sudah dihapus
import AdminSidebar from '../AdminSidebar/AdminSidebar';
import './AdminPanelLayout.css';

const AdminPanelLayout = ({ children, title }) => {
    return (
        <div className="admin-panel-layout">
            <AdminSidebar />
            <main className="admin-panel-content">
                <div className="panel-header">
                    {/* Tombol kembali sudah dihapus dari sini */}
                    <h1>{title}</h1>
                </div>
                {children}
            </main>
        </div>
    );
};

export default AdminPanelLayout;