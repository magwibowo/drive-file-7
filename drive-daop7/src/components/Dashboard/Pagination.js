// src/components/Dashboard/Pagination.js
import React from 'react';
import './Pagination.css';

const Pagination = ({ meta, links, onPageChange }) => {
    if (!meta || meta.total === 0) {
        return null; // Jangan tampilkan apa-apa jika tidak ada data
    }

    // Fungsi untuk menangani klik pada tombol navigasi
    const handleNavClick = (url) => {
        if (url) {
            onPageChange(url);
        }
    };

    return (
        <div className="pagination-container">
            <div className="pagination-info">
                Menampilkan <b>{meta.from}</b> - <b>{meta.to}</b> dari <b>{meta.total}</b> hasil
            </div>
            <div className="pagination-buttons">
                <button 
                    onClick={() => handleNavClick(links.prev)} 
                    disabled={!links.prev}
                    className="pagination-button"
                >
                    &laquo; Sebelumnya
                </button>
                <button 
                    onClick={() => handleNavClick(links.next)} 
                    disabled={!links.next}
                    className="pagination-button"
                >
                    Selanjutnya &raquo;
                </button>
            </div>
        </div>
    );
};

export default Pagination;