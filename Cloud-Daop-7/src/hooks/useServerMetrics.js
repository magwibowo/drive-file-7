import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Custom hook untuk fetching server metrics dari backend
 * 
 * @param {number} refreshInterval - Interval refresh dalam milidetik (default: 2000ms)
 * @returns {Object} { metrics, loading, error }
 */
export function useServerMetrics(refreshInterval = 2000) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    const fetchServerMetrics = async () => {
      try {
        const token = localStorage.getItem('authToken');
        
        const response = await axios.get(
          `${API_BASE_URL}/admin/server-metrics/latest`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setMetrics(response.data.data);
          setError(null);
        } else {
          setError(response.data.message || 'Failed to fetch metrics');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching server metrics');
        console.error('Error fetching server metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchServerMetrics();

    // Set up interval for periodic refresh
    const intervalId = setInterval(fetchServerMetrics, refreshInterval);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval, API_BASE_URL]);

  return { metrics, loading, error };
}

export default useServerMetrics;
