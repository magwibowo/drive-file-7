// src/components/Dashboard/Badge.js
import React from 'react';
import './Badge.css';

const Badge = ({ text, type }) => {
    // 'type' akan menentukan warna badge (e.g., 'primary', 'success', 'danger')
    const className = `badge badge-${type}`;
    return <span className={className}>{text}</span>;
};

export default Badge;