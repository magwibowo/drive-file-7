import { useState, useCallback } from 'react';
import axios from 'axios';

/**
 * Custom hook untuk auto-save server metrics ke database
 * 
 * @returns {Object} { saveMetrics, saving, saveError }
 */
export function useMetricsSaver() {
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const saveMetrics = useCallback(async (metrics) => {
    // Skip saving if no metrics or already saving
    if (!metrics || saving) return;

    try {
      setSaving(true);
      setSaveError(null);

      const token = localStorage.getItem('authToken');
      
      // Call poll endpoint untuk save metrics dengan delta calculation
      await axios.post(
        `${API_BASE_URL}/admin/server-metrics/poll`,
        {}, // Backend akan query WMI sendiri
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Success - no need to update UI, just silently save
    } catch (err) {
      // Silent fail - jangan ganggu UI dengan error save
      console.warn('Failed to save metrics:', err.response?.data?.message || err.message);
      setSaveError(err.response?.data?.message || 'Failed to save metrics');
    } finally {
      setSaving(false);
    }
  }, [saving, API_BASE_URL]);

  return { saveMetrics, saving, saveError };
}

export default useMetricsSaver;
