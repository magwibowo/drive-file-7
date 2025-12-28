import React from 'react';
import {
    FaFile,
    FaFilePdf,
    FaFileWord,
    FaFileExcel,
    FaFilePowerpoint,
    FaFileImage,
    FaFileAlt,
    FaFileArchive,
    FaFileVideo,
    FaFileAudio,    
} from 'react-icons/fa';

const getFileIcon = (mimeType, fileName, size = 20) => {
    const extension = fileName ? fileName.split('.').pop().toLowerCase() : '';

    if (mimeType.includes('pdf')) {
        return <FaFilePdf size={size} color="#dc3545" />;
    } else if (mimeType.includes('word') || extension === 'doc' || extension === 'docx') {
        return <FaFileWord size={size} color="#007bff" />;
    } else if (mimeType.includes('excel') || extension === 'xls' || extension === 'xlsx'|| extension === 'csv' || extension === 'tsv' || extension === 'ods'|| extension === 'fods'|| extension === 'ots'|| extension === 'dif'|| extension === 'xml') {
        return <FaFileExcel size={size} color="#28a745" />;
    } else if (mimeType.includes('powerpoint') || extension === 'ppt' || extension === 'pptx') {
        return <FaFilePowerpoint size={size} color="#ffc107" />;
    } else if (mimeType.includes('image')) {
        return <FaFileImage size={size} color="#6f42c1" />;
    } else if (mimeType.includes('text')) {
        return <FaFileAlt size={size} color="#6c757d" />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || extension === 'zip' || extension === 'rar') {
        return <FaFileArchive size={size} color="#fd7e14" />;
    } else if (mimeType.includes('video') || mimeType.includes('mp4') || extension === 'mp4') {
        return <FaFileVideo size={size} color="#c7b709ff" />;
    } else if (mimeType.includes('audio') || mimeType.includes('mp3') || extension === 'wav' || extension === 'ogg') {
        return <FaFileAudio size={size} color="#00CED1" />;
    } else {
        return <FaFile size={size} color="#343a40" />;
    }
};

export default getFileIcon;