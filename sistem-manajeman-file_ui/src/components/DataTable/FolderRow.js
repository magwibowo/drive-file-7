// src/components/DataTable/FolderRow.js
import React from 'react';
import { FaFolder, FaPen, FaTrash } from 'react-icons/fa';

const FolderRow = ({ folder, onDoubleClick, onDeleteClick }) => {
    // Contoh format tanggal (kalau butuh)
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    return (
        <tr
            onDoubleClick={() => onDoubleClick && onDoubleClick(folder.id, folder.name)}
            style={{ cursor: 'pointer' }}
        >
            {/* Contoh kolom nama folder */}
            <td><FaFolder className="me-2" /> {folder.name}</td>

            {/* Contoh kolom tanggal dibuat */}
            <td>{formatDate(folder.created_at)}</td>

            {/* Kolom aksi */}
            <td>
                <button
                    className="btn btn-sm btn-link"
                    onClick={(e) => { e.stopPropagation(); /* untuk cegah double click */ }}
                >
                    <FaPen />
                </button>

                <button
                    className="btn btn-sm btn-link text-danger"
                    onClick={(e) => { 
                        e.stopPropagation(); // cegah trigger double click
                        onDeleteClick && onDeleteClick(folder);
                    }}
                >
                    <FaTrash />
                </button>
            </td>
        </tr>
    );
};

export default FolderRow;
