import React, { useState, useEffect } from 'react';
import { VscEye, VscEyeClosed } from 'react-icons/vsc';
import apiClient from '../../services/api';
import Modal from '../Modal/Modal';
import './PenggunaFormModal.css';

const PenggunaFormModal = ({ isOpen, onClose, onSave, userToEdit }) => {
    const initialFormData = {
        name: '', email: '', nipp: '', username: '',
        password: '', role_id: '', division_id: '',
    };
    const [formData, setFormData] = useState(initialFormData);
    const [roles, setRoles] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDivisionDisabled, setIsDivisionDisabled] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isEditMode = userToEdit !== null;

    useEffect(() => {
        if (isOpen) {
            const fetchDataForDropdowns = async () => {
                try {
                    const [rolesRes, divisionsRes] = await Promise.all([
                        apiClient.get('/admin/roles'),
                        apiClient.get('/admin/divisions')
                    ]);
                    setRoles(rolesRes.data);
                    setDivisions(divisionsRes.data);
                } catch (err) {
                    console.error("Gagal mengambil data untuk dropdown", err);
                }
            };
            fetchDataForDropdowns();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            if (isEditMode && userToEdit) {
                const roleId = userToEdit.role_id || '';
                const selectedRole = roles.find(r => r.id === roleId);
                const shouldDisableDivision = selectedRole && selectedRole.name === 'super_admin';
                setIsDivisionDisabled(shouldDisableDivision);

                setFormData({
                    name: userToEdit.name || '',
                    email: userToEdit.email || '',
                    nipp: userToEdit.nipp || '',
                    username: userToEdit.username || '',
                    password: '',
                    role_id: roleId,
                    division_id: shouldDisableDivision ? '' : (userToEdit.division_id || ''),
                });
            } else {
                setFormData(initialFormData);
                setIsDivisionDisabled(false);
            }
            setErrors({});
        }
    }, [userToEdit, isOpen, isEditMode, roles]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let newFormData = { ...formData, [name]: value };

        if (name === 'role_id') {
            const selectedRole = roles.find(r => r.id === parseInt(value, 10));
            if (selectedRole && selectedRole.name === 'super_admin') {
                setIsDivisionDisabled(true);
                newFormData.division_id = ''; // Reset divisi
            } else {
                setIsDivisionDisabled(false);
            }
        }
        
        setFormData(newFormData);
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Nama lengkap wajib diisi.';
        if (!formData.email.trim()) newErrors.email = 'Email wajib diisi.';
        if (!formData.role_id) newErrors.role_id = 'Peran wajib dipilih.';
        if (!isDivisionDisabled && !formData.division_id) {
            newErrors.division_id = 'Divisi wajib dipilih.';
        }
        if (!formData.nipp.trim()) {
            newErrors.nipp = 'NIPP wajib diisi.';
        } else if (!/^\d{5,}$/.test(formData.nipp)) {
            newErrors.nipp = 'NIPP harus berupa angka dan minimal 5 digit.';
        }
        if (!formData.username.trim()) {
            newErrors.username = 'Username wajib diisi.';
        } else if (!/^[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/.test(formData.username)) {
            newErrors.username = 'Username hanya boleh berisi huruf kecil, angka, serta titik atau underscore di tengah.';
        }
        if (!isEditMode && !formData.password) {
            newErrors.password = 'Password wajib diisi.';
        }
        if (formData.password && formData.password.length < 8) {
            newErrors.password = 'Password minimal 8 karakter.';
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

        setIsSubmitting(true);
        setErrors({});

        const dataToSubmit = { ...formData };
        if (isEditMode && !dataToSubmit.password) {
            delete dataToSubmit.password;
        }

        try {
            if (isEditMode) {
                await apiClient.put(`/admin/users/${userToEdit.id}`, dataToSubmit);
            } else {
                await apiClient.post('/admin/users', dataToSubmit);
            }
            onSave();
            onClose();
        } catch (err) {
            const errorData = err.response?.data?.errors;
            if (errorData) {
                const backendErrors = {};
                for (const field in errorData) {
                    backendErrors[field] = errorData[field][0];
                }
                setErrors(backendErrors);
            } else {
                setErrors({ general: 'Terjadi kesalahan yang tidak diketahui.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}>
            <form onSubmit={handleSubmit} className="pengguna-form" noValidate>
                {errors.general && <p className="error-message-general">{errors.general}</p>}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="nipp">NIPP</label>
                        <input id="nipp" name="nipp" type="text" value={formData.nipp} onChange={handleInputChange} />
                        {errors.nipp && <p className="error-message-field">{errors.nipp}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="name">Nama Lengkap</label>
                        <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} />
                        {errors.name && <p className="error-message-field">{errors.name}</p>}
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input id="username" name="username" type="text" value={formData.username} onChange={handleInputChange} />
                        {errors.username && <p className="error-message-field">{errors.username}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
                        {errors.email && <p className="error-message-field">{errors.email}</p>}
                    </div>
                </div>
                <div className="form-group full-width">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-container">
                        <input id="password" name="password" type={showPassword ? "text" : "password"} onChange={handleInputChange} placeholder={isEditMode ? 'Kosongkan jika tidak ingin diubah' : ''} />
                        <span onClick={() => setShowPassword(!showPassword)} className="password-toggle-icon">
                            {showPassword ? <VscEyeClosed /> : <VscEye />}
                        </span>
                    </div>
                    {errors.password && <p className="error-message-field">{errors.password}</p>}
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="role_id">Peran (Role)</label>
                        <select id="role_id" name="role_id" value={formData.role_id} onChange={handleInputChange}>
                            <option value="">Pilih Peran</option>
                            {roles.map(role => (<option key={role.id} value={role.id}>{role.name}</option>))}
                        </select>
                        {errors.role_id && <p className="error-message-field">{errors.role_id}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="division_id">Divisi</label>
                        <select id="division_id" name="division_id" value={formData.division_id} onChange={handleInputChange} disabled={isDivisionDisabled}>
                            <option value="">Pilih Divisi</option>
                            {divisions.map(division => (<option key={division.id} value={division.id}>{division.name}</option>))}
                        </select>
                        {errors.division_id && <p className="error-message-field">{errors.division_id}</p>}
                    </div>
                </div>
                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Batal</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button>
                </div>
            </form>
        </Modal>
    );
};

export default PenggunaFormModal;