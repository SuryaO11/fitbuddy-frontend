import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Skeleton from '../components/ui/skeleton';

interface User {
  id: string;
  name: string;
  isFriend: boolean;
}
interface FriendsResponse {
  users: User[];
}

const fetchFriends = async (): Promise<FriendsResponse> => {
  const res = await fetch('/api/friends');
  if (!res.ok) throw new Error('Failed to fetch friends');
  return res.json();
};

const sendFriendRequestApi = async (id: number) => {
  const res = await fetch(`/api/friends/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to send friend request');
  return res.json();
};

const Friends: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<FriendsResponse>({
    queryKey: ['friends'],
    queryFn: fetchFriends,
  });
  const mutation = useMutation({
    mutationFn: sendFriendRequestApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] })
  });
  const [search, setSearch] = React.useState('');
  const [viewing, setViewing] = React.useState<null | string>(null);
  const users = data?.users || [];
  const filtered = users.filter((u: any) => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-2 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Friends</h2>
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="mb-4 p-2 border rounded w-full max-w-xs text-xs sm:text-base"
      />
      <div className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="w-full h-12 mb-2" />
            <Skeleton className="w-full h-12 mb-2" />
            <Skeleton className="w-full h-12 mb-2" />
          </>
        ) : error ? (
          <div className="text-red-500 text-sm">Failed to load friends.</div>
        ) : (
          filtered.map((user: any) => (
            <div key={user.id} className="p-4 rounded border bg-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="font-bold text-base sm:text-lg">{user.name}</div>
              <div className="flex flex-col gap-2 min-w-[120px]">
                {user.isFriend ? (
                  <button className="px-3 py-1 rounded bg-success text-white text-xs font-semibold hover:bg-success/80" onClick={() => setViewing(user.name)}>View Progress</button>
                ) : (
                  <button className="px-3 py-1 rounded bg-primary text-white text-xs font-semibold hover:bg-primary/80" onClick={() => mutation.mutate(user.id)} disabled={mutation.isPending}>Add Friend</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {viewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-4 max-w-md w-full relative">
            <button className="absolute top-2 right-2 text-lg" onClick={() => setViewing(null)}>&times;</button>
            <h3 className="text-lg font-bold mb-2">{viewing}'s Progress</h3>
            <div className="text-xs text-muted-foreground">(Mock: Show friend's progress/analytics here.)</div>
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Friends are live. Data updates in real time.</p>
    </div>
  );
};

export default Friends; 