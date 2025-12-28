
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import LoginHistoryTable from '../components/Dashboard/LoginHistoryTable';
// Kita gunakan kembali CSS yang sudah modern dari halaman lain
import './KelolaPenggunaPage.css'; 

const LoginHistoryPage = () => {
    const navigate = useNavigate();

    return (
        <div className="page-container">
            <div className="page-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    <FaArrowLeft />
                </button>
                <h1>Riwayat Login Pengguna</h1>
            </div>
            
            {/* Komponen tabel sekarang berada di dalam layout yang benar */}
            <LoginHistoryTable />
        </div>
    );
};

export default LoginHistoryPage;