// src/components/NewSidebar/NewSidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import './NewSidebar.css';
// Anda perlu install react-icons: npm install react-icons
import { FaFolder, FaClock, FaStar, FaTrash } from 'react-icons/fa';

const NewSidebar = () => {
    return (
        <aside className="new-sidebar">
            <div className="sidebar-logo">
               <img src={process.env.PUBLIC_URL + '/images/DAOP7DRVbar.svg'} alt="Logo" className="sidebar-logo-img" />
            </div>
            <ul className="sidebar-menu">
                <li className="menu-item">
                    <NavLink to="/dashboard" end> <FaFolder /> File Divisi </NavLink>
                </li>
                <li className="menu-item">
                    <NavLink to="/terbaru"> <FaClock /> Terbaru </NavLink>
                </li>
                <li className="menu-item">
                    <NavLink to="/favorit"> <FaStar /> Favorit </NavLink>
                </li>
                <li className="menu-item">
                    <NavLink to="/sampah"> <FaTrash /> Sampah </NavLink>
                </li>
            </ul>
            <div className="sidebar-storage">
                {/* <p>Penyimpanan</p>
                <div className="storage-bar">
                    <div className="storage-bar-fill"></div>
                </div>
                <p className="storage-text">128 GB dari 512 GB</p> */}
            </div>
        </aside>
    );
};

export default NewSidebar;