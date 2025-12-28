import React, { useEffect, useRef } from 'react';
// Menggunakan pustaka docx-preview
import { renderAsync } from 'docx-preview';

/**
 * Komponen untuk menampilkan pratinjau file DOCX secara aman di browser.
 */
const DOCXViewer = ({ fileUrl }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && fileUrl) {
      // Ambil data file sebagai blob
      fetch(fileUrl)
        .then(response => response.blob())
        .then(blob => {
          // Render blob di dalam container div
          renderAsync(blob, containerRef.current)
            .then(res => console.log("Pratinjau DOCX berhasil dirender."))
            .catch(err => console.error("Gagal merender DOCX:", err));
        })
        .catch(err => console.error("Gagal mengambil file DOCX:", err));
    }
  }, [fileUrl]); // Efek ini akan berjalan saat fileUrl berubah

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '80vh',
        overflowY: 'auto',
        border: '1px solid #ccc',
        padding: '20px',
        backgroundColor: 'white'
      }}
    />
  );
};

export default DOCXViewer;

