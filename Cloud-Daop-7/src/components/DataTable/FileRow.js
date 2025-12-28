// src/components/DataTable/FileRow.js
import React from 'react';
import { FaFileAlt, FaPen, FaTrash } from 'react-icons/fa';
import { formatDate, formatSize } from '../../utils/formatters'; // Import from utils

const FileRow = ({ file, onEdit, onDelete }) => {
    

    

    return (
        <tr>
            <td><FaFileAlt className="me-2" /> {file.nama_file_asli || file.name}</td>
            <td>-</td> {/* Kolom Divisi bisa diisi jika perlu */}
            <td>{file.uploader.name}</td>
            <td>{formatDate(file.updated_at)}</td>
            <td>{formatSize(file.ukuran_file)}</td>
            <td>
                <button className="btn btn-sm btn-link" onClick={() => onEdit(file.id)}><FaPen /></button>
                <button className="btn btn-sm btn-link text-danger" onClick={() => onDelete(file.id)}><FaTrash /></button>
            </td>
        </tr>
    );
};

export default FileRow;