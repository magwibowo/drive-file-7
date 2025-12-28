// src/pages/AdminPage.js
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Link } from 'react-router-dom';

const AdminPage = () => {
    const [divisions, setDivisions] = useState([]);
    const [newDivisionName, setNewDivisionName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDivisions();
    }, []);

    const fetchDivisions = async () => {
        try {
            const response = await apiClient.get('/api/admin/divisions');
            setDivisions(response.data);
        } catch (error) {
            console.error('Failed to fetch divisions', error);
        }
    };

    const handleCreateDivision = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await apiClient.post('/api/admin/divisions', { name: newDivisionName });
            setDivisions([...divisions, response.data]); // Tambah ke daftar
            setNewDivisionName(''); // Reset form
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal membuat divisi.');
        }
    };

    return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <Link to="/dashboard"> &larr; Kembali ke Dashboard</Link>
            <h1>Panel Admin - Manajemen Divisi</h1>

            <div style={{ marginBottom: '40px' }}>
                <h3>Buat Divisi Baru</h3>
                <form onSubmit={handleCreateDivision}>
                    <input
                        type="text"
                        value={newDivisionName}
                        onChange={(e) => setNewDivisionName(e.target.value)}
                        placeholder="Nama Divisi Baru"
                        required
                    />
                    <button type="submit">Tambah Divisi</button>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                </form>
            </div>

            <div>
                <h3>Daftar Divisi</h3>
                <ul>
                    {divisions.map(division => (
                        <li key={division.id}>{division.name}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AdminPage;