import React from 'react';

// Impor viewer yang stabil dan berfungsi
import PDFViewer from './PDFViewer';
import DOCXViewer from './DOCXViewer';
import XLSXViewer from './XLSXViewer';
// Kita tidak lagi memanggil PPTXViewer karena akan ditangani secara internal

const FilePreview = ({ fileUrl, mimeType }) => {
  if (!fileUrl || !mimeType) {
    return <p style={{ padding: '20px', textAlign: 'center' }}>File atau tipe file tidak valid.</p>;
  }

  // --- Daftar MIME Type ---
  const officeMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc (tidak didukung pratinjau)
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
    'application/vnd.ms-excel', // .xls (tidak didukung pratinjau)
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-powerpoint', // .ppt (tidak didukung pratinjau)
  ];

  // --- Render Berdasarkan Tipe File ---

  // Tipe file dasar (Gambar, Video, Audio, Teks)
  if (mimeType.startsWith('image/')) {
    return <img src={fileUrl} alt="pratinjau" style={{ maxWidth: '100%', maxHeight: '80vh', display: 'block', margin: 'auto' }} />;
  }
  if (mimeType.startsWith('video/')) {
    return <video src={fileUrl} controls style={{ width: '100%', maxHeight: '80vh' }} />;
  }
  if (mimeType.startsWith('audio/')) {
    return <audio src={fileUrl} controls style={{ width: '100%' }} />;
  }
  if (mimeType.startsWith('text/')) {
    return <iframe src={fileUrl} title="Pratinjau Teks" style={{ width: '100%', height: '80vh', border: '1px solid #ccc' }} />;
  }

  // Pratinjau PDF
  if (mimeType === 'application/pdf') {
     return <PDFViewer fileUrl={fileUrl} />;
  }
  
  // Penanganan untuk semua file Office
  if (officeMimeTypes.includes(mimeType)) {
    // Gunakan switch untuk memilih viewer yang tepat
    switch (mimeType) {
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return <DOCXViewer fileUrl={fileUrl} />;
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return <XLSXViewer fileUrl={fileUrl} />;
      
      // PERBAIKAN: Tangani PPTX secara eksplisit dengan pesan informatif
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        return (
          <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #ccc', margin: '20px' }}>
            <h3>Pratinjau Tidak Diaktifkan</h3>
            <p>Fitur pratinjau untuk file presentasi (PPTX) tidak diaktifkan untuk menjaga stabilitas sistem.</p>
            <p>Silakan <strong>unduh file</strong> untuk melihat isinya.</p>
          </div>
        );
      
      default:
        // Fallback untuk format Office lama (.doc, .xls, .ppt)
        return (
          <div style={{ padding: '20px', textAlign: 'center', border: '1px solid #ccc', margin: '20px' }}>
            <h3>Pratinjau Tidak Didukung</h3>
            <p>Pratinjau untuk format file Office yang lebih lama (.doc, .xls, .ppt) tidak didukung.</p>
            <p>Silakan <strong>unduh file</strong> untuk melihat isinya.</p>
          </div>
        );
    }
  }
  
  // Fallback jika tipe file tidak didukung sama sekali
  return <p style={{ padding: '20px', textAlign: 'center' }}>Pratinjau tidak tersedia untuk tipe file ini.</p>;
};

export default FilePreview;

