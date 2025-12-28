// src/components/FilterBar/FilterBar.js
import React from 'react';
import './FilterBar.css';
// Removed FaSortAlphaDown, FaSortAlphaUp as they are no longer needed

const FilterBar = ({ onFileTypeChange, onModifiedDateChange, onOwnerSearch, userRole, divisions, onDivisionChange }) => {
    return (
        <div className="filter-bar">
            <div className="filters">
                <select onChange={(e) => onFileTypeChange(e.target.value)} className="filter-dropdown">
                    <option value="">Jenis File</option>
                    <option value="pdf">PDF</option>
                    <option value="doc">DOC/DOCX</option>
                    <option value="xls">XLS/XLSX</option>
                    <option value="jpg">JPG/JPEG</option>
                    <option value="png">PNG</option>
                    <option value="txt">TXT</option>
                    {/* Add more file types as needed */}
                </select>

                <select onChange={(e) => onModifiedDateChange(e.target.value)} className="filter-dropdown">
                    <option value="">Modifikasi</option>
                    <option value="today">Hari Ini</option>
                    <option value="7days">7 Hari Terakhir</option>
                    <option value="30days">30 Hari Terakhir</option>
                    <option value="1year">Setahun Terakhir</option>
                </select>

                {userRole === 1 && (
                    <select onChange={(e) => onDivisionChange(e.target.value)} className="filter-dropdown">
                        <option value="">Semua Divisi</option>
                        {divisions.map(division => (
                            <option key={division.id} value={division.id}>{division.name}</option>
                        ))}
                    </select>
                )}

                <input
                    type="text"
                    placeholder="Cari Pemilik..."
                    onChange={(e) => onOwnerSearch(e.target.value)}
                    className="search-bar"
                />
            </div>
            {/* Removed sort-options div */}
        </div>
    );
};

export default FilterBar;
