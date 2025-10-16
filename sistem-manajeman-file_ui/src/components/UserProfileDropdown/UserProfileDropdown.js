import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './UserProfileDropdown.css';
import { FaUserCircle, FaSignOutAlt, FaUserEdit, FaShieldAlt } from 'react-icons/fa';

const UserProfileDropdown = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    return (
        <div className="profile-dropdown" ref={dropdownRef}>
            <div className="profile-trigger" onClick={() => setIsOpen(!isOpen)}>
                <span role="img" aria-label="notifications">🔔</span>
                <span>{user?.name || 'User'}</span>
                <FaUserCircle size={24} />
            </div>

            {isOpen && (
                <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                        <FaUserEdit />
                        <span>Profil Saya</span>
                    </Link>

                    {/* Memeriksa 'user.role.name' untuk Admin Devisi */}
                    {user?.role?.name === 'admin_devisi' && (
                        <Link to="/panel-admin" className="dropdown-item">
                            <FaShieldAlt />
                            <span>Panel Admin</span>
                        </Link>
                    )}
                    
                    {/* Memeriksa 'user.role.name' untuk Super Admin */}
                    {user?.role?.name === 'super_admin' && (
                        // PASTIKAN LINK-NYA MENGARAH KE RUTE YANG BENAR
                        <Link to="/super-admin/beranda" className="dropdown-item">
                            <FaShieldAlt />
                            <span>Panel Super Admin</span>
                        </Link>
                    )}
                    
                    <hr className="dropdown-divider" />
                    <button onClick={handleLogout} className="logout-button">
                        <FaSignOutAlt />
                        <span>Logout</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserProfileDropdown;