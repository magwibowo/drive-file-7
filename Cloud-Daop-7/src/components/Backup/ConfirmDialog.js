import React from 'react';

const ConfirmDialog = ({ isOpen, onConfirm, onCancel, title, message, details }) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>⚠️ {title}</h3>
        </div>
        <div style={styles.body}>
          <p style={styles.message}>{message}</p>
          {details && (
            <div style={styles.details}>
              {details.map((detail, index) => (
                <div key={index} style={styles.detailItem}>
                  • {detail}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={styles.footer}>
          <button onClick={onCancel} style={styles.cancelBtn}>
            Batal
          </button>
          <button onClick={onConfirm} style={styles.confirmBtn}>
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
    overflow: 'hidden',
  },
  header: {
    padding: '20px 24px',
    backgroundColor: '#fff3cd',
    borderBottom: '1px solid #ffc107',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#856404',
  },
  body: {
    padding: '24px',
  },
  message: {
    fontSize: '15px',
    color: '#333',
    marginBottom: '16px',
    lineHeight: '1.5',
  },
  details: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    padding: '12px 16px',
  },
  detailItem: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '6px',
    lineHeight: '1.4',
  },
  footer: {
    padding: '16px 24px',
    backgroundColor: '#f8f9fa',
    borderTop: '1px solid #dee2e6',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  confirmBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
};

export default ConfirmDialog;
