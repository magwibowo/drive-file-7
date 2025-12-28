import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./ServerMonitor.css";

export default function ServerMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState({
    // TIER 2: System-wide
    network_rx_bytes_per_sec: 0,
    network_tx_bytes_per_sec: 0,
    disk_reads_per_sec: 0,
    disk_writes_per_sec: 0,
    disk_free_space: 0,
    latency_ms: null,
    // TIER 1: Critical System
    cpu_usage_percent: 0,
    memory_usage_percent: 0,
    memory_available_mb: 0,
    tcp_connections_total: 0,
    tcp_connections_external: 0,
    concurrent_users: 0,
    disk_queue_length: 0,
    // TIER 3: Application-Specific
    app_network_bytes_per_sec: 0,
    mysql_reads_per_sec: 0,
    mysql_writes_per_sec: 0,
    app_response_time_ms: null,
    app_requests_per_sec: 0,
  });
  const [errorMessage, setErrorMessage] = useState(null);
  const previousSnapshotRef = useRef(null);
  const pollingTimeoutRef = useRef(null);
  const isMonitoringRef = useRef(false);
  const isMountedRef = useRef(true);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

  // Stop polling (no dependencies)
  const stopPolling = useCallback(() => {
    console.log('🚫 stopPolling called, timeout ID:', pollingTimeoutRef.current);
    
    // Clear timeout jika ada
    if (pollingTimeoutRef.current) {
      console.log('✅ Clearing timeout ID:', pollingTimeoutRef.current);
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
      console.log('✅ Polling stopped successfully');
    } else {
      console.warn('⚠️ No polling timeout to stop');
    }
  }, []);

  // Poll for new metrics - recursive setTimeout pattern
  const pollMetricsRef = useRef();
  pollMetricsRef.current = useCallback(async () => {
    console.log('⏱️ Poll tick... isMonitoringRef:', isMonitoringRef.current, 'isMounted:', isMountedRef.current);
    
    // Guard: Stop jika monitoring false atau component unmounted
    if (!isMonitoringRef.current || !isMountedRef.current) {
      console.warn('⚠️ Stopping poll - monitoring:', isMonitoringRef.current, 'mounted:', isMountedRef.current);
      return;
    }
    
    if (!previousSnapshotRef.current) {
      console.warn('⚠️ No previous snapshot, skipping poll');
      // Schedule next poll anyway
      pollingTimeoutRef.current = setTimeout(pollMetrics, 2000);
      return;
    }
    console.log('📋 Using previousSnapshot:', previousSnapshotRef.current);

    try {
      const token = localStorage.getItem("authToken");
      console.log('📡 Sending POLL request');
      const response = await axios.post(
        `${API_BASE_URL}/admin/server-metrics/poll`,
        {
          previous_snapshot: previousSnapshotRef.current,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const { current, delta } = response.data.data;
        console.log('✅ POLL response received');
        console.log('📊 Delta:', delta);

        if (delta && isMountedRef.current) {
          console.log('✨ Updating UI with delta');
          setCurrentMetrics(delta);
        }

        // Update previous snapshot for next poll
        previousSnapshotRef.current = current;
        console.log('🔄 Updated previousSnapshotRef');
        
        if (isMountedRef.current) {
          setErrorMessage(null);
        }
        
        // Schedule next poll ONLY if still monitoring
        if (isMonitoringRef.current && isMountedRef.current) {
          console.log('⏰ Scheduling next poll in 2s...');
          pollingTimeoutRef.current = setTimeout(pollMetrics, 2000);
        } else {
          console.warn('⚠️ Not scheduling next poll - monitoring stopped');
        }
      }
    } catch (error) {
      console.error('❌ POLL ERROR:', error);
      console.error('Response:', error.response?.data);
      
      if (isMountedRef.current) {
        setErrorMessage(
          error.response?.data?.message || "Error fetching metrics"
        );
        // Stop monitoring on error (manual stop to avoid circular dependency)
        isMonitoringRef.current = false;
        setIsMonitoring(false);
        previousSnapshotRef.current = null;
        // Don't schedule next poll
      }
    }
  }, [API_BASE_URL]);

  // Wrapper untuk call pollMetrics dari ref
  const pollMetrics = () => {
    if (pollMetricsRef.current) {
      pollMetricsRef.current();
    }
  };

  // Start polling (kicks off recursive setTimeout)
  const startPolling = useCallback(() => {
    console.log('🔄 START POLLING - isMonitoringRef:', isMonitoringRef.current);
    
    // Guard: hanya start jika monitoring aktif
    if (!isMonitoringRef.current) {
      console.warn('⚠️ Cannot start polling - monitoring is not active');
      return;
    }
    
    // Guard: jangan start jika sudah ada timeout running
    if (pollingTimeoutRef.current) {
      console.warn('⚠️ Polling already running, timeout ID:', pollingTimeoutRef.current);
      return;
    }
    
    console.log('✅ Starting recursive polling...');
    pollMetrics(); // Kick off the first poll
  }, []);

  // Start Monitoring
  const handleStartMonitoring = useCallback(async () => {
    if (isLoading || isMonitoring) {
      console.warn('⚠️ Already starting or monitoring... isLoading:', isLoading, 'isMonitoring:', isMonitoring);
      return;
    }
    
    // Extra guard: stop any existing polling first
    if (pollingTimeoutRef.current) {
      console.warn('⚠️ Found existing polling, stopping first...');
      stopPolling();
    }
    
    try {
      setIsLoading(true);
      console.log('🚀 Starting monitoring...');
      const token = localStorage.getItem("authToken");
      console.log('🔑 Token:', token ? 'Found' : 'NOT FOUND!');
      const response = await axios.post(
        `${API_BASE_URL}/admin/server-metrics/start`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const baseline = response.data.data.baseline;
        console.log('✅ START response:', response.data);
        console.log('📊 Baseline snapshot:', baseline);
        
        // Update state first
        setIsMonitoring(true);
        isMonitoringRef.current = true;
        setErrorMessage(null);
        previousSnapshotRef.current = baseline;
        console.log('📋 previousSnapshotRef saved:', previousSnapshotRef.current);
        console.log('🔴 isMonitoringRef set to:', isMonitoringRef.current);

        // Set current metrics to 0 initially (no delta yet)
        setCurrentMetrics({
          network_rx_bytes_per_sec: 0,
          network_tx_bytes_per_sec: 0,
          disk_reads_per_sec: 0,
          disk_writes_per_sec: 0,
          disk_free_space: baseline.disk_free_space,
          latency_ms: baseline.latency_ms,
          // TIER 1 - Set to baseline values (not delta)
          cpu_usage_percent: baseline.cpu_usage_percent || 0,
          memory_usage_percent: baseline.memory_usage_percent || 0,
          memory_available_mb: baseline.memory_available_mb || 0,
          tcp_connections_total: baseline.tcp_connections_total || 0,
          tcp_connections_external: baseline.tcp_connections_external || 0,
          concurrent_users: baseline.concurrent_users || 0,
          disk_queue_length: baseline.disk_queue_length || 0,
        });

        // Start polling immediately
        console.log('⏱️ Starting polling...');
        startPolling();
      }
    } catch (error) {
      console.error('❌ START ERROR:', error);
      console.error('Response:', error.response?.data);
      setErrorMessage(
        error.response?.data?.message || "Failed to start monitoring"
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isMonitoring, API_BASE_URL, startPolling, stopPolling]);

  // Stop Monitoring
  const handleStopMonitoring = useCallback(async () => {
    console.log('🛑 Stopping monitoring...');
    
    // Set refs first to stop any ongoing polls
    isMonitoringRef.current = false;
    console.log('⚪ isMonitoringRef set to:', isMonitoringRef.current);
    stopPolling();
    
    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `${API_BASE_URL}/admin/server-metrics/stop`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('❌ Error stopping monitoring:', error);
    } finally {
      console.log('📋 Cleaning up state...');
      setIsMonitoring(false);
      previousSnapshotRef.current = null;

      // Reset metrics
      setCurrentMetrics({
        network_rx_bytes_per_sec: 0,
        network_tx_bytes_per_sec: 0,
        disk_reads_per_sec: 0,
        disk_writes_per_sec: 0,
        disk_free_space: 0,
        latency_ms: null,
        cpu_usage_percent: 0,
        memory_usage_percent: 0,
        memory_available_mb: 0,
        tcp_connections_total: 0,
        concurrent_users: 0,
        tcp_connections_external: 0,
        disk_queue_length: 0,
      });
      console.log('✅ Monitoring stopped completely');
    }
  }, [API_BASE_URL, stopPolling]);

  // Effect untuk monitoring state changes
  useEffect(() => {
    console.log('🔄 State changed - isMonitoring:', isMonitoring);
    
    // Jika monitoring di-stop dari luar (bukan dari button), pastikan polling berhenti
    if (!isMonitoring && pollingTimeoutRef.current) {
      console.warn('⚠️ isMonitoring false but polling still active, forcing stop...');
      stopPolling();
    }
  }, [isMonitoring, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      console.log('🧹 Component unmounting, cleaning up...');
      isMountedRef.current = false;
      isMonitoringRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  // Format helpers
  const formatBytes = (bytes) => {
    return (bytes / 1024).toFixed(2);
  };

  const formatGB = (bytes) => {
    return (bytes / (1024 ** 3)).toFixed(2);
  };

  return (
    <div className="server-monitor-container">
      <h2 className="monitor-title">🖥️ Windows Server Monitor</h2>

      {/* Error Message */}
      {errorMessage && (
        <div className="error-alert">
          <strong>Error!</strong> {errorMessage}
        </div>
      )}

      {/* Control Buttons */}
      <div className="control-buttons">
        {!isMonitoring ? (
          <button 
            onClick={handleStartMonitoring} 
            className="btn btn-start"
            disabled={isLoading}
          >
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {isLoading ? 'Starting...' : 'Start Monitoring'}
          </button>
        ) : (
          <>
            <button onClick={handleStopMonitoring} className="btn btn-stop">
              <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Monitoring
            </button>
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span className="status-text">Monitoring Active</span>
            </div>
          </>
        )}
      </div>

      {/* TIER 1 Critical Metrics */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
          Critical System Resources
        </h3>
        <div className="metrics-grid">
          {/* CPU Usage */}
          <div className="metric-card card-red">
            <div className="metric-header">
              <h3 className="metric-title">CPU Usage</h3>
              <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <p className="metric-value">
              {(currentMetrics.cpu_usage_percent || 0).toFixed(1)}%
            </p>
            <p className="metric-label">Processor Utilization</p>
          </div>

          {/* Memory Usage */}
          <div className="metric-card card-purple">
            <div className="metric-header">
              <h3 className="metric-title">Memory Usage</h3>
              <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <p className="metric-value">
              {(currentMetrics.memory_usage_percent || 0).toFixed(1)}%
            </p>
            <p className="metric-label">
              {(currentMetrics.memory_available_mb || 0).toFixed(0)} MB Available
            </p>
          </div>

          {/* TCP Connections */}
          <div className="metric-card card-indigo">
            <div className="metric-header">
              <h3 className="metric-title">Network Connections</h3>
              <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="metric-value">
              {currentMetrics.tcp_connections_external || 0}
            </p>
            <p className="metric-label">
              External TCP ({currentMetrics.tcp_connections_total || 0} Total)
            </p>
          </div>

          {/* Concurrent Users - REAL app users! */}
          <div className="metric-card card-purple">
            <div className="metric-header">
              <h3 className="metric-title">Concurrent Users</h3>
              <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="metric-value">
              {currentMetrics.concurrent_users || 0}
            </p>
            <p className="metric-label">
              Logged-in Active Users
            </p>
          </div>

          {/* Disk Queue Length */}
          <div className="metric-card card-orange">
            <div className="metric-header">
              <h3 className="metric-title">Disk Queue</h3>
              <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
              </svg>
            </div>
            <p className="metric-value">
              {(currentMetrics.disk_queue_length || 0).toFixed(2)}
            </p>
            <p className="metric-label">I/O Queue Length</p>
          </div>
        </div>
      </div>

      {/* Network & Storage Metrics */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
          Network & Storage Performance
        </h3>
        <div className="metrics-grid">
        {/* Network RX */}
        <div className="metric-card card-blue">
          <div className="metric-header">
            <h3 className="metric-title">Network RX</h3>
            <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
          <p className="metric-value">
            {formatBytes(currentMetrics.network_rx_bytes_per_sec)} KB/s
          </p>
          <p className="metric-label">Bytes Received per Second</p>
        </div>

        {/* Network TX */}
        <div className="metric-card card-green">
          <div className="metric-header">
            <h3 className="metric-title">Network TX</h3>
            <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
          <p className="metric-value">
            {formatBytes(currentMetrics.network_tx_bytes_per_sec)} KB/s
          </p>
          <p className="metric-label">Bytes Sent per Second</p>
        </div>

        {/* Disk Reads */}
        <div className="metric-card card-purple">
          <div className="metric-header">
            <h3 className="metric-title">Disk Reads</h3>
            <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <p className="metric-value">
            {(currentMetrics.disk_reads_per_sec || 0).toFixed(2)} IOPS
          </p>
          <p className="metric-label">Disk Reads per Second</p>
        </div>

        {/* Disk Writes */}
        <div className="metric-card card-orange">
          <div className="metric-header">
            <h3 className="metric-title">Disk Writes</h3>
            <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <p className="metric-value">
            {(currentMetrics.disk_writes_per_sec || 0).toFixed(2)} IOPS
          </p>
          <p className="metric-label">Disk Writes per Second</p>
        </div>

        {/* Disk Free Space */}
        <div className="metric-card card-indigo">
          <div className="metric-header">
            <h3 className="metric-title">Disk Free Space</h3>
            <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="metric-value">
            {formatGB(currentMetrics.disk_free_space)} GB
          </p>
          <p className="metric-label">Available on C: Drive</p>
        </div>

        {/* Network Latency */}
        <div className="metric-card card-pink">
          <div className="metric-header">
            <h3 className="metric-title">Network Latency</h3>
            <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="metric-value">
            {currentMetrics.latency_ms !== null ? (
              `${currentMetrics.latency_ms} ms`
            ) : (
              <span className="metric-na">N/A</span>
            )}
          </p>
          <p className="metric-label">Ping to 8.8.8.8</p>
        </div>
        </div>
      </div>

      {/* TIER 3: Application-Specific Metrics */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
          <span style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem', marginRight: '0.5rem' }}>TIER 3</span>
          Application Performance (Laravel Only)
        </h3>
        <div className="metrics-grid">
          {/* App Network Traffic */}
          <div className="metric-card card-green">
            <div className="metric-header">
              <h3 className="metric-title">App Network Traffic</h3>
              <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <p className="metric-value">
              {formatBytes(currentMetrics.app_network_bytes_per_sec)} KB/s
            </p>
            <p className="metric-label">Laravel Port 8000 Traffic</p>
          </div>

          {/* MySQL Disk Reads */}
          <div className="metric-card card-purple">
            <div className="metric-header">
              <h3 className="metric-title">MySQL Disk Reads</h3>
              <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <p className="metric-value">
              {(currentMetrics.mysql_reads_per_sec || 0).toFixed(2)} IOPS
            </p>
            <p className="metric-label">Database Read Operations</p>
          </div>

          {/* MySQL Disk Writes */}
          <div className="metric-card card-orange">
            <div className="metric-header">
              <h3 className="metric-title">MySQL Disk Writes</h3>
              <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 10c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <p className="metric-value">
              {(currentMetrics.mysql_writes_per_sec || 0).toFixed(2)} IOPS
            </p>
            <p className="metric-label">Database Write Operations</p>
          </div>

          {/* API Response Time */}
          <div className="metric-card card-blue">
            <div className="metric-header">
              <h3 className="metric-title">API Response Time</h3>
              <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="metric-value">
              {currentMetrics.app_response_time_ms !== null ? (
                `${currentMetrics.app_response_time_ms} ms`
              ) : (
                <span className="metric-na">N/A</span>
              )}
            </p>
            <p className="metric-label">Health Check Latency</p>
          </div>

          {/* Request Rate */}
          <div className="metric-card card-indigo">
            <div className="metric-header">
              <h3 className="metric-title">Request Rate</h3>
              <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <p className="metric-value">
              {(currentMetrics.app_requests_per_sec || 0).toFixed(2)} req/s
            </p>
            <p className="metric-label">HTTP Requests per Second</p>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="info-footer">
        <svg className="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="info-text">
          <strong>Info:</strong> 16 Metrics diupdate setiap 2 detik saat monitoring aktif.
          Delta dihitung berdasarkan perubahan dari snapshot sebelumnya.
        </p>
      </div>
    </div>
  );
}
