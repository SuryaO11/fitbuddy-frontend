import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Skeleton from '../components/ui/skeleton';

interface StatsResponse {
  totalUsers: number;
  totalWorkouts: number;
  activeStreaks: number;
}

const fetchStats = async (): Promise<StatsResponse> => {
  const res = await fetch('/api/admin/stats');
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
};

const sendMessageApi = async (message: string) => {
  const res = await fetch('/api/admin/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
};

const AdminDashboard: React.FC = () => {
  const { data, isLoading, error } = useQuery<StatsResponse>({
    queryKey: ['adminStats'],
    queryFn: fetchStats,
  });
  const mutation = useMutation({
    mutationFn: sendMessageApi,
    onSuccess: () => {
      setSent(true);
      setTimeout(() => setSent(false), 2000);
      setMessage('');
    }
  });
  const [dateRange, setDateRange] = useState('last30');
  const [userType, setUserType] = useState('all');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const stats = data || { totalUsers: 0, totalWorkouts: 0, activeStreaks: 0 };

  const sendBulkMessage = () => {
    mutation.mutate(message);
  };

  return (
    <div className="p-2 sm:p-8 max-w-3xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Admin Dashboard</h2>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="p-2 border rounded text-xs sm:text-base">
          <option value="last7">Last 7 Days</option>
          <option value="last30">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
        <select value={userType} onChange={e => setUserType(e.target.value)} className="p-2 border rounded text-xs sm:text-base">
          <option value="all">All Users</option>
          <option value="coach">Coaches</option>
          <option value="athlete">Athletes</option>
        </select>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm mb-6">Failed to load stats.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded border bg-muted text-center">
            <div className="text-xs sm:text-sm text-muted-foreground">Total Users</div>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalUsers}</div>
          </div>
          <div className="p-4 rounded border bg-muted text-center">
            <div className="text-xs sm:text-sm text-muted-foreground">Total Workouts</div>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalWorkouts}</div>
          </div>
          <div className="p-4 rounded border bg-muted text-center">
            <div className="text-xs sm:text-sm text-muted-foreground">Active Streaks</div>
            <div className="text-xl sm:text-2xl font-bold">{stats.activeStreaks}</div>
          </div>
        </div>
      )}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-2">Bulk Messaging / Announcements</h3>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type your announcement..."
          className="w-full p-2 border rounded mb-2 text-xs sm:text-base"
          rows={3}
        />
        <button
          className="px-3 py-1 rounded bg-primary text-white text-xs font-semibold hover:bg-primary/80"
          onClick={sendBulkMessage}
          disabled={!message.trim() || mutation.isPending}
        >
          {mutation.isPending ? 'Sending...' : 'Send to All'}
        </button>
        {sent && <span className="ml-2 text-success text-xs">Sent!</span>}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Admin tools are live. Data updates in real time.</p>
    </div>
  );
};

export default AdminDashboard; 