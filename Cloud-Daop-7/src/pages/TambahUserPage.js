import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';
import { createUser } from '../services/api';
import './TambahUserPage.css';
import Notification from '../components/Notification/Notification';

const TambahUserPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', nipp: '', username: ''
    });
    const [errors, setErrors] = useState({});
    const [notification, setNotification] = useState({ isOpen: false, message: '', type: '' });
    const [showPassword, setShowPassword] = useState(false);

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
        if (!formData.password) newErrors.password = 'Password wajib diisi.';
        else if (formData.password.length < 8) newErrors.password = 'Password minimal 8 karakter.';
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
            await createUser(formData);
            setNotification({ isOpen: true, message: 'User berhasil dibuat!', type: 'success' });
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
                const errorMsg = error.response?.data?.message || 'Gagal membuat user.';
                setNotification({ isOpen: true, message: errorMsg, type: 'error' });
            }
        }
    };
    
    return (
        <div className="tambah-user-container">
            <div className="tambah-user-header">
                <h2>Buat User Baru</h2>
            </div>
            <form onSubmit={handleSubmit} className="form-card" noValidate>
                <div className="form-grid">
                    <div className="form-group">
                        <label>NIPP</label>
                        <input name="nipp" value={formData.nipp} onChange={handleChange} className="form-input" />
                        {errors.nipp && <p className="error-message-field">{errors.nipp}</p>}
                    </div>
                    <div className="form-group">
                        <label>Nama Lengkap</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="form-input" />
                        {errors.name && <p className="error-message-field">{errors.name}</p>}
                    </div>
                    <div className="form-group">
                        <label>Username</label>
                        <input name="username" value={formData.username} onChange={handleChange} className="form-input" />
                        {errors.username && <p className="error-message-field">{errors.username}</p>}
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
                        {errors.email && <p className="error-message-field">{errors.email}</p>}
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Password</label>
                        <div className="password-input-container">
                            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="form-input" />
                            <span onClick={() => setShowPassword(!showPassword)} className="password-toggle-icon">
                                {showPassword ? <VscEyeClosed /> : <VscEye />}
                            </span>
                        </div>
                        {errors.password && <p className="error-message-field">{errors.password}</p>}
                    </div>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate('/panel-admin/users')}>Batal</button>
                    <button type="submit" className="btn btn-primary">Simpan</button>
                </div>
            </form>
            {notification.isOpen && (
                <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ isOpen: false, message: '', type: '' })} />
            )}
        </div>
    );
};

export default TambahUserPage;