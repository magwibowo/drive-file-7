import React from "react";

// Komponen baru untuk tombol-tombol paginasi
const Pagination = ({ itemsPerPage, totalItems, paginate, currentPage }) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  if (pageNumbers.length <= 1) {
    return null; // Jangan tampilkan paginasi jika hanya ada 1 halaman
  }

  return (
    <nav>
      <ul className="pagination">
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
            <a onClick={() => paginate(number)} href="#!" className="page-link">
              {number}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};


export default function BackupTable({ 
  backups, 
  onDownload, 
  onDelete, 
  loading,
  itemsPerPage,
  totalBackups,
  paginate,
  currentPage
}) {

  // Helper format ukuran file
  const formatSize = (size) => {
    // ... (Fungsi ini tidak perlu diubah)
    if (!size) return "0 B";
    const i = Math.floor(Math.log(size) / Math.log(1024));
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    return (size / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
  };

  // Helper format tanggal
  const formatDate = (dateString) => {
    // ... (Fungsi ini tidak perlu diubah)
    if (!dateString) return "-";
    const date = new Date(dateString);
    // Format yang lebih mudah dibaca: DD-MM-YYYY HH:MM:SS
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date).replace(/\./g, ':').replace(/,/, '');
  };

  return (
    <div className="backup-table">
      <table>
        <thead>
          <tr>
            <th>Nama File</th>
            <th>Ukuran</th>
            <th>Tanggal</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>Memuat data...</td>
            </tr>
          ) : backups.length > 0 ? (
            backups.map((backup) => (
              <tr key={backup.id}>
                <td>{backup.filename}</td>
                <td>{formatSize(backup.size)}</td>
                <td>{formatDate(backup.created_at)}</td>
                <td>
                  <button
                    className="btn btn-success"
                    onClick={() => onDownload(backup.id)}
                  >
                    ⬇️ Download
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => onDelete(backup.id)}
                  >
                    🗑️ Hapus
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                Belum ada backup tersedia
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* --- PENAMBAHAN KOMPONEN PAGINASI DI BAWAH TABEL --- */}
      <div className="pagination-container">
        <Pagination 
          itemsPerPage={itemsPerPage}
          totalItems={totalBackups}
          paginate={paginate}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
}