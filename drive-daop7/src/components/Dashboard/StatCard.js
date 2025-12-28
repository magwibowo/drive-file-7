// src/components/Dashboard/StatCard.js
import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, children }) => {
    return (
        <div className="stat-card">
            <h3 className="stat-title">{title}</h3>
            <p className="stat-value">{value}</p>
            {/* 'children' digunakan untuk menampilkan elemen tambahan seperti progress bar */}
            {children && <div className="stat-extra">{children}</div>}
        </div>
    );
};

export default StatCard;