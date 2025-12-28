// src/components/SortControls/SortControls.js
import React from 'react';
import './SortControls.css';
import { FaSortAlphaDown, FaSortAlphaUp, FaSortNumericDown, FaSortNumericUp, FaSort } from 'react-icons/fa';

const SortControls = ({ sortBy, sortOrder, onSortChange }) => {
    const getSortIcon = (column) => {
        if (sortBy === column) {
            return sortOrder === 'asc' ? <FaSortAlphaUp /> : <FaSortAlphaDown />;
        }
        return <FaSort />;
    };

    const handleSortClick = (column) => {
        let newSortOrder = 'asc';
        if (sortBy === column && sortOrder === 'asc') {
            newSortOrder = 'desc';
        }
        onSortChange(column, newSortOrder);
    };

    return (
        <div className="sort-controls">
            <span className="sort-label">Urutkan berdasarkan:</span>
            <button onClick={() => handleSortClick('nama_file_asli')} className={`sort-button ${sortBy === 'nama_file_asli' ? 'active' : ''}`}>
                Nama {getSortIcon('nama_file_asli')}
            </button>
            <button onClick={() => handleSortClick('uploader.name')} className={`sort-button ${sortBy === 'uploader.name' ? 'active' : ''}`}>
                Pemilik {getSortIcon('uploader.name')}
            </button>
            <button onClick={() => handleSortClick('updated_at')} className={`sort-button ${sortBy === 'updated_at' ? 'active' : ''}`}>
                Dimodifikasi {getSortIcon('updated_at')}
            </button>
        </div>
    );
};

export default SortControls;
