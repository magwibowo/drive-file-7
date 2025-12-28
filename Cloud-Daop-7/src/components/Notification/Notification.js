import React from 'react';
import './Notification.css';

const Notification = ({ message, type, onClose }) => {
    // Tentukan warna berdasarkan tipe notifikasi (success atau error)
    const cardClass = `notification-card ${type}`;
    const displayMessage = message && message.trim() !== '' ? message : 'Operasi berhasil.';

    return (
        <div className="notification-overlay">
            <div className={cardClass}>
                <p>{displayMessage}</p>
                <button onClick={onClose}>OK</button>
            </div>
        </div>
    );
};

export default Notification;