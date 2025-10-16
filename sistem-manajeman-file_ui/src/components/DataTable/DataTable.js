// src/components/DataTable/DataTable.js

import React from 'react';
import './DataTable.css';

const DataTable = ({ headers, data, renderRow }) => {
    return (
        <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        {headers.map((header, index) => (
                            <th key={index}>{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length > 0 ? (
                        data.map((item) => renderRow(item))
                    ) : (
                        <tr>
                            <td colSpan={headers.length} style={{ textAlign: 'center', padding: '2rem' }}>
                                Tidak ada data.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;