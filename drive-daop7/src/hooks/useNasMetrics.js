import { useState, useEffect, useCallback } from 'react';
import api, { pollNasMetrics } from '../services/api';

/**
 * Custom hook untuk fetch dan auto-polling NAS metrics
 * 
 * @param {number} pollInterval - Interval polling dalam milliseconds (default: 5000 = 5 detik)
 * @returns {object} { nasMetrics, loading, error, refetch, startPolling, stopPolling }
 */
export default function useNasMetrics(pollInterval = 5000) {
  const [nasMetrics, setNasMetrics] = useState({
    available: false,
    ip: null,
    drive: null,
    free_space: 0,
    total_space: 0,
    used_space: 0,
    usage_percent: 0,
    latency: null,
    read_speed: null,
    write_speed: null,
    read_iops: null,
    write_iops: null,
    total_iops: null,
    file_count: 0,
    concurrent_users: 0,
    status_color: 'gray',
    status_text: 'Unknown',
    timestamp: null,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  /**
   * Fetch NAS metrics from API
   */
  const fetchNasMetrics = useCallback(async () => {
    try {
      setError(null);
      
      // Poll to get fresh data and save to DB
      const pollResponse = await pollNasMetrics();
      
      console.log('NAS Metrics Response:', pollResponse.data);
      
      if (pollResponse.data.success) {
        setNasMetrics(pollResponse.data.data);
        console.log('NAS Metrics Updated:', pollResponse.data.data);
      } else {
        throw new Error(pollResponse.data.message || 'Failed to fetch NAS metrics');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching NAS metrics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load NAS metrics');
      setLoading(false);
      
      // Set offline state
      setNasMetrics(prev => ({
        ...prev,
        available: false,
        status_color: 'red',
        status_text: 'Error',
      }));
    }
  }, []);

  /**
   * Start auto-polling
   */
  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  /**
   * Stop auto-polling
   */
  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  /**
   * Setup polling interval
   */
  useEffect(() => {
    let intervalId;

    if (isPolling) {
      // Fetch immediately
      fetchNasMetrics();
      
      // Then setup interval
      intervalId = setInterval(fetchNasMetrics, pollInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPolling, pollInterval, fetchNasMetrics]);

  /**
   * Auto-start polling on mount
   */
  useEffect(() => {
    startPolling();
    
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return {
    nasMetrics,
    loading,
    error,
    refetch: fetchNasMetrics,
    startPolling,
    stopPolling,
    isPolling,
  };
}
