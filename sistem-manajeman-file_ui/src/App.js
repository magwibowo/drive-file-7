// src/App.js

import React, { useEffect } from 'react';
import 'react-data-grid/lib/styles.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// --- Impor Komponen & Halaman Utama ---
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import AdminPanelLayout from './components/Layout/AdminPanelLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DaftarUserPage from './pages/DaftarUserPage';
import TambahUserPage from './pages/TambahUserPage';
import ProfilePage from './pages/ProfilePage';
import RecentFilesPage from './pages/RecentFilesPage';
import FavoritesPage from './pages/FavoritesPage';
import TrashPage from './pages/TrashPage';
import EditUserPage from './pages/EditUserPage';
import TrashUserPage from './pages/TrashUserPage';
import KelolaFolderPage from './pages/KelolaFolderPage';
import DivisionActivityLogPage from './pages/DivisionActivityLogPage';

// --- IMPORT BARU UNTUK SUPER ADMIN ---
import SuperAdminLayout from './components/Layout/SuperAdminLayout';
import SuperAdminBeranda from './pages/SuperAdminBeranda';
import SuperAdminPengaturanPage from './pages/SuperAdminPengaturanPage';
import SuperAdminBackupPage from './pages/SuperAdminBackupPage';
import ManajemenPage from './pages/ManajemenPage'; 
import KelolaDivisiPage from './pages/KelolaDivisiPage';
import KelolaPenggunaPage from './pages/KelolaPenggunaPage'; 
import KelolaPenggunaSampahPage from './pages/KelolaPenggunaSampahPage'; 
import LoginHistoryPage from './pages/LoginHistoryPage';    
import PilihDivisiPage from './pages/PilihDivisiPage'; 
// import PengaturanPage from './pages/PengaturanPage'; 

// --- Komponen Modal Peringatan Inaktivitas ---
const InactivityWarningModal = ({ show, onDismiss }) => {
    if (!show) return null;

    const modalOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    };
    const modalContentStyle = {
        backgroundColor: '#fff',
        padding: '20px 40px',
        borderRadius: '8px',
        textAlign: 'center',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    };
    const buttonStyle = {
        marginTop: '20px',
        padding: '10px 20px',
        cursor: 'pointer',
        border: 'none',
        borderRadius: '5px',
        backgroundColor: '#007bff',
        color: 'white',
        fontSize: '16px',
    };

    return (
        <div style={modalOverlayStyle}>
            <div style={modalContentStyle}>
                <h3>Sesi Akan Berakhir</h3>
                <p>Sesi Anda akan berakhir dalam waktu kurang dari 1 menit karena tidak ada aktivitas.</p>
                <p>Klik tombol di bawah untuk tetap login.</p>
                <button onClick={onDismiss} style={buttonStyle}>Tetap Login</button>
            </div>
        </div>
    );
};

// --- Wrapper untuk menangani logika global ---
const AppLogicWrapper = ({ children }) => {
    const { user, resetActivityTimer, inactivityWarning, dismissInactivityWarning } = useAuth();

    useEffect(() => {
        const events = ['click', 'keydown', 'mousemove', 'scroll'];

        const handleActivity = () => {
            if (user) resetActivityTimer();
        };

        if (user) events.forEach(event => window.addEventListener(event, handleActivity));

        return () => events.forEach(event => window.removeEventListener(event, handleActivity));
    }, [user, resetActivityTimer]);

    return (
        <>
            <InactivityWarningModal show={inactivityWarning} onDismiss={dismissInactivityWarning} />
            {children}
        </>
    );
};

// --- Komponen untuk rute Panel Admin Devisi ---
const AdminPanelRoutes = () => (
    <AdminPanelLayout title="Panel Admin">
        <Routes>
            <Route path="/users" element={<DaftarUserPage />} />
            <Route path="/tambah-user" element={<TambahUserPage />} />
            <Route path="/users/edit/:userId" element={<EditUserPage />} />
            <Route path="/users/trash" element={<TrashUserPage />} /> 
            <Route path="/folders" element={<KelolaFolderPage />} />
            <Route path="/activities" element={<DivisionActivityLogPage />} />
            <Route path="*" element={<Navigate to="/panel-admin/users" replace />} />
        </Routes>
    </AdminPanelLayout>
);

// --- Komponen untuk rute utama aplikasi ---
const MainRoutes = () => (
    <AppLayout>
        <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/terbaru" element={<RecentFilesPage />} />
            <Route path="/favorit" element={<FavoritesPage />} />
            <Route path="/sampah" element={<TrashPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </AppLayout>
);

// --- Komponen Utama App ---
function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <Router>
          <AppLogicWrapper>
            <Routes>
              {/* Rute publik */}
              <Route path="/login" element={<LoginPage />} />

              {/* Rute terproteksi untuk Panel Admin Devisi */}
              <Route
                path="/panel-admin/*"
                element={
                  <ProtectedRoute allowedRoles={['admin_devisi']}>
                    <AdminPanelRoutes />
                  </ProtectedRoute>
                }
              />

              {/* RUTE SUPER ADMIN */}
              <Route
                path="/super-admin"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SuperAdminLayout />
                  </ProtectedRoute>
                }
              >
                {/* Rute nested */}
                <Route index element={<Navigate to="beranda" replace />} />
                <Route path="beranda" element={<SuperAdminBeranda />} />
                <Route path="manajemen" element={<ManajemenPage />} />
                <Route path="manajemen/divisi" element={<KelolaDivisiPage />} />
                <Route path="manajemen/pengguna" element={<KelolaPenggunaPage />} />
                <Route path="manajemen/pengguna/sampah" element={<KelolaPenggunaSampahPage />} />

                {/* Dari kelola-folder-superadmin-ui */}
                <Route path="manajemen/login-history" element={<LoginHistoryPage />} />
                <Route path="kelola-folder-divisi" element={<PilihDivisiPage />} />
                <Route path="kelola-folder/divisi/:divisionId" element={<KelolaFolderPage />} />

                {/* Dari feature/backup-fix */}
                <Route path="pengaturan/backup" element={<SuperAdminBackupPage />} />
                <Route path="pengaturan" element={<SuperAdminPengaturanPage />} />

                <Route path="*" element={<Navigate to="beranda" replace />} />
              </Route>

              {/* Rute terproteksi untuk halaman utama lainnya */}
              <Route path="/*" element={<ProtectedRoute><MainRoutes /></ProtectedRoute>} />
            </Routes>
          </AppLogicWrapper>
        </Router>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
