import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { CreateMonitor } from './components/CreateMonitor';
import { Monitor } from './types';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create'>('dashboard');
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/monitors`);
      if (!res.ok) throw new Error('Failed to fetch monitors');
      const data = await res.json();
      setMonitors(data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the rainfall oracle network.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateSuccess = () => {
    fetchMonitors();
    setActiveTab('dashboard');
  };

  const handleDebugRun = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/debug/run-check`, { method: 'POST' });
      await fetchMonitors();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' ? (
        <Dashboard
          monitors={monitors}
          loading={loading}
          onRefresh={fetchMonitors}
          onDebugRun={handleDebugRun}
        />
      ) : (
        <CreateMonitor onSuccess={handleCreateSuccess} onCancel={() => setActiveTab('dashboard')} />
      )}
    </Layout>
  );
}