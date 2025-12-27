import React from 'react';
import useNasMetrics from '../../hooks/useNasMetrics';
import './NasMonitorDashboard.css';

/**
 * NasMonitorDashboard Component
 * 
 * @description
 * Monitoring dashboard untuk NAS (Network Attached Storage) yang menampilkan
 * real-time metrics seperti storage capacity, network performance, dan status koneksi.
 * 
 * @features
 * - Real-time NAS availability monitoring
 * - Storage capacity tracking (Free/Used/Total)
 * - Network latency measurement
 * - Read/Write speed monitoring
 * - File count tracking
 * - Auto-refresh setiap 5 detik
 * 
 * @author System Integration Team
 * @version 1.0.0
 * @since 2025-12-27
 */
export default function NasMonitorDashboard() {
  const { nasMetrics, loading, error, isPolling } = useNasMetrics(5000); // Poll every 5 seconds

  // Debug log
  console.log('NasMonitorDashboard render:', { nasMetrics, loading, error, isPolling });

  /**
   * Format bytes to human-readable format
   */
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = () => {
    if (!nasMetrics.available) {
      return { bg: 'bg-red-100', text: 'text-red-800', label: '🔴 Offline' };
    }
    
    switch (nasMetrics.status_color) {
      case 'red':
        return { bg: 'bg-red-100', text: 'text-red-800', label: '🔴 Critical' };
      case 'orange':
        return { bg: 'bg-orange-100', text: 'text-orange-800', label: '🟠 Warning' };
      case 'green':
        return { bg: 'bg-green-100', text: 'text-green-800', label: '🟢 Healthy' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: '⚪ Unknown' };
    }
  };

  const statusBadge = getStatusBadge();

  if (loading && !nasMetrics.timestamp) {
    return (
      <div className="nas-monitor-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading NAS metrics...</p>
      </div>
    );
  }

  return (
    <div className="nas-monitor-dashboard" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Debug Info */}
      <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', fontFamily: 'monospace' }}>
        <div><strong>Debug Info:</strong></div>
        <div>Loading: {loading ? 'YES' : 'NO'}</div>
        <div>Error: {error || 'None'}</div>
        <div>Available: {nasMetrics.available ? 'YES' : 'NO'}</div>
        <div>Total Space: {nasMetrics.total_space}</div>
        <div>Polling: {isPolling ? 'YES' : 'NO'}</div>
      </div>

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">NAS Storage Monitor</h2>
          <p className="text-sm text-gray-500 mt-1">
            {nasMetrics.ip && `Connected to ${nasMetrics.ip}`}
            {nasMetrics.drive && ` (${nasMetrics.drive})`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`status-badge ${statusBadge.bg} ${statusBadge.text}`}>
            {statusBadge.label}
          </span>
          {isPolling && (
            <span className="polling-indicator">
              <span className="pulse-dot"></span>
              Auto-refresh
            </span>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="metrics-grid">
        
        {/* Storage Capacity */}
        <div className="metric-card storage-card">
          <div className="card-header">
            <div className="icon-wrapper bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Storage Capacity</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {formatBytes(nasMetrics.total_space)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Used:</span>
                <span className="text-lg font-semibold text-orange-600">
                  {formatBytes(nasMetrics.used_space)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Free:</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatBytes(nasMetrics.free_space)}
                </span>
              </div>

              {/* Usage Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Usage</span>
                  <span className="font-semibold">{nasMetrics.usage_percent}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className={`progress-fill ${
                      nasMetrics.usage_percent >= 90 ? 'bg-red-500' :
                      nasMetrics.usage_percent >= 75 ? 'bg-orange-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${nasMetrics.usage_percent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Latency */}
        <div className="metric-card">
          <div className="card-header">
            <div className="icon-wrapper bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {nasMetrics.latency !== null ? nasMetrics.latency : 'N/A'}
              {nasMetrics.latency !== null && <span className="text-xl text-gray-500 ml-2">ms</span>}
            </div>
            <p className="text-gray-600 text-sm">Network Latency</p>
            {nasMetrics.latency !== null && (
              <p className="text-xs text-gray-500 mt-2">
                {nasMetrics.latency < 10 ? '⚡ Excellent' :
                 nasMetrics.latency < 30 ? '✓ Good' :
                 nasMetrics.latency < 50 ? '⚠ Fair' : '❌ Poor'}
              </p>
            )}
          </div>
        </div>

        {/* Read Speed */}
        <div className="metric-card">
          <div className="card-header">
            <div className="icon-wrapper bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {nasMetrics.read_speed !== null ? nasMetrics.read_speed.toFixed(2) : 'N/A'}
              {nasMetrics.read_speed !== null && <span className="text-xl text-gray-500 ml-2">MB/s</span>}
            </div>
            <p className="text-gray-600 text-sm">Read Speed</p>
          </div>
        </div>

        {/* Write Speed */}
        <div className="metric-card">
          <div className="card-header">
            <div className="icon-wrapper bg-orange-100">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {nasMetrics.write_speed !== null ? nasMetrics.write_speed.toFixed(2) : 'N/A'}
              {nasMetrics.write_speed !== null && <span className="text-xl text-gray-500 ml-2">MB/s</span>}
            </div>
            <p className="text-gray-600 text-sm">Write Speed</p>
          </div>
        </div>

        {/* Read IOPS */}
        <div className="metric-card">
          <div className="card-header">
            <div className="icon-wrapper bg-cyan-100">
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {nasMetrics.read_iops !== null ? nasMetrics.read_iops.toFixed(2) : 'N/A'}
              {nasMetrics.read_iops !== null && <span className="text-xl text-gray-500 ml-2">IOPS</span>}
            </div>
            <p className="text-gray-600 text-sm">Read Operations/sec</p>
          </div>
        </div>

        {/* Write IOPS */}
        <div className="metric-card">
          <div className="card-header">
            <div className="icon-wrapper bg-pink-100">
              <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {nasMetrics.write_iops !== null ? nasMetrics.write_iops.toFixed(2) : 'N/A'}
              {nasMetrics.write_iops !== null && <span className="text-xl text-gray-500 ml-2">IOPS</span>}
            </div>
            <p className="text-gray-600 text-sm">Write Operations/sec</p>
          </div>
        </div>

        {/* Total IOPS */}
        <div className="metric-card">
          <div className="card-header">
            <div className="icon-wrapper bg-teal-100">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {nasMetrics.total_iops !== null ? nasMetrics.total_iops.toFixed(2) : 'N/A'}
              {nasMetrics.total_iops !== null && <span className="text-xl text-gray-500 ml-2">IOPS</span>}
            </div>
            <p className="text-gray-600 text-sm">Total I/O Operations/sec</p>
            {nasMetrics.total_iops !== null && (
              <p className="text-xs text-gray-500 mt-2">
                {nasMetrics.total_iops < 50 ? '🟢 Low load' :
                 nasMetrics.total_iops < 150 ? '🟡 Moderate' :
                 nasMetrics.total_iops < 500 ? '🟠 High load' : '🔴 Very high'}
              </p>
            )}
          </div>
        </div>

        {/* File Count */}
        <div className="metric-card">
          <div className="card-header">
            <div className="icon-wrapper bg-indigo-100">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {nasMetrics.file_count.toLocaleString()}
            </div>
            <p className="text-gray-600 text-sm">Total Files</p>
          </div>
        </div>

        {/* Concurrent Users */}
        <div className="metric-card">
          <div className="card-header">
            <div className="icon-wrapper bg-teal-100">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {nasMetrics.concurrent_users}
            </div>
            <p className="text-gray-600 text-sm">Concurrent Users</p>
            <p className="text-xs text-gray-500 mt-2">
              {nasMetrics.concurrent_users === 0 ? '⚪ No active connections' :
               nasMetrics.concurrent_users === 1 ? '🟢 1 user connected' :
               `🟢 ${nasMetrics.concurrent_users} users connected`}
            </p>
          </div>
        </div>

        {/* Status Info */}
        <div className="metric-card col-span-full">
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">NAS IP Address</p>
                <p className="text-sm font-semibold text-gray-900">{nasMetrics.ip || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mapped Drive</p>
                <p className="text-sm font-semibold text-gray-900">{nasMetrics.drive || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="text-sm font-semibold text-gray-900">
                  {nasMetrics.timestamp ? new Date(nasMetrics.timestamp).toLocaleString('id-ID') : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
