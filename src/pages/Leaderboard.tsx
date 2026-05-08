import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Skeleton from '../components/ui/skeleton';

interface LeaderboardUser {
  name: string;
  streak: number;
  workouts: number;
  weight: number;
}
interface LeaderboardResponse {
  leaderboard: LeaderboardUser[];
}

const fetchLeaderboard = async (): Promise<LeaderboardResponse> => {
  const res = await fetch('/api/leaderboard');
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
};

const Leaderboard: React.FC = () => {
  const { data, isLoading, error } = useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  });
  const leaderboard = data?.leaderboard || [];

  return (
    <div className="p-2 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Leaderboard</h2>
      <div className="overflow-x-auto">
        {isLoading ? (
          <div>
            <Skeleton className="w-full h-8 mb-2" />
            <Skeleton className="w-full h-8 mb-2" />
            <Skeleton className="w-full h-8 mb-2" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">Failed to load leaderboard.</div>
        ) : (
          <table className="w-full min-w-[350px] border text-xs sm:text-base">
            <thead>
              <tr className="bg-muted">
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Streak</th>
                <th className="p-2 text-left">Workouts</th>
                <th className="p-2 text-left">Total Weight (lbs)</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user: any, i: number) => (
                <tr key={user.name} className={user.name === 'You' ? 'bg-primary/10 font-bold' : ''}>
                  <td className="p-2">{user.name}</td>
                  <td className="p-2">{user.streak}</td>
                  <td className="p-2">{user.workouts}</td>
                  <td className="p-2">{user.weight?.toLocaleString?.() ?? user.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Leaderboard is live. Data updates in real time.</p>
    </div>
  );
};

export default Leaderboard; 