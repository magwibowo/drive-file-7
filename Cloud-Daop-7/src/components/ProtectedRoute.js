// src/components/ProtectedRoute.js

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // --- TAMBAHKAN KODE DEBUGGING DI SINI ---
    console.log("=================================");
    console.log("DEBUGGING DI PROTECTED ROUTE");
    console.log("Rute saat ini:", location.pathname);
    console.log("Peran yang diizinkan (allowedRoles):", allowedRoles);
    console.log("Objek user lengkap:", user);
    console.log("Peran user saat ini (user.role?.name):", user?.role?.name);
    console.log("Apakah akses akan ditolak?", allowedRoles && !allowedRoles.includes(user?.role?.name));
    console.log("=================================");
    // --- AKHIR KODE DEBUGGING ---

    if (allowedRoles && !allowedRoles.includes(user.role?.name)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;