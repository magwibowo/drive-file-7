import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import '../Sidebar/Sidebar.css'; 
// BARU: Impor ikon folder
import { FaHome, FaUsers, FaCog, FaArrowLeft, FaFolder } from 'react-icons/fa';

const SuperAdminSidebar = () => {
    return (
        <aside className="sidebar">
            <div>
                <div className="sidebar-header">
                    <h3>Super Admin Console</h3>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/super-admin/beranda" className="sidebar-link">
                        <FaHome /> Beranda
                    </NavLink>
                    <NavLink to="/super-admin/manajemen" className="sidebar-link">
                        <FaUsers /> Manajemen
                    </NavLink>
                    <NavLink to="/super-admin/kelola-folder-divisi" className="sidebar-link">
                        <FaFolder /> Kelola Folder Divisi
                    </NavLink>
                    <NavLink to="/super-admin/pengaturan" className="sidebar-link">
                        <FaCog /> Pengaturan
                    </NavLink>
                </nav>
            </div>

            <div className="sidebar-footer">
                <Link to="/dashboard" className="sidebar-back-button">
                    <FaArrowLeft /> Kembali ke Dashboard
                </Link>
            </div>
        </aside>
    );
};

export default SuperAdminSidebar;