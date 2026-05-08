import React from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Target, Trophy, BarChart3, Download, Activity, Dumbbell, Zap, TrendingDown, Save, Database, FileText } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useQuery } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';
import { apiService } from '../lib/api';
import { useToast } from '../hooks/use-toast';
import { pdfService, type WorkoutReportData } from '@/lib/pdfService';

interface ActivityLogProps {
  // Component props interface
}

export const ActivityLog: React.FC<ActivityLogProps> = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activityDays, setActivityDays] = React.useState<'30' | '90'>('30');
  const [serverStatus, setServerStatus] = React.useState<'online' | 'offline' | 'checking'>('checking');

  const getStatusColor = (status: 'online' | 'offline' | 'checking') => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'offline': return 'text-red-600';
      case 'checking': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Scroll to top when component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check server status
  React.useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const res = await fetch('https://fitbuddy-backend-l3r0.onrender.com/api/workouts', {
          method: 'HEAD',
          headers: { 'Authorization': `Bearer ${apiService.getToken()}` }
        });
        setServerStatus(res.ok ? 'online' : 'offline');
      } catch (error) {
        setServerStatus('offline');
      }
    };

    if (user?._id && apiService.getToken()) {
      checkServerStatus();
      // Check again every 30 seconds
      const interval = setInterval(checkServerStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [user?._id]);

  // Fetch workouts data with real-time updates
  // Fetch macro summaries
  const { data: macroSummariesData } = useQuery({
    queryKey: ['macro-summaries', user?._id],
    queryFn: async () => {
      const res = await fetch('https://fitbuddy-backend-l3r0.onrender.com/api/workouts/macro-summaries', {
        headers: { 'Authorization': `Bearer ${apiService.getToken()}` },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Failed to load macro summaries');
      return res.json();
    },
    enabled: !!user?._id && !!apiService.getToken() && serverStatus === 'online',
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 0,
    gcTime: 0,
  });

  const { data: workoutsData, isLoading: workoutsLoading, error: workoutsError } = useQuery({
    queryKey: ['workouts', user?._id],
    queryFn: async () => {
      const res = await fetch('https://fitbuddy-backend-l3r0.onrender.com/api/workouts', {
        headers: { 'Authorization': `Bearer ${apiService.getToken()}` },
        cache: 'no-store' // Disable browser cache
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await res.json();
      return data;
    },
    enabled: !!user?._id && !!apiService.getToken() && serverStatus === 'online',
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 10000, // Refetch every 10 seconds to reduce server load
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data
    refetchIntervalInBackground: true, // Continue refetching even when tab is not active
    retry: (failureCount, error) => {
      // Don't retry if it's a server connection error
      if (error.message.includes('Server returned non-JSON') ||
        error.message.includes('Server error: 500')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const workouts = workoutsData?.workouts || [];
  const macroSummaries = macroSummariesData?.macroSummaries || [];

  // Debug: Log workout data structure (temporary)
  if (workouts.length > 0) {
    console.log('Sample workout data:', workouts[0]);
    console.log('Total workouts:', workouts.length);
  }

  const lastUpdated = new Date().toLocaleTimeString();

  // Calculate weekly progress
  const getWeeklyProgress = () => {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);

    const weeklyWorkouts = workouts.filter((w: any) => {
      const workoutDate = new Date(w.date || w.createdAt || w.timestamp);
      return workoutDate >= startOfWeek && workoutDate <= endOfWeek;
    });

    return {
      count: weeklyWorkouts.length,
      goal: 5,
      percentage: Math.min((weeklyWorkouts.length / 5) * 100, 100)
    };
  };

  // Calculate workout trends
  const getWorkoutTrends = () => {
    const last4Weeks = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (weekStart.getDay() + i * 7));
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

      const weekWorkouts = workouts.filter((w: any) => {
        const workoutDate = new Date(w.date || w.createdAt || w.timestamp);
        return workoutDate >= weekStart && workoutDate <= weekEnd;
      });

      last4Weeks.push(weekWorkouts.length);
    }
    return last4Weeks;
  };

  // Calculate activity log
  const getActivityLog = (days: number = 30) => {
    const activities = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayWorkouts = workouts.filter((w: any) => {
        const workoutDate = new Date(w.date || w.createdAt || w.timestamp);
        return workoutDate.toDateString() === date.toDateString();
      });

      activities.push({
        date: date.toISOString().split('T')[0],
        type: dayWorkouts.length > 0 ? 'workout' : 'rest',
        summary: dayWorkouts.length > 0 ? `${dayWorkouts.length} workout(s)` : 'Rest day'
      });
    }

    return activities;
  };

  // Calculate personal bests
  const getPersonalBests = () => {
    const exerciseStats: { [key: string]: { maxWeight: number; maxReps: number; exercise: string } } = {};

    workouts.forEach((workout: any) => {
      // Use the correct session field from the workout data
      const exercises = workout.session || [];

      exercises.forEach((exercise: any) => {
        if (!exerciseStats[exercise.name]) {
          exerciseStats[exercise.name] = { maxWeight: 0, maxReps: 0, exercise: exercise.name };
        }

        const sets = exercise.sets || [];
        sets.forEach((set: any) => {
          if (set.weight > exerciseStats[exercise.name].maxWeight) {
            exerciseStats[exercise.name].maxWeight = set.weight;
          }
          if (set.reps > exerciseStats[exercise.name].maxReps) {
            exerciseStats[exercise.name].maxReps = set.reps;
          }
        });
      });
    });

    const result = Object.values(exerciseStats).filter(pb => pb.maxWeight > 0 || pb.maxReps > 0);
    console.log('Personal Bests calculated:', result.length, 'exercises');
    return result;
  };

  // Calculate detailed exercise progress
  const getExerciseProgress = () => {
    const exerciseProgress: { [key: string]: any } = {};

    workouts.forEach((workout: any) => {
      // Use the correct session field from the workout data
      const exercises = workout.session || [];
      const workoutDate = new Date(workout.date || workout.createdAt || workout.timestamp);

      exercises.forEach((exercise: any) => {
        if (!exerciseProgress[exercise.name]) {
          exerciseProgress[exercise.name] = {
            name: exercise.name,
            totalWorkouts: 0,
            totalSets: 0,
            totalReps: 0,
            maxWeight: 0,
            maxReps: 0,
            avgWeight: 0,
            avgReps: 0,
            firstSeen: workoutDate,
            lastSeen: workoutDate,
            weightHistory: [],
            repHistory: [],
            improvement: 0,
            consistency: 0
          };
        }

        const progress = exerciseProgress[exercise.name];
        progress.totalWorkouts++;
        progress.lastSeen = workoutDate;

        const sets = exercise.sets || [];
        sets.forEach((set: any) => {
          progress.totalSets++;
          progress.totalReps += set.reps || 0;

          if (set.weight > progress.maxWeight) {
            progress.maxWeight = set.weight;
          }
          if (set.reps > progress.maxReps) {
            progress.maxReps = set.reps;
          }

          progress.weightHistory.push({ weight: set.weight, date: workoutDate });
          progress.repHistory.push({ reps: set.reps, date: workoutDate });
        });
      });
    });

    // Calculate averages and improvements
    Object.values(exerciseProgress).forEach((exercise: any) => {
      exercise.avgWeight = exercise.totalSets > 0 ? exercise.weightHistory.reduce((sum: number, h: any) => sum + h.weight, 0) / exercise.weightHistory.length : 0;
      exercise.avgReps = exercise.totalSets > 0 ? exercise.repHistory.reduce((sum: number, h: any) => sum + h.reps, 0) / exercise.repHistory.length : 0;

      // Calculate improvement (comparing recent vs older performance)
      if (exercise.weightHistory.length >= 4) {
        const recent = exercise.weightHistory.slice(-2).reduce((sum: number, h: any) => sum + h.weight, 0) / 2;
        const older = exercise.weightHistory.slice(0, 2).reduce((sum: number, h: any) => sum + h.weight, 0) / 2;
        exercise.improvement = ((recent - older) / older) * 100;
      }

      // Calculate consistency (how often you do this exercise)
      const daysSinceFirst = Math.ceil((new Date().getTime() - exercise.firstSeen.getTime()) / (1000 * 60 * 60 * 24));
      exercise.consistency = daysSinceFirst > 0 ? (exercise.totalWorkouts / daysSinceFirst) * 100 : 0;
    });

    const result = Object.values(exerciseProgress).sort((a: any, b: any) => b.totalWorkouts - a.totalWorkouts);
    console.log('Exercise Progress calculated:', result.length, 'exercises');
    return result;
  };

  // Save micro data to device (detailed workout data)
  const saveMicroToDevice = () => {
    try {
      const date = new Date().toLocaleDateString();
      const time = new Date().toLocaleTimeString();

      let content = `FITNESS WORKOUT DATA REPORT
Generated on: ${date} at ${time}
=====================================\n\n`;

      // Summary Section
      content += `SUMMARY
-------
Total Workouts: ${workouts.length}
Total Exercises Tracked: ${exerciseProgress.length}
Personal Bests Achieved: ${personalBests.length}
Weekly Progress: ${weeklyProgress.count}/${weeklyProgress.goal} workouts (${Math.round(weeklyProgress.percentage)}%)\n\n`;

      // Personal Bests Section
      content += `PERSONAL BESTS
==============
`;
      if (personalBests.length > 0) {
        personalBests.forEach((pb: any, index: number) => {
          content += `${index + 1}. ${pb.exercise}\n`;
          if (pb.maxWeight > 0) content += `   Max Weight: ${pb.maxWeight} lbs\n`;
          if (pb.maxReps > 0) content += `   Max Reps: ${pb.maxReps}\n`;
          content += '\n';
        });
      } else {
        content += 'No personal bests recorded yet.\n\n';
      }

      // Exercise Progress Section
      content += `EXERCISE PROGRESS ANALYSIS
============================
`;
      if (exerciseProgress.length > 0) {
        exerciseProgress.slice(0, 10).forEach((exercise: any, index: number) => {
          content += `${index + 1}. ${exercise.name}\n`;
          content += `   Total Workouts: ${exercise.totalWorkouts}\n`;
          content += `   Total Sets: ${exercise.totalSets}\n`;
          content += `   Max Weight: ${exercise.maxWeight} lbs\n`;
          content += `   Max Reps: ${exercise.maxReps}\n`;
          content += `   Average Weight: ${Math.round(exercise.avgWeight)} lbs\n`;
          content += `   Average Reps: ${Math.round(exercise.avgReps)}\n`;
          content += `   Improvement: ${exercise.improvement > 0 ? '+' : ''}${Math.round(exercise.improvement)}%\n`;
          content += `   Consistency: ${Math.round(exercise.consistency)}%\n\n`;
        });
      } else {
        content += 'No exercise progress data available.\n\n';
      }

      // Recent Workouts Section
      content += `RECENT WORKOUTS (Last 10)
========================
`;
      if (workouts.length > 0) {
        workouts.slice(0, 10).forEach((workout: any, index: number) => {
          const workoutDate = new Date(workout.date).toLocaleDateString();
          content += `${index + 1}. ${workoutDate}\n`;
          if (workout.session && workout.session.length > 0) {
            workout.session.forEach((exercise: any) => {
              content += `   - ${exercise.name}: ${exercise.sets?.length || 0} sets\n`;
            });
          }
          content += '\n';
        });
      } else {
        content += 'No workout data available.\n\n';
      }

      // Activity Log Section
      content += `ACTIVITY LOG (Last 30 Days)
==========================
`;
      activityLog30.forEach((activity: any) => {
        content += `${activity.date}: ${activity.summary}\n`;
      });

      content += `\n\n=====================================
Report generated by FitForge Buddy
For personal fitness tracking use only
=====================================`;

      const blob = new Blob([content], {
        type: 'text/plain;charset=utf-8'
      });
      saveAs(blob, `workout-report-${new Date().toISOString().split('T')[0]}.txt`);

      toast({
        title: "Workout Report Saved",
        description: "Human-readable workout report has been saved to your device.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save workout report to device.",
        variant: "destructive",
      });
    }
  };

  // Save workout report as PDF template
  const saveWorkoutReportPDF = async () => {
    try {
      const workoutData: WorkoutReportData = {
        totalWorkouts: workouts.length,
        totalExercises: exerciseProgress.length,
        personalBests: personalBests,
        exerciseProgress: exerciseProgress.slice(0, 10),
        weeklyProgress: weeklyProgress,
        recentWorkouts: workouts.slice(0, 10),
        activityLog: activityLog30
      };

      const pdfBlob = await pdfService.generateWorkoutReportPDF(workoutData);
      saveAs(pdfBlob, `workout-report-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "PDF Report Generated",
        description: "Beautiful workout report PDF has been saved to your device.",
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF report.",
        variant: "destructive",
      });
    }
  };



  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Type', 'Summary'],
      ...getActivityLog(activityDays === '30' ? 30 : 90).map(activity => [
        activity.date,
        activity.type,
        activity.summary
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'activity-log.csv');
  };

  // Export to image
  const exportToImage = async () => {
    const element = document.getElementById('activity-log-content');
    if (element) {
      const dataUrl = await toPng(element);
      const link = document.createElement('a');
      link.download = 'activity-log.png';
      link.href = dataUrl;
      link.click();
    }
  };

  // Calculate data
  const weeklyProgress = getWeeklyProgress();
  const workoutTrends = getWorkoutTrends();
  const activityLog30 = getActivityLog(30);
  const activityLog90 = getActivityLog(90);
  const personalBests = getPersonalBests();
  const exerciseProgress = getExerciseProgress();

  if (workoutsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (serverStatus === 'offline') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-xl font-semibold">Backend Server Offline</div>
            <div className="text-gray-600 max-w-md mx-auto">
              Unable to connect to the backend server at https://fitbuddy-backend-l3r0.onrender.com.
              Please ensure the backend server is running by:
              <ul className="text-left mt-2 space-y-1 text-sm">
                <li>• Opening a terminal in the server directory</li>
                <li>• Running: <code className="bg-gray-100 px-1 rounded">npm start</code> or <code className="bg-gray-100 px-1 rounded">node server.js</code></li>
                <li>• Checking that the server is running on port 5000</li>
              </ul>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (workoutsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-red-500 text-center">
            Error loading workouts: {workoutsError.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" id="activity-log-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activity Log & Progress Report</h1>
              <div className="text-gray-600 flex items-center gap-2">
                Track your fitness journey and detailed exercise progress
                {/* <span className="flex items-center gap-1 text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live Updates
                </span> */}

                <span className="text-xs text-gray-500">
                  Last updated: {lastUpdated}
                </span>
                {/* <span className={`text-xs ${getStatusColor(serverStatus)}`}>
                  Server: {serverStatus}
                </span> */}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveMicroToDevice} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
              <Save className="h-4 w-4 mr-2" />
              Save Report
            </Button>
            <Button onClick={saveWorkoutReportPDF} className="bg-purple-600 hover:bg-purple-700 text-white rounded-full">
              <FileText className="h-4 w-4 mr-2" />
              Save PDF
            </Button>
            <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white rounded-full">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={exportToImage} className="bg-purple-600 hover:bg-purple-700 text-white rounded-full">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Image
            </Button>
          </div>
        </div>

        {/* Progress Report Banner */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 border-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 Your Progress Report</h2>
              <p className="text-gray-600">
                Welcome to your comprehensive progress analysis! Below you'll find detailed insights about your workout performance,
                exercise progress, and fitness journey. Scroll down to explore your personalized analytics.
              </p>
            </div>
          </div>
        </Card>

        {/* Progress Summary */}
        <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Progress Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{workouts.length}</div>
              <div className="text-sm text-gray-600">Total Workouts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{exerciseProgress.length}</div>
              <div className="text-sm text-gray-600">Exercises Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {exerciseProgress.filter((e: any) => e.improvement > 0).length}
              </div>
              <div className="text-sm text-gray-600">Improving</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">
                {Math.round(exerciseProgress.reduce((sum: number, e: any) => sum + e.consistency, 0) / Math.max(exerciseProgress.length, 1))}%
              </div>
              <div className="text-sm text-gray-600">Avg Consistency</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weekly Progress */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Weekly Progress</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">This Week's Goal</span>
                <span className="text-sm font-semibold text-blue-600">{weeklyProgress.count}/{weeklyProgress.goal} workouts</span>
              </div>
              <Progress value={weeklyProgress.percentage} className="h-3" />
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{Math.round(weeklyProgress.percentage)}%</div>
                <div className="text-sm text-gray-600">Goal Completion</div>
              </div>
            </div>
          </Card>

          {/* Workout Trends */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Workout Trends</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {workoutTrends.map((count, index) => (
                  <div key={index} className="text-center">
                    <div className="text-lg font-bold text-green-600">{count}</div>
                    <div className="text-xs text-gray-600">Week {index + 1}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last 4 weeks</span>
                <span className="font-semibold text-green-600">
                  {workoutTrends.reduce((a, b) => a + b, 0)} total workouts
                </span>
              </div>
            </div>
          </Card>

          {/* Activity Log */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Activity Log</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setActivityDays('30')}
                  className={`text-xs px-3 py-1 rounded-full ${activityDays === '30' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 border border-purple-300'}`}
                >
                  📅 Last 30 Days
                </Button>
                <Button
                  onClick={() => setActivityDays('90')}
                  className={`text-xs px-3 py-1 rounded-full ${activityDays === '90' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 border border-purple-300'}`}
                >
                  📅 Last 90 Days
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(activityDays === '30' ? activityLog30 : activityLog90).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${activity.type === 'workout' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="font-medium text-gray-900">{activity.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${activity.type === 'workout' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} text-xs`}>
                      {activity.type === 'workout' ? '🏋️ Workout' : '😴 Rest'}
                    </Badge>
                    <span className="text-sm text-gray-600">{activity.summary}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Personal Bests */}
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Trophy className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Personal Bests</h3>
            </div>
            {personalBests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalBests.slice(0, 6).map((pb, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-orange-200">
                    <h4 className="font-semibold text-gray-900 mb-2">{pb.exercise}</h4>
                    <div className="space-y-1">
                      {pb.maxWeight > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Max Weight:</span> {pb.maxWeight} lbs
                        </div>
                      )}
                      {pb.maxReps > 0 && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Max Reps:</span> {pb.maxReps}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No personal bests recorded yet. Start working out to see your achievements!</p>
              </div>
            )}
          </Card>

          {/* Exercise Progress Analysis */}
          <Card className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Dumbbell className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Exercise Progress Analysis</h3>
            </div>
            {exerciseProgress.length > 0 ? (
              <div className="space-y-6">
                {exerciseProgress.slice(0, 5).map((exercise: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-indigo-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-lg">{exercise.name}</h4>
                      <div className="flex items-center gap-2">
                        {exercise.improvement > 0 ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-sm font-medium">+{exercise.improvement.toFixed(1)}%</span>
                          </div>
                        ) : exercise.improvement < 0 ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-sm font-medium">{exercise.improvement.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Zap className="h-4 w-4" />
                            <span className="text-sm font-medium">Stable</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-indigo-600">{exercise.totalWorkouts}</div>
                        <div className="text-xs text-gray-600">Workouts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-indigo-600">{exercise.totalSets}</div>
                        <div className="text-xs text-gray-600">Total Sets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-indigo-600">{exercise.maxWeight} lbs</div>
                        <div className="text-xs text-gray-600">Max Weight</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-indigo-600">{exercise.maxReps}</div>
                        <div className="text-xs text-gray-600">Max Reps</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Average Weight</div>
                        <div className="text-lg font-semibold text-gray-900">{exercise.avgWeight.toFixed(1)} lbs</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Average Reps</div>
                        <div className="text-lg font-semibold text-gray-900">{exercise.avgReps.toFixed(1)}</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Consistency</span>
                        <span className="font-medium text-gray-900">{exercise.consistency.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(exercise.consistency, 100)} className="h-2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Dumbbell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No exercise progress data available yet. Start working out to see your detailed progress analysis!</p>
              </div>
            )}
          </Card>

          {/* Macro Summaries History */}
          {macroSummaries.length > 0 && (
            <Card className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Database className="h-5 w-5 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Macro Summaries History</h3>
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {macroSummaries.slice(0, 5).map((summary: any, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-teal-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">
                        {summary.period.charAt(0).toUpperCase() + summary.period.slice(1)} Summary
                      </h4>
                      <span className="text-sm text-gray-500">
                        {new Date(summary.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Workouts:</span>
                        <div className="text-lg font-bold text-teal-600">{summary.summary.totalWorkouts}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Total Sets:</span>
                        <div className="text-lg font-bold text-teal-600">{summary.summary.totalSets}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Max Weight:</span>
                        <div className="text-lg font-bold text-teal-600">{summary.summary.maxWeight} lbs</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Consistency:</span>
                        <div className="text-lg font-bold text-teal-600">{summary.summary.consistency}%</div>
                      </div>
                    </div>
                    {summary.exercises.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-teal-100">
                        <h5 className="font-medium text-gray-700 mb-2">Top Exercises:</h5>
                        <div className="flex flex-wrap gap-2">
                          {summary.exercises.slice(0, 3).map((exercise: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {exercise.name} ({exercise.totalSets} sets)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLog; 