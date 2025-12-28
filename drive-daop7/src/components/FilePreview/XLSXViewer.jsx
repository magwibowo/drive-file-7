import React, { useState, useEffect } from 'react';
// Menggunakan pustaka xlsx dan react-data-grid
import * as XLSX from 'xlsx';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

// Styling untuk tombol sheet selector
const buttonBaseStyle = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '#ced4da',
  backgroundColor: '#ffffff',
  padding: '0.375rem 0.75rem',
  marginRight: '5px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'background-color 0.2s, color 0.2s',
};

const buttonActiveStyle = {
  ...buttonBaseStyle,
  backgroundColor: '#007bff',
  color: 'white',
  borderColor: '#007bff',
  cursor: 'default',
};

/**
 * Komponen pratinjau XLSX dengan header kolom dan baris yang "beku" (frozen).
 */
const XLSXViewer = ({ fileUrl }) => {
  const [sheets, setSheets] = useState([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setSheets([]);

    const fetchAndParseXlsx = async () => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Gagal mengunduh file Excel.');
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });

        const parsedSheets = workbook.SheetNames.map(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (jsonData.length === 0) {
            return { name: sheetName, columns: [], rows: [] };
          }
          
          const maxCols = jsonData.reduce((max, row) => Math.max(max, row.length), 0);

          const toExcelColumnName = (num) => {
            let s = '', t;
            while (num >= 0) {
              t = num % 26;
              s = String.fromCharCode(t + 65) + s;
              num = Math.floor(num / 26) - 1;
            }
            return s;
          };

          const excelColumns = [];
          for (let i = 0; i < maxCols; i++) {
            const key = `col${i}`;
            excelColumns.push({
              key: key,
              name: toExcelColumnName(i),
              resizable: true,
            });
          }

          const columns = [
            {
              key: 'rowNumber',
              name: '#',
              width: 50,
              resizable: false,
              frozen: true,
              renderCell: ({ row }) => <>{row.rowNumber}</>
            },
            ...excelColumns
          ];
          
          const rows = jsonData.map((rowData, index) => {
            const rowObject = { rowNumber: index + 1 };
            for (let i = 0; i < maxCols; i++) {
              rowObject[`col${i}`] = rowData[i];
            }
            return rowObject;
          });

          return { name: sheetName, columns, rows };
        });

        setSheets(parsedSheets);
      } catch (err) {
        console.error("Gagal mem-parsing file XLSX:", err);
        setError("Gagal memuat atau membaca file Excel. File mungkin rusak.");
      } finally {
        setIsLoading(false);
      }
    };

    if (fileUrl) {
      fetchAndParseXlsx();
    }
  }, [fileUrl]);

  if (isLoading) {
    return <p style={{ textAlign: 'center', paddingTop: '20px' }}>Memuat data spreadsheet...</p>;
  }

  if (error) {
    return <p style={{ textAlign: 'center', paddingTop: '20px', color: 'red' }}>{error}</p>;
  }
  
  const currentSheet = sheets[activeSheetIndex];
  
  if (!currentSheet || !currentSheet.columns) {
    return <p style={{ textAlign: 'center', paddingTop: '20px' }}>Gagal memuat sheet ini.</p>;
  }

  return (
    <>
      {/* --- PERBAIKAN DI SINI --- */}
      <div className="sheet-selector" style={{ 
          marginBottom: '10px', 
          padding: '8px', 
          backgroundColor: '#e9ecef', 
          borderRadius: '6px',
          overflowX: 'auto',      // Menambahkan scroll horizontal
          whiteSpace: 'nowrap'     // Mencegah tombol turun ke baris baru
        }}>
        {sheets.map((sheet, index) => (
          <button
            key={sheet.name}
            onClick={() => setActiveSheetIndex(index)}
            style={index === activeSheetIndex ? buttonActiveStyle : buttonBaseStyle}
          >
            {sheet.name}
          </button>
        ))}
      </div>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <DataGrid
          columns={currentSheet.columns}
          rows={currentSheet.rows}
          style={{ height: 'calc(80vh - 60px)' }}
          className="rdg-light"
        />
      </div>
    </>
  );
};

export default XLSXViewer;

