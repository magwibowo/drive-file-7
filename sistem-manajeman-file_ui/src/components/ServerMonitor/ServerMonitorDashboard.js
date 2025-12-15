import React from 'react';
import useServerMetrics from '../../hooks/useServerMetrics';
import './ServerMonitorDashboard.css';

/**
 * ServerMonitorDashboard Component
 * 
 * @description
 * A professional monitoring dashboard component that displays real-time Windows Server 
 * performance metrics sourced from Windows Management Instrumentation (WMI).
 * 
 * @technical_details
 * 
 * ## Data Source
 * All metrics are derived from Windows Management Instrumentation (WMI), specifically:
 * - Win32_PerfRawData_Tcpip_NetworkInterface: Network throughput counters
 * - Win32_PerfRawData_PerfDisk_PhysicalDisk: Disk I/O operation counters
 * - Native Windows API: Disk space and network latency measurements
 * 
 * ## Counter Characteristics
 * WMI performance counters are inherently cumulative in nature. They represent the 
 * total count of operations or bytes transferred since system boot or counter reset. 
 * These raw counter values continuously increment and do not reset unless the system 
 * is rebooted or the performance counter is manually cleared.
 * 
 * ## Delta Time Calculation Methodology
 * To derive meaningful throughput and IOPS (Input/Output Operations Per Second) metrics 
 * from cumulative counter data, a delta time calculation algorithm is employed:
 * 
 * 1. **Baseline Snapshot (t₀)**: An initial counter reading is captured at time t₀
 * 2. **Current Snapshot (t₁)**: A subsequent counter reading is captured at time t₁
 * 3. **Time Interval (Δt)**: The elapsed time between snapshots, typically 2 seconds
 * 4. **Delta Calculation**: Rate = (Counter_t₁ - Counter_t₀) / Δt
 * 
 * Mathematical representation:
 * ```
 * Throughput (KB/s) = (NetworkBytes_current - NetworkBytes_previous) / Δt / 1024
 * IOPS = (DiskOps_current - DiskOps_previous) / Δt
 * ```
 * 
 * This approach ensures accurate real-time rate calculations while accounting for 
 * the cumulative nature of Windows performance counters. The backend service performs 
 * these calculations and persists the computed rates to the database, from which this 
 * component retrieves and displays the metrics.
 * 
 * @see WindowsMetricsService (Backend) - WMI query execution and delta computation
 * @see ServerMetric (Model) - Database schema for persisted metrics
 * @see useServerMetrics (Hook) - Data fetching with 2-second polling interval
 * 
 * @author System Architecture Team
 * @version 1.0.0
 * @since 2025-12-14
 */
export default function ServerMonitorDashboard() {
  const { metrics, loading, error } = useServerMetrics(2000);

  // Helper function untuk format bytes ke KB/s
  const formatKBps = (bytes) => {
    return (bytes / 1024).toFixed(2);
  };

  // Helper function untuk format bytes ke GB
  const formatGB = (bytes) => {
    return (bytes / (1024 ** 3)).toFixed(2);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading server metrics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center mb-2">
            <svg className="w-6 h-6 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h3 className="text-red-800 font-semibold text-lg">Error Loading Metrics</h3>
          </div>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // No metrics available
  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center mb-2">
            <svg className="w-6 h-6 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="text-yellow-800 font-semibold text-lg">No Metrics Available</h3>
          </div>
          <p className="text-yellow-700">No server metrics data found in the database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                Server Monitoring Dashboard
              </h1>
              <p className="text-gray-600">Real-time Windows Server performance metrics</p>
            </div>
            
            {/* Live Indicator */}
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-green-700 font-semibold text-sm">LIVE</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Network RX Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Network RX</h3>
                <svg className="w-8 h-8 text-blue-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {formatKBps(metrics.rx)}
                <span className="text-xl text-gray-500 ml-2">KB/s</span>
              </div>
              <p className="text-gray-600 text-sm">Bytes Received per Second</p>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>

          {/* Network TX Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Network TX</h3>
                <svg className="w-8 h-8 text-green-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {formatKBps(metrics.tx)}
                <span className="text-xl text-gray-500 ml-2">KB/s</span>
              </div>
              <p className="text-gray-600 text-sm">Bytes Transmitted per Second</p>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-pulse" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>

          {/* Disk Reads Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Disk Reads</h3>
                <svg className="w-8 h-8 text-purple-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {metrics.reads.toFixed(2)}
                <span className="text-xl text-gray-500 ml-2">IOPS</span>
              </div>
              <p className="text-gray-600 text-sm">Input Operations per Second</p>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-pulse" style={{ width: '55%' }}></div>
              </div>
            </div>
          </div>

          {/* Disk Writes Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Disk Writes</h3>
                <svg className="w-8 h-8 text-orange-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {metrics.writes.toFixed(2)}
                <span className="text-xl text-gray-500 ml-2">IOPS</span>
              </div>
              <p className="text-gray-600 text-sm">Output Operations per Second</p>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>

          {/* Free Disk Space Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Free Space</h3>
                <svg className="w-8 h-8 text-indigo-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {formatGB(metrics.free_space)}
                <span className="text-xl text-gray-500 ml-2">GB</span>
              </div>
              <p className="text-gray-600 text-sm">Available on C: Drive</p>
              <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>

          {/* Network Latency Card */}
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-lg">Latency</h3>
                <svg className="w-8 h-8 text-pink-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {metrics.latency !== null ? (
                  <>
                    {metrics.latency}
                    <span className="text-xl text-gray-500 ml-2">ms</span>
                  </>
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </div>
              <p className="text-gray-600 text-sm">Ping to 8.8.8.8</p>
              {metrics.latency !== null && (
                <div className="mt-3">
                  {metrics.latency < 50 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Excellent
                    </span>
                  )}
                  {metrics.latency >= 50 && metrics.latency < 100 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⚠ Good
                    </span>
                  )}
                  {metrics.latency >= 100 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      ✗ High
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-gray-700 font-medium mb-1">Real-time Monitoring</p>
              <p className="text-gray-600 text-sm">
                Metrics are updated every 2 seconds from the Windows server via WMI. 
                Last updated: <span className="font-mono text-blue-600">{new Date(metrics.timestamp).toLocaleString()}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
