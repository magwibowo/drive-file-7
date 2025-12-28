// src/hooks/useFileFetcher.js
import { useState, useEffect, useCallback } from 'react';

const useFileFetcher = (fetcherFunction) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetcherFunction();
            setFiles(response.data);
        } catch (err) {
            setError(err);
            console.error('Could not fetch files:', err);
        } finally {
            setLoading(false);
        }
    }, [fetcherFunction]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { files, setFiles, loading, error, refresh: fetchData };
};

export default useFileFetcher;