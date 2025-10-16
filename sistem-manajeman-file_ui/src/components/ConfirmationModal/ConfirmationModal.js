import React from 'react';
import Modal from '../Modal/Modal'; // Menggunakan komponen Modal dasar
import { FaSave, FaTimes } from 'react-icons/fa';
import './ConfirmationModal.css';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    message, 
    confirmText = "Ya, Lanjutkan", 
    cancelText = "Batal",
    confirmIcon: ConfirmIcon = FaSave,
    cancelIcon: CancelIcon = FaTimes,
    isDanger = false,
    customActions
}) => {
    if (!isOpen) return null;

    const confirmButtonClassName = isDanger 
        ? "modal-button confirm-button danger" 
        : "modal-button confirm-button";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Konfirmasi Tindakan">
            <div className="confirmation-modal-body">
                <p>{message}</p>
                <div className="confirmation-modal-actions">
                    {customActions}
                    <button onClick={onClose} className="modal-button cancel-button">
                        <CancelIcon /> {cancelText}
                    </button>
                    <button onClick={onConfirm} className={confirmButtonClassName}>
                        <ConfirmIcon /> {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;