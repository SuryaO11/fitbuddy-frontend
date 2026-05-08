import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Skeleton from '../components/ui/skeleton';

interface Challenge {
  id: number;
  name: string;
  description: string;
  progress: number;
  goal: number;
  joined: boolean;
}
interface ChallengesResponse {
  challenges: Challenge[];
}

const fetchChallenges = async () => {
  const res = await fetch('/api/challenges');
  if (!res.ok) throw new Error('Failed to fetch challenges');
  return res.json();
};

const joinChallengeApi = async (id: number) => {
  const res = await fetch(`/api/challenges/${id}/join`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to join challenge');
  return res.json();
};

const Challenges: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<ChallengesResponse>({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  });
  const mutation = useMutation({
    mutationFn: joinChallengeApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges'] })
  });
  const challenges = data?.challenges || [];

  return (
    <div className="p-2 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Challenges</h2>
      <div className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="w-full h-16 mb-2" />
            <Skeleton className="w-full h-16 mb-2" />
            <Skeleton className="w-full h-16 mb-2" />
          </>
        ) : error ? (
          <div className="text-red-500 text-sm">Failed to load challenges.</div>
        ) : (
          challenges.map((challenge: any) => (
            <div key={challenge.id} className="p-4 rounded border bg-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-bold text-base sm:text-lg">{challenge.name}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mb-2">{challenge.description}</div>
                <div className="text-xs sm:text-sm">Progress: {challenge.progress} / {challenge.goal}</div>
              </div>
              <div className="flex flex-col gap-2 min-w-[120px]">
                {!challenge.joined ? (
                  <button className="px-3 py-1 rounded bg-primary text-white text-xs font-semibold hover:bg-primary/80" onClick={() => mutation.mutate(challenge.id)} disabled={mutation.isPending}>Join</button>
                ) : (
                  <span className="px-3 py-1 rounded bg-success text-white text-xs font-semibold text-center">Joined</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Challenges are live. Data updates in real time.</p>
    </div>
  );
};

export default Challenges; 