// src/pages/ProfilePage.js

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUserCircle, FaEnvelope, FaBuilding } from 'react-icons/fa';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user } = useAuth();

    // Menampilkan pesan loading jika data user belum siap
    if (!user) {
        return <div className="profile-page-container">Memuat data profil...</div>;
    }

    // --- LOGIKA BARU DIMULAI DI SINI ---
    // Fungsi untuk membuat teks keterangan yang lebih deskriptif
    const getUserDescription = () => {
        // Jika tidak ada role atau nama role, kembalikan 'N/A'
        if (!user.role || !user.role.name) {
            return 'N/A';
        }

        const roleName = user.role.name;
        const divisionName = user.division?.name; // Menggunakan optional chaining '?'

        if (roleName === 'user_devisi' && divisionName) {
            return `User Divisi • ${divisionName}`;
        }
        
        if (roleName === 'admin_divisi' && divisionName) {
            return `Admin Divisi • ${divisionName}`;
        }

        if (roleName === 'super_admin') {
            return 'Super Admin';
        }

        // Fallback jika ada peran lain atau data tidak lengkap
        return roleName.replace('_', ' ');
    };
    // --- AKHIR DARI LOGIKA BARU ---

    return (
        <div className="profile-page-container">
            <h1>Profil Saya</h1>

            <div className="profile-card">
                <div className="profile-header">
                    <FaUserCircle className="profile-avatar" />
                    <h2 className="profile-name">{user.name}</h2>
                    {/* MODIFIKASI: Terapkan fungsi baru di sini */}
                    <p className="profile-role">{getUserDescription()}</p>
                </div>

                <div className="profile-body">
                    <div className="profile-info-item">
                        <FaEnvelope className="info-icon" />
                        <div className="info-content">
                            <span className="info-label">EMAIL:</span>
                            <span className="info-value">{user.email}</span>
                        </div>
                    </div>
                    {/* Kita bisa menyembunyikan info divisi di body jika sudah ada di header */}
                    {user.division && (
                         <div className="profile-info-item">
                            <FaBuilding className="info-icon" />
                            <div className="info-content">
                                <span className="info-label">DIVISI:</span>
                                <span className="info-value">{user.division.name}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;