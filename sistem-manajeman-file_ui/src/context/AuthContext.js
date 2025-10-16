// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    loginUser,
    logoutUser,
    getUser,
    recordFailedLoginAttempt,
    clearLoginAttempts,
    startInactivityTimer, // Import timer functions
    resetInactivityTimer,
    stopInactivityTimer
} from '../services/api';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // State untuk peringatan inaktivitas
    const [inactivityWarning, setInactivityWarning] = useState(false);

    // --- LOGIKA SESSION TIMEOUT ---

    const logoutCallback = useCallback((isAutoLogout = false) => {
        // Hentikan timer saat logout
        stopInactivityTimer();
        if (!isAutoLogout) { // Hindari loop jika logout karena timeout
            logoutUser().catch(error => {
                console.error("Logout API call failed, proceeding with local logout.", error);
            });
        }
        
        setUser(null);
        setToken(null);
        setInactivityWarning(false); // Sembunyikan modal saat logout
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        delete apiClient.defaults.headers.common['Authorization'];
    }, []);

    // Callback saat sesi akan berakhir (menampilkan peringatan)
    const handleInactivityWarning = useCallback(() => {
        setInactivityWarning(true);
    }, []);

    // Callback saat sesi berakhir (logout)
    const handleInactivityLogout = useCallback(() => {
        logoutCallback(true); // Pass true to indicate it's an auto-logout
    }, [logoutCallback]);

    // Fungsi untuk mereset timer (akan dipanggil oleh event listener global)
    const resetActivityTimer = useCallback(() => {
        // Juga sembunyikan modal peringatan jika user beraktivitas
        if (inactivityWarning) {
            setInactivityWarning(false);
        }
        resetInactivityTimer(handleInactivityLogout, handleInactivityWarning);
    }, [inactivityWarning, handleInactivityLogout, handleInactivityWarning]);

    // Fungsi untuk tetap login dari modal peringatan
    const dismissInactivityWarning = () => {
        setInactivityWarning(false);
        resetActivityTimer();
    };

    // --- AKHIR LOGIKA SESSION TIMEOUT ---

    useEffect(() => {
        const bootstrapAuth = async () => {
            const storedToken = localStorage.getItem('authToken');
            if (storedToken) {
                setToken(storedToken);
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                try {
                    const response = await getUser();
                    setUser(response.data);
                    // Jika user sudah login, mulai timer saat aplikasi dimuat
                    startInactivityTimer(handleInactivityLogout, handleInactivityWarning);
                } catch (error) {
                    logoutCallback(true); // Logout jika token tidak valid
                }
            }
            setLoading(false);
        };
        bootstrapAuth();

        // Cleanup: hentikan timer jika komponen di-unmount
        return () => {
            stopInactivityTimer();
        };
    }, [handleInactivityLogout, handleInactivityWarning, logoutCallback]);

    const login = async (loginInput, password) => {
        try {
            const response = await loginUser({
                login: loginInput,
                password: password
            });

            const { access_token, user: userData } = response.data;

            localStorage.setItem('authToken', access_token);
            localStorage.setItem('user', JSON.stringify(userData));

            setToken(access_token);
            setUser(userData);

            apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

            // Hapus catatan percobaan login yang gagal jika berhasil
            clearLoginAttempts();

            // Mulai timer setelah login berhasil
            startInactivityTimer(handleInactivityLogout, handleInactivityWarning);

        } catch (error) {
            // Di sini kita menangani error dari server
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data.message || 'Terjadi kesalahan';

                if (status === 429) {
                    // Error "Too Many Requests" dari throttle middleware
                    throw new Error('Terlalu banyak percobaan. Silakan coba lagi setelah 5 menit.');
                }

                if (status === 401) {
                    // Error "Unauthorized" (password salah atau NIPP/email tidak ada)
                    // Catat percobaan yang gagal
                    recordFailedLoginAttempt();
                    throw new Error(message); // 'Password yang Anda masukkan salah.' atau 'Email atau NIPP tidak terdaftar.'
                }

                if (status === 422) {
                    // Error validasi dari Laravel
                    throw new Error('NIPP/Email atau Password tidak boleh kosong.');
                }
            }
            // Error lain (misal: masalah jaringan)
            throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
        } catch (error) {
            console.error("Logout API call failed, proceeding with local logout.", error);
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            delete apiClient.defaults.headers.common['Authorization'];
        }
    };

    const value = { 
        user, 
        token, 
        loading, 
        login, 
        logout, 
        searchQuery, 
        setSearchQuery,
        // Tambahkan state dan fungsi baru ke context value
        inactivityWarning,
        resetActivityTimer,
        dismissInactivityWarning
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};