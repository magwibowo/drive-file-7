import React from 'react';

const PDFViewer = ({ fileUrl }) => {
  if (!fileUrl) {
    return <p style={{ textAlign: 'center', padding: '20px' }}>URL file tidak tersedia.</p>;
  }

  return (
    <div style={{ width: '100%', height: '80vh', border: '1px solid #ccc' }}>
      <iframe
        src={fileUrl}
        title="Pratinjau PDF"
        style={{ width: '100%', height: '100%', border: 'none' }}
      >
        <p>Browser Anda tidak mendukung pratinjau PDF. Silakan unduh file untuk melihatnya.</p>
      </iframe>
    </div>
  );
};

export default PDFViewer;

