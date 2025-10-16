import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import '../Sidebar/Sidebar.css'; 
import { FaUsers, FaFolder, FaChartLine, FaArrowLeft } from 'react-icons/fa';

const AdminSidebar = () => {
    return (
        <aside className="sidebar">
            <div>
                <div className="sidebar-header">
                    <img src={process.env.PUBLIC_URL + '/images/DAOP7DRVE.svg'} alt="Logo Panel Admin" className="sidebar-logo" />
                </div>
                {/* PERUBAHAN: Menyamakan struktur dengan NavLink */}
                <nav className="sidebar-nav">
                    <NavLink to="/panel-admin/users" className="sidebar-link" end> 
                        <FaUsers /> Kelola User 
                    </NavLink>
                    <NavLink to="/panel-admin/folders" className="sidebar-link"> 
                        <FaFolder /> Kelola Folder 
                    </NavLink>
                    <NavLink to="/panel-admin/activities" className="sidebar-link"> 
                        <FaChartLine /> Log Aktivitas 
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

export default AdminSidebar;