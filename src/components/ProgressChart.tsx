import Card from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, Award } from "lucide-react";
import { useAuth } from "../lib/auth";
import { useEffect, useState, useRef } from "react";
import { saveAs } from "file-saver";
import Button from "@/components/ui/button";
import * as htmlToImage from "html-to-image";
import { useToast } from "../hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import Skeleton from './ui/skeleton';
import { format } from "date-fns";
import { apiService } from '../lib/api';

export const ProgressChart = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery<{ workouts: any[] }>({
    queryKey: ['workouts', user?._id],
    queryFn: async () => {
              const res = await fetch('https://fitbuddy-backend-l3r0.onrender.com/api/workouts', {
          headers: { 'Authorization': `Bearer ${apiService.getToken()}` },
          cache: 'no-store' // Disable browser cache
        });
      if (!res.ok) throw new Error('Failed to load workouts');
      const data = await res.json() as Promise<{ workouts: any[] }>;
      return data;
    },
    enabled: !!user?._id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data (newer version of cacheTime)
    refetchIntervalInBackground: true, // Continue refetching even when tab is not active
  });
  const workouts = data?.workouts || [];
  const lastUpdated = new Date().toLocaleTimeString();
  const { toast } = useToast();

  // Aggregate workouts by day for the current week
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const weekData = daysOfWeek.map((day, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    // Find workouts for this day
    const dayWorkouts = workouts.filter(w => {
      const wDate = w.date || w.createdAt;
      return wDate && wDate.startsWith(dateStr);
    });
    const totalSets = dayWorkouts.reduce((sum, w) => {
      if (w.session && Array.isArray(w.session)) {
        return sum + w.session.reduce((s: number, ex: any) => s + (ex.sets?.length || 0), 0);
      } else if (w.exercise && w.exercise.sets) {
        return sum + w.exercise.sets.length;
      }
      return sum;
    }, 0);
    const maxWeight = dayWorkouts.reduce((max, w) => {
      if (w.session && Array.isArray(w.session)) {
        return Math.max(max, ...w.session.flatMap((ex: any) => ex.sets?.map((set: any) => set.weight) || []));
      } else if (w.exercise && w.exercise.sets) {
        return Math.max(max, ...w.exercise.sets.map((set: any) => set.weight));
      }
      return max;
    }, 0);
    return { date: day, weight: maxWeight, sets: totalSets };
  });

  const maxWeight = Math.max(...weekData.map(d => d.weight), 1);
  const maxSets = Math.max(...weekData.map(d => d.sets), 1);
  const totalWorkouts = workouts.length;
  const maxWeightAll = Math.max(...workouts.flatMap(w =>
    w.session && Array.isArray(w.session)
      ? w.session.flatMap((ex: any) => ex.sets?.map((set: any) => set.weight) || [])
      : w.exercise && w.exercise.sets
        ? w.exercise.sets.map((set: any) => set.weight)
        : []
  ), 0);
  const totalSetsAll = workouts.reduce((sum, w) => {
    if (w.session && Array.isArray(w.session)) {
      return sum + w.session.reduce((s: number, ex: any) => s + (ex.sets?.length || 0), 0);
    } else if (w.exercise && w.exercise.sets) {
      return sum + w.exercise.sets.length;
    }
    return sum;
  }, 0);

  // Calculate trends for week and month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekWorkouts = workouts.filter(w => {
    const d = new Date(w.date || w.createdAt);
    return d >= startOfWeek && d <= now;
  });
  const monthWorkouts = workouts.filter(w => {
    const d = new Date(w.date || w.createdAt);
    return d >= startOfMonth && d <= now;
  });
  function calcAverages(ws: any[]) {
    let totalSets = 0, totalReps = 0, totalWeight = 0, setCount = 0;
    ws.forEach(w => {
      const exercises = w.session && Array.isArray(w.session)
        ? w.session
        : w.exercise ? [w.exercise] : [];
      exercises.forEach((ex: any) => {
        ex.sets?.forEach((set: any) => {
          totalSets++;
          totalReps += set.reps;
          totalWeight += set.weight;
          setCount++;
        });
      });
    });
    return {
      avgSets: ws.length ? (totalSets / ws.length).toFixed(1) : '0',
      avgReps: setCount ? (totalReps / setCount).toFixed(1) : '0',
      avgWeight: setCount ? (totalWeight / setCount).toFixed(1) : '0',
    };
  }
  const weekAvg = calcAverages(weekWorkouts);
  const monthAvg = calcAverages(monthWorkouts);

  // Compute personal bests per exercise
  const exerciseBests: Record<string, number> = {};
  workouts.forEach(w => {
    const exercises = w.session && Array.isArray(w.session)
      ? w.session
      : w.exercise ? [w.exercise] : [];
    exercises.forEach((ex: any) => {
      if (!ex.name) return;
      const maxSetWeight = ex.sets && ex.sets.length > 0 ? Math.max(...ex.sets.map((set: any) => set.weight)) : 0;
      if (!exerciseBests[ex.name] || maxSetWeight > exerciseBests[ex.name]) {
        exerciseBests[ex.name] = maxSetWeight;
      }
    });
  });

  const exportCSV = () => {
    let csv = 'Date,Exercise,Set,Weight,Reps,Completed\n';
    workouts.forEach(w => {
      const date = w.date || w.createdAt || '';
      const exercises = w.session && Array.isArray(w.session)
        ? w.session
        : w.exercise ? [w.exercise] : [];
      exercises.forEach((ex: any) => {
        ex.sets?.forEach((set: any, idx: number) => {
          csv += `${date},${ex.name},${idx + 1},${set.weight},${set.reps},${set.completed ? 'Yes' : 'No'}\n`;
        });
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'workouts.csv');
  };

  // Calculate current streak (consecutive days with a workout up to today)
  const workoutDates = Array.from(new Set(workouts.map(w => (w.date || w.createdAt || '').slice(0, 10)))).sort((a, b) => b.localeCompare(a));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < workoutDates.length; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    if (workoutDates.includes(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  // Consistency: % of days in past 30 days with a workout
  const daysInMonth = 30;
  const last30 = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    return d.toISOString().slice(0, 10);
  });
  const daysWithWorkout = last30.filter(dateStr => workoutDates.includes(dateStr)).length;
  const consistency = Math.round((daysWithWorkout / daysInMonth) * 100);

  // Best streak: longest consecutive days with a workout
  let bestStreak = 0, tempStreak = 0;
  let lastDate = null;
  const sortedDatesAsc = Array.from(new Set(workouts.map(w => (w.date || w.createdAt || '').slice(0, 10)))).sort((a, b) => a.localeCompare(b));
  for (let i = 0; i < sortedDatesAsc.length; i++) {
    const d = new Date(sortedDatesAsc[i] as string);
    if (lastDate) {
      const diff = (d.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;
    lastDate = d;
  }

  // Calendar heatmap for past 90 days
  const heatmapDays = 90;
  const heatmapToday = new Date();
  const heatmapDates = Array.from({ length: heatmapDays }, (_, i) => {
    const d = new Date(heatmapToday);
    d.setDate(heatmapToday.getDate() - (heatmapDays - 1 - i));
    return d;
  });
  const workoutDateSet = new Set(workouts.map(w => (w.date || w.createdAt || '').slice(0, 10)));

  // For heatmap tooltips: map date string to summary
  const heatmapSummary: Record<string, string> = {};
  workouts.forEach(w => {
    const dateStr = (w.date || w.createdAt || '').slice(0, 10);
    if (!dateStr) return;
    const exercises = w.session && Array.isArray(w.session)
      ? w.session
      : w.exercise ? [w.exercise] : [];
    const setCount = exercises.reduce((sum: number, ex: any) => sum + (ex.sets?.length || 0), 0);
    heatmapSummary[dateStr] = `${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}, ${setCount} set${setCount !== 1 ? 's' : ''}`;
  });

  const heatmapRef = useRef<HTMLDivElement>(null);
  const downloadHeatmap = async () => {
    if (!heatmapRef.current) return;
    const dataUrl = await htmlToImage.toPng(heatmapRef.current);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'workout-heatmap.png';
    link.click();
  };

  const shareProgress = async () => {
    if (navigator.share && heatmapRef.current) {
      const dataUrl = await htmlToImage.toPng(heatmapRef.current);
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'workout-heatmap.png', { type: 'image/png' });
          navigator.share({
            title: 'My FitBuddy Progress',
            text: 'Check out my workout consistency!',
            files: [file],
          });
        });
    } else {
      const shareUrl = window.location.origin + '/leaderboard';
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link Copied', description: 'Progress link copied to clipboard!', variant: 'default' });
    }
  };

  const [activityDays, setActivityDays] = useState<'30' | '90'>('30');
  const activityLength = activityDays === '30' ? 30 : 90;
  const activityDates = Array.from({ length: activityLength }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d;
  });
  const activityRows = activityDates.map(date => {
    const dateStr = date.toISOString().slice(0, 10);
    const hasWorkout = workoutDateSet.has(dateStr);
    const summary = hasWorkout ? heatmapSummary[dateStr] : null;
    return { date, dateStr, hasWorkout, summary };
  });

  if (isLoading) return <Card className="p-6"><Skeleton className="w-full h-32 mb-4" /><Skeleton className="w-1/2 h-8 mx-auto" /><Skeleton className="w-full h-8 mt-4" /></Card>;
  if (error) {
    console.error('ProgressChart: Error loading workouts:', error);
    return <Card className="p-6 text-red-500">{(error as Error).message}</Card>;
  }

  return (
    <Card className="p-2 sm:p-6 shadow-card">
      <div className="space-y-8">
        {/* Header with Export CSV button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2 leading-tight mb-1">
              <TrendingUp className="h-5 w-5 text-primary" />
              Weekly Progress
            </h3>
            <p className="text-xs sm:text-base text-muted-foreground leading-snug">This week's performance</p>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Badge className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium"><Award className="h-4 w-4" />+15% vs last week</Badge>
            <Button className="px-4 py-2 rounded-full border text-xs font-semibold hover:bg-muted transition-all duration-200 shadow-sm" onClick={exportCSV}>Export CSV</Button>
          </div>
        </div>
        {/* Chart */}
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-2 min-w-[420px]">
              {weekData.map((day, index) => (
              <div key={index} className="text-center space-y-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                  {day.date}
                </div>
                  <div className="relative h-20 sm:h-24 bg-secondary rounded-lg overflow-hidden">
                  {day.weight > 0 && (
                    <>
                      {/* Weight bar */}
                        <div className="absolute bottom-0 w-full bg-gradient-primary rounded-lg transition-all duration-500" style={{ height: `${(day.weight / maxWeight) * 80}%` }} />
                      {/* Sets indicator */}
                        <div className="absolute bottom-0 w-full bg-accent/30 rounded-lg" style={{ height: `${(day.sets / maxSets) * 100}%` }} />
                    </>
                  )}
                  {day.weight === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {day.weight > 0 ? (
                    <>
                      <div className="text-xs font-bold">{day.weight}lb</div>
                      <div className="text-xs text-muted-foreground">{day.sets} sets</div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground">Rest</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
        {/* Streaks and Consistency */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2">
          <span className="text-lg font-bold text-success">Current Streak: {streak} day{streak === 1 ? '' : 's'}</span>
          <span className="text-sm font-semibold text-accent">Best Streak: {bestStreak} day{bestStreak === 1 ? '' : 's'}</span>
          <span className="text-sm font-semibold text-primary">Consistency: {consistency}% ({daysWithWorkout}/{daysInMonth} days)</span>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary leading-tight">{totalWorkouts}</div>
            <div className="text-xs text-muted-foreground font-medium">Workouts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent leading-tight">{maxWeightAll}</div>
            <div className="text-xs text-muted-foreground font-medium">Max Weight</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success leading-tight">{totalSetsAll}</div>
            <div className="text-xs text-muted-foreground font-medium">Total Sets</div>
          </div>
        </div>
        {/* Workout Trends */}
        <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
          <div className="font-bold mb-4 text-lg text-blue-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Workout Trends
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
              <div className="font-semibold mb-3 text-blue-700 text-sm uppercase tracking-wide">This Week</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Sets/Workout:</span>
                  <span className="font-mono font-bold text-blue-800">{weekAvg.avgSets}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Reps/Set:</span>
                  <span className="font-mono font-bold text-blue-800">{weekAvg.avgReps}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Weight/Set:</span>
                  <span className="font-mono font-bold text-blue-800">{weekAvg.avgWeight} lbs</span>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
              <div className="font-semibold mb-3 text-blue-700 text-sm uppercase tracking-wide">This Month</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Sets/Workout:</span>
                  <span className="font-mono font-bold text-blue-800">{monthAvg.avgSets}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Reps/Set:</span>
                  <span className="font-mono font-bold text-blue-800">{monthAvg.avgReps}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg Weight/Set:</span>
                  <span className="font-mono font-bold text-blue-800">{monthAvg.avgWeight} lbs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Calendar Heatmap */}
        <div className="mt-8 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-lg text-green-800 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activity Log
            </div>
            <div className="flex gap-2 bg-white p-2 rounded-lg border border-green-200 shadow-md">
              <Button
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${activityDays === '30' ? 'bg-green-600 text-white ring-2 ring-green-300' : 'bg-gray-50 border border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400'}`}
                onClick={() => setActivityDays('30')}
              >
                📅 30 Days
              </Button>
              <Button
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${activityDays === '90' ? 'bg-green-600 text-white ring-2 ring-green-300' : 'bg-gray-50 border border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400'}`}
                onClick={() => setActivityDays('90')}
              >
                📊 90 Days
              </Button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-green-100 bg-white rounded-lg border border-green-100">
            {activityRows.map(({ date, dateStr, hasWorkout, summary }, idx) => (
              <div key={dateStr} className="flex items-center px-4 py-2 gap-4">
                <div className="w-28 font-mono text-xs text-gray-500">{format(date, 'MMM d, EEE')}</div>
                <div className={`flex-1 font-semibold ${hasWorkout ? 'text-green-700' : 'text-gray-400'}`}>{hasWorkout ? 'Workout' : 'Rest Day'}</div>
                {hasWorkout && (
                  <div className="text-xs text-green-800 font-mono">{summary || ''}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Personal Bests */}
        <div className="pt-6 p-4 bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl">
          <div className="font-bold mb-4 text-lg text-purple-800 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Personal Bests
          </div>
          {Object.keys(exerciseBests).length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto mb-3 text-purple-300" />
              <div className="text-purple-600 font-medium">No personal bests yet</div>
              <div className="text-purple-500 text-sm">Complete your first workout to see your achievements!</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(exerciseBests).map(([name, weight]) => (
                <div key={name} className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-purple-800 text-sm truncate">{name}</div>
                      <div className="text-xs text-purple-600">Personal Best</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-700">{weight}</div>
                      <div className="text-xs text-purple-500">lbs</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};