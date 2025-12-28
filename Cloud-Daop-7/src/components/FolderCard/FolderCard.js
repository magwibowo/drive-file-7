// src/components/FolderCard/FolderCard.js

import React from 'react';
import { FaFolder } from 'react-icons/fa';
import './FolderCard.css';

const FolderCard = ({ folder, onClick }) => {
  return (
    <div className="folder-card" onClick={onClick} style={{ cursor: 'pointer' }}>
  <FaFolder className="folder-icon" style={{ color: '#FFCA28' }} />
      <span className="folder-name">{folder.name}</span>
    </div>
  );
};

export default FolderCard;
