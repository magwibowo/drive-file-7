import React, { useState, useEffect, useRef } from 'react';
import './CustomDropdown.css';

const CustomDropdown = ({ options, onSelect, triggerText }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleSelect = (option) => {
        onSelect(option);
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="custom-dropdown" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="dropdown-trigger-b">
                {triggerText}
                <i className={`arrow ${isOpen ? 'up' : 'down'}`}></i>
            </button>
            {isOpen && (
                <div className="dropdown-menu-b">
                    {options.map(option => (
                        <button key={option.id} onClick={() => handleSelect(option)} className="dropdown-item-b">
                            {option.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
