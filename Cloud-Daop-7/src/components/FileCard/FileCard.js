// src/components/FileCard/FileCard.js
import React from 'react';
import './FileCard.css';
import { FaStar, FaRegStar } from 'react-icons/fa';
import { truncateFilename } from '../../utils/formatters';
import getFileIcon from '../../utils/fileIcons';

const FileCard = ({ file, onPreview, onToggleFavorite, onSelect, isSelected }) => {

    const handleCardClick = (e) => {
        // Prevent card click from triggering when clicking on favorite button
        if (e.target.closest('.favorite-button-grid')) {
            return;
        }
        onSelect(file.id, !isSelected);
    };

    const handlePreviewClick = (e) => {
        // Allow preview and stop propagation to avoid selection
        e.stopPropagation();
        onPreview(file);
    }

    return (
        <div className={`file-card ${isSelected ? 'selected' : ''}`} onClick={handleCardClick}>
            <div className="file-card-icon" onClick={handlePreviewClick}>
                {getFileIcon(file.tipe_file, file.nama_file_asli, 50)}
            </div>
            <div className="file-card-name-container">
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(file); }} className="action-button favorite-button-grid" title="Favorite">
                    {file.is_favorited ? <FaStar color="#ffc107" /> : <FaRegStar color="#6c757d" />}
                </button>
                <p className="file-card-name" title={file.nama_file_asli}>
                    {truncateFilename(file.nama_file_asli, 20)}
                </p>
            </div>
            <div className="file-card-info">
                <span>{new Date(file.updated_at).toLocaleDateString('id-ID')}</span>
                <span>{(file.ukuran_file / 1024).toFixed(2)} KB</span>
            </div>
        </div>
    );
};

export default FileCard;
