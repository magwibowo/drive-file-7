// src/components/Layout/AppLayout.js
import React from 'react';
// 1. Impor kembali useAuth
import { useAuth } from '../../context/AuthContext';
import NewSidebar from '../NewSidebar/NewSidebar';
import UserProfileDropdown from '../UserProfileDropdown/UserProfileDropdown';
import './AppLayout.css';

const AppLayout = ({ children }) => {
    // 2. Ambil state searchQuery dan setSearchQuery dari context
    // const { searchQuery, setSearchQuery } = useAuth();
    const { user, searchQuery, setSearchQuery } = useAuth();
    console.log("Data User Saat Ini:", user);

    return (
        <div className="app-layout">
            <NewSidebar />
            <div className="content-wrapper">
                <nav className="navbar">
                    {/* 3. Hubungkan input dengan state dari context */}
                    <input
                        type="search"
                        placeholder="Search..."
                        className="search-bar"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <UserProfileDropdown />
                </nav>
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;