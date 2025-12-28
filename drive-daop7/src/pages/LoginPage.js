// src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkLoginLockout } from '../services/api'; // Import the lockout checker
import './LoginPage.css';
import { VscError, VscEye, VscEyeClosed } from "react-icons/vsc";

const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    // State untuk mengelola lockout
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutTime, setLockoutTime] = useState(0);

    // Fungsi untuk memulai timer countdown
    const startLockoutTimer = (remainingTime) => {
        setIsLocked(true);
        setLockoutTime(Math.ceil(remainingTime / 1000));

        const interval = setInterval(() => {
            setLockoutTime(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(interval);
                    setIsLocked(false);
                    setError(''); // Hapus pesan error setelah lockout selesai
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
    };

    // Periksa status lockout saat komponen pertama kali dimuat
    useEffect(() => {
        const { isLocked: currentlyLocked, remainingTime } = checkLoginLockout();
        if (currentlyLocked) {
            startLockoutTimer(remainingTime);
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLocked) return; // Jangan lakukan apa-apa jika sedang di-lock
        setError('');
        try {
            await login(loginInput, password);
            navigate('/dashboard');
        } catch (err) {
            const errorMessage = err.message || 'Login gagal. Periksa kembali kredensial Anda.';
            setError(errorMessage);

            // Periksa status penguncian setiap kali login gagal
            const { isLocked: currentlyLocked, remainingTime } = checkLoginLockout();
            if (currentlyLocked) {
                startLockoutTimer(remainingTime);
            }
        }
    };

    return (
        <div className="login-page">
            <div className="left-pane">
                <div className="overlay">
                    <img src={process.env.PUBLIC_URL + '/images/KAIwhite.svg'} alt="KAI Logo" className="overlay-title" />
                    <img src={process.env.PUBLIC_URL + '/images/DAOP7DRV.svg'} alt="DAOP7DRV Logo" className="overlay-subtitle daop7drv-logo" />
                    <p className="overlay-subtitle">PT. Kereta Api Indonesia<br></br> Daerah Operasi 7 Madiun</p>
                </div>
            </div>

            <div className="right-pane">
                <div className="login-box">
                    <h2 className="title">Login</h2>
                    <div className="title-underline"></div>
                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>Email atau NIPP</label>
                            <input
                                type="text"
                                value={loginInput}
                                onChange={(e) => setLoginInput(e.target.value)}
                                required
                                placeholder="masukan email atau nipp yang sudah terdaftar"
                                disabled={isLocked} // Disable input saat di-lock
                            />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    disabled={isLocked}
                                />
                                <span onClick={() => setShowPassword(!showPassword)} className="password-toggle-icon">
                                    {showPassword ? <VscEyeClosed /> : <VscEye />}
                                </span>
                            </div>
                        </div>

                        {error && (
                            <div className="error-message">
                                <VscError size={20} />
                                <span>{isLocked ? `Terlalu banyak percobaan. Coba lagi dalam ${lockoutTime} detik.` : error}</span>
                            </div>
                        )}
                        
                        <button type="submit" className="login-button" disabled={isLocked}>
                            {isLocked ? `Tunggu ${lockoutTime}s` : 'Masuk'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;