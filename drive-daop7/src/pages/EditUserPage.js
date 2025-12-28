import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, updateUser } from '../services/api';
import './TambahUserPage.css'; // Menggunakan CSS yang sama dengan TambahUserPage
import Notification from '../components/Notification/Notification';

const EditUserPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', nipp: '', username: '' });
    const [errors, setErrors] = useState({});
    const [notification, setNotification] = useState({ isOpen: false, message: '', type: '' });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await getUserById(userId);
                setFormData(response.data);
            } catch (error) {
                console.error("Gagal mengambil data user", error);
                setNotification({ isOpen: true, message: 'Gagal memuat data user.', type: 'error' });
            }
        };
        fetchUser();
    }, [userId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nama lengkap wajib diisi.';
        if (!formData.email.trim()) newErrors.email = 'Email wajib diisi.';
        if (!formData.nipp.trim()) newErrors.nipp = 'NIPP wajib diisi.';
        else if (!/^\d{5,}$/.test(formData.nipp)) newErrors.nipp = 'NIPP harus berupa angka dan minimal 5 digit.';
        if (!formData.username.trim()) newErrors.username = 'Username wajib diisi.';
        else if (!/^[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/.test(formData.username)) {
            newErrors.username = 'Username hanya boleh berisi huruf kecil, angka, serta titik atau underscore di tengah.';
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        try {
            await updateUser(userId, formData);
            setNotification({ isOpen: true, message: 'User berhasil diperbarui!', type: 'success' });
            setTimeout(() => {
                navigate('/panel-admin/users');
            }, 2000);
        } catch (error) {
            const errorData = error.response?.data?.errors;
            if (errorData) {
                const backendErrors = {};
                for (const field in errorData) {
                    backendErrors[field] = errorData[field][0];
                }
                setErrors(backendErrors);
            } else {
                setNotification({ isOpen: true, message: 'Gagal memperbarui user.', type: 'error' });
            }
        }
    };
    
    return (
        <div className="tambah-user-container">
            <div className="tambah-user-header">
                <h2>Edit User</h2>
            </div>
            <form onSubmit={handleSubmit} className="form-card" noValidate>
                <div className="form-grid">
                    <div className="form-group">
                        <label>NIPP</label>
                        <input name="nipp" value={formData.nipp || ''} onChange={handleChange} className="form-input" />
                        {errors.nipp && <p className="error-message-field">{errors.nipp}</p>}
                    </div>
                    <div className="form-group">
                        <label>Nama Lengkap</label>
                        <input name="name" value={formData.name || ''} onChange={handleChange} className="form-input" />
                        {errors.name && <p className="error-message-field">{errors.name}</p>}
                    </div>
                    <div className="form-group">
                        <label>Username</label>
                        <input name="username" value={formData.username || ''} onChange={handleChange} className="form-input" />
                        {errors.username && <p className="error-message-field">{errors.username}</p>}
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className="form-input" />
                        {errors.email && <p className="error-message-field">{errors.email}</p>}
                    </div>
                </div>
                <div className="form-actions">
                     <button type="button" className="btn btn-secondary" onClick={() => navigate('/panel-admin/users')}>Batal</button>
                    <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
                </div>
            </form>
            {notification.isOpen && (
                <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ isOpen: false, message: '', type: '' })} />
            )}
        </div>
    );
};

export default EditUserPage;

