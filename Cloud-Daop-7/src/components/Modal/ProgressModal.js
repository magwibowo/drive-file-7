import React from 'react';
import './ProgressModal.css'; // You'll need to create this CSS file
import { formatSize, truncateFilename } from '../../utils/formatters'; // Import formatSize and truncateFilename

const ProgressModal = ({ isOpen, filesToUpload, onCancel, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="progress-modal-overlay">
            <div className="progress-modal-content">
                <h2>Mengunggah File ({filesToUpload.filter(f => f.status === 'uploading' || f.status === 'completed').length} / {filesToUpload.length})</h2>
                <div className="upload-list">
                    {filesToUpload.map((file, index) => (
                        <div key={file.id || index} className="upload-item">
                            <div className="file-info">
                                <p className="file-name">{truncateFilename(file.file?.name || '', 45)}</p>
                                <p className="upload-size-info">
                                    {formatSize(file.uploadedBytes)} / {formatSize(file.totalBytes)}
                                </p>
                            </div>
                            <div className="progress-bar-wrapper">
                                <div className="progress-bar-container">
                                    <div className="progress-bar" style={{ width: `${file.progress}%` }}>
                                        {file.progress}%
                                    </div>
                                </div>
                                <button className="cancel-button" onClick={() => onCancel(file.id)}>X</button>
                            </div>
                            <p className="file-status">{file.status}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProgressModal;