// src/context/AppContext.js
import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
    // Ini adalah "pemicu" kita. Setiap kali nilainya berubah, komponen lain akan tahu.
    const [lastActivity, setLastActivity] = useState(null);

    // Fungsi ini akan kita panggil dari mana saja untuk memicu pembaruan.
    const triggerActivityLogRefresh = () => {
        setLastActivity(new Date()); // Mengubah nilainya dengan waktu saat ini
    };

    const value = {
        lastActivity,
        triggerActivityLogRefresh,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    return useContext(AppContext);
};