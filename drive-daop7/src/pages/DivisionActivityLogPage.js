import React from 'react';
import { getDivisionActivityLogs } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DivisionActivityTimeline from '../components/DivisionActivityTimeline/DivisionActivityTimeline';

const DivisionActivityLogPage = () => {
    const { user } = useAuth();

    const title = `Log Aktivitas Divisi ${user?.division?.name || ''}`;

    return (
        <DivisionActivityTimeline 
            title={title} 
            fetchLogsFunction={getDivisionActivityLogs} 
        />
    );
};

export default DivisionActivityLogPage;