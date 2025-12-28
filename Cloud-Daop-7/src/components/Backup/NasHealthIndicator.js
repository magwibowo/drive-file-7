import { useState, useEffect } from "react";

const NasHealthIndicator = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const fetchHealth = async () => {
    try {
      const { fetchNasHealth } = await import('../../services/api');
      const response = await fetchNasHealth();
      setHealth(response.data);
    } catch (error) {
      console.error("Failed to fetch NAS health:", error);
      setHealth({ status: 'error', warnings: ['Unable to connect to server'] });
    } finally {
      setLoading(false);
    }
  };

  const testWrite = async () => {
    setTesting(true);
    try {
      const { testNasWrite } = await import('../../services/api');
      await testNasWrite();
      alert('✅ NAS write test successful!');
      fetchHealth(); // Refresh health status
    } catch (error) {
      alert('❌ NAS write test failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div style={styles.container}>⏳ Checking NAS status...</div>;
  }

  if (!health) {
    return null;
  }

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy': return '#28a745';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div style={{...styles.container, borderColor: getStatusColor()}}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.icon}>{getStatusIcon()}</span>
          <div>
            <div style={styles.title}>NAS Storage Health</div>
            <div style={styles.subtitle}>{health.drive_path}</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={fetchHealth} style={styles.refreshBtn} title="Refresh">
            🔄 Refresh
          </button>
          <button 
            onClick={testWrite} 
            disabled={testing || !health.is_mounted}
            style={{
              ...styles.testBtn,
              opacity: (testing || !health.is_mounted) ? 0.5 : 1
            }}
          >
            {testing ? '⏳ Testing...' : '🧪 Test Write'}
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Status</div>
          <div style={{...styles.metricValue, color: getStatusColor()}}>
            {health.status.toUpperCase()}
          </div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Mounted</div>
          <div style={{...styles.metricValue, color: health.is_mounted ? '#28a745' : '#dc3545'}}>
            {health.is_mounted ? '✅ Yes' : '❌ No'}
          </div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Writable</div>
          <div style={{...styles.metricValue, color: health.is_writable ? '#28a745' : '#dc3545'}}>
            {health.is_writable ? '✅ Yes' : '❌ No'}
          </div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Free Space</div>
          <div style={{...styles.metricValue, color: health.free_space_gb < 5 ? '#dc3545' : '#28a745'}}>
            {health.free_space_gb} GB
          </div>
          <div style={styles.metricSubtext}>
            of {health.total_space_gb} GB ({health.used_percentage}% used)
          </div>
        </div>
        <div style={styles.metric}>
          <div style={styles.metricLabel}>Total Backups</div>
          <div style={styles.metricValue}>
            {health.backup_count} files
          </div>
        </div>
        {health.last_backup && (
          <div style={styles.metric}>
            <div style={styles.metricLabel}>Last Backup</div>
            <div style={styles.metricValue} title={health.last_backup.filename}>
              {health.last_backup.size_mb} MB
            </div>
            <div style={styles.metricSubtext}>
              {new Date(health.last_backup.created_at).toLocaleString('id-ID')}
            </div>
          </div>
        )}
      </div>

      {health.warnings && health.warnings.length > 0 && (
        <div style={styles.warnings}>
          <div style={styles.warningsTitle}>⚠️ Peringatan:</div>
          {health.warnings.map((warning, index) => (
            <div key={index} style={styles.warning}>{warning}</div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    border: '3px solid',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #e9ecef',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  headerRight: {
    display: 'flex',
    gap: '10px',
  },
  icon: {
    fontSize: '32px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: '13px',
    color: '#6c757d',
    marginTop: '4px',
  },
  refreshBtn: {
    background: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '8px 16px',
    transition: 'all 0.2s',
    fontWeight: '500',
  },
  testBtn: {
    background: '#007bff',
    border: 'none',
    borderRadius: '6px',
    color: 'white',
    fontSize: '13px',
    cursor: 'pointer',
    padding: '8px 16px',
    transition: 'all 0.2s',
    fontWeight: '500',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
    marginBottom: '15px',
  },
  metric: {
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
  },
  metricLabel: {
    fontSize: '12px',
    color: '#6c757d',
    marginBottom: '6px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  metricSubtext: {
    fontSize: '11px',
    color: '#999',
    marginTop: '4px',
  },
  warnings: {
    backgroundColor: '#fff3cd',
    border: '2px solid #ffc107',
    borderRadius: '8px',
    padding: '15px',
    marginTop: '15px',
  },
  warningsTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: '10px',
  },
  warning: {
    fontSize: '13px',
    color: '#856404',
    marginBottom: '6px',
    paddingLeft: '8px',
  },
};

export default NasHealthIndicator;
