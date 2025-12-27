import React from 'react';

const BackupProgress = ({ isCreating, message = 'Sedang membuat backup...' }) => {
  if (!isCreating) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.iconContainer}>
          <div style={styles.spinner}></div>
          <div style={styles.checkmark}>💾</div>
        </div>
        <h3 style={styles.title}>{message}</h3>
        <div style={styles.steps}>
          <div style={styles.step}>
            <span style={styles.stepIcon}>📊</span>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>Dumping Database</div>
              <div style={styles.stepDesc}>Mengekspor data dari MySQL...</div>
            </div>
          </div>
          <div style={styles.step}>
            <span style={styles.stepIcon}>📦</span>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>Compressing Files</div>
              <div style={styles.stepDesc}>Membuat file ZIP dengan kompresi...</div>
            </div>
          </div>
          <div style={styles.step}>
            <span style={styles.stepIcon}>☁️</span>
            <div style={styles.stepContent}>
              <div style={styles.stepTitle}>Uploading to NAS</div>
              <div style={styles.stepDesc}>Menyimpan ke Z:\\backups...</div>
            </div>
          </div>
        </div>
        <div style={styles.progressBar}>
          <div style={styles.progressFill}></div>
        </div>
        <p style={styles.hint}>⏳ Proses ini memakan waktu 10-30 detik. Mohon jangan tutup halaman ini.</p>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '550px',
    width: '90%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    animation: 'slideIn 0.3s ease-out',
  },
  iconContainer: {
    position: 'relative',
    width: '80px',
    height: '80px',
    margin: '0 auto 20px',
  },
  spinner: {
    border: '6px solid #f3f3f3',
    borderTop: '6px solid #007bff',
    borderRadius: '50%',
    width: '80px',
    height: '80px',
    animation: 'spin 1s linear infinite',
  },
  checkmark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '32px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: '30px',
    marginTop: '10px',
  },
  steps: {
    textAlign: 'left',
    marginBottom: '25px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '20px',
  },
  step: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    padding: '12px 0',
    borderBottom: '1px solid #e9ecef',
  },
  stepIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
  },
  stepDesc: {
    fontSize: '13px',
    color: '#666',
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e9ecef',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #007bff, #0056b3)',
    animation: 'progress 2s ease-in-out infinite',
  },
  hint: {
    fontSize: '13px',
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: '15px',
    marginBottom: 0,
  },
};

// Add keyframe animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    from { 
      opacity: 0;
      transform: translateY(-30px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes progress {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
  }
`;
document.head.appendChild(styleSheet);

export default BackupProgress;
