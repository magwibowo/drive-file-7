import React from 'react';
import { Outlet } from 'react-router-dom';
import SuperAdminSidebar from '../SuperAdminSidebar/SuperAdminSidebar'; // Akan kita buat di langkah 2
import './SuperAdminLayout.css'; 

const SuperAdminLayout = () => {
    return (
        <div className="super-admin-layout">
            <SuperAdminSidebar />
            <main className="super-admin-content">
                <Outlet /> {/* Di sini halaman (Beranda, Manajemen, dll.) akan ditampilkan */}
            </main>
        </div>
    );
};

export default SuperAdminLayout;