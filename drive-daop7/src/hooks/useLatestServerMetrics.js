// Example usage in React component for fetching latest server metrics

import { useState, useEffect } from 'react';
import axios from 'axios';

export function useLatestServerMetrics(pollingInterval = 2000) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestMetrics = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
        
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
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchLatestMetrics();

    // Set up polling
    const interval = setInterval(fetchLatestMetrics, pollingInterval);

    // Cleanup
    return () => clearInterval(interval);
  }, [pollingInterval]);

  return { metrics, loading, error };
}

// Usage example in component:
// const { metrics, loading, error } = useLatestServerMetrics(2000);
// 
// metrics will contain:
// {
//   rx: 1024.50,
//   tx: 2048.75,
//   reads: 150.25,
//   writes: 250.10,
//   free_space: 536870912000,
//   latency: 25,
//   timestamp: "2025-12-14T10:30:45+07:00"
// }
