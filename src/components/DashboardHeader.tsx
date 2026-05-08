import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { Target, TrendingUp, Zap, Heart, Calculator } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from "react-router-dom";
import { subDays, format, isSameDay } from 'date-fns';
import { apiService } from '../lib/api';

interface DashboardHeaderProps {
  userName?: string;
}

export const DashboardHeader = ({ userName = "Athlete" }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayDisplay = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Fetch workouts for today and all time
  const { data, isLoading, error } = useQuery<{ workouts: any[] }>({
    queryKey: ['workouts-dashboard'],
    queryFn: async () => {
      try {
        const workouts = await apiService.getWorkouts();
        console.log('Workouts data received:', workouts);
        return { workouts };
      } catch (error) {
        console.error('Error fetching workouts:', error);
        throw error;
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    retry: 3,
    retryDelay: 1000
  });
  const workouts = data?.workouts || [];
  
  // Calculate sets completed today
  const todayWorkouts = workouts.filter(w => {
    const workoutDate = w.date || w.createdAt || '';
    return workoutDate.slice(0, 10) === todayStr;
  });
  
  const setsCompleted = todayWorkouts.reduce((sum, w) => {
    const exercises = w.session && Array.isArray(w.session)
      ? w.session
      : w.exercise ? [w.exercise] : [];
    return sum + exercises.reduce((s: number, ex: any) => {
      if (ex.sets && Array.isArray(ex.sets)) {
        return s + ex.sets.filter((set: any) => set.completed).length;
      }
      return s;
    }, 0);
  }, 0);

  // Get today's goal from recommended workout plan (from backend)
  const [plan, setPlan] = useState<any>(null);
  useEffect(() => {
    const loadWorkoutPlan = async () => {
      try {
        const workoutPlan = await apiService.getWorkoutPlan();
        setPlan(workoutPlan);
      } catch (error) {
        console.error('Error loading workout plan:', error);
        setPlan(null);
      }
    };
    loadWorkoutPlan();
  }, []);

  // Helper to get correct day string
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const getDayIndex = (date: Date) => {
    const day = date.getDay();
    return day === 0 ? 6 : day - 1;
  };
  const todayDay = daysOfWeek[getDayIndex(today)];

  // Calculate today's goal from plan
  let goal = null;
  if (plan && plan[todayDay] && Array.isArray(plan[todayDay])) {
    goal = plan[todayDay].reduce((sum: number, ex: any) => sum + (ex.sets || 0), 0);
  }

  // Calculate workouts this week (last 7 days)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const thisWeekWorkouts = workouts.filter(w => {
    const workoutDate = w.date || w.createdAt || '';
    return workoutDate.slice(0, 10) >= weekStartStr;
  });

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

  const handleViewProgress = () => {
    navigate('/activity-log');
  };

  const handleHealthSync = () => {
    navigate('/health-sync');
  };

  const handleMacros = () => {
    navigate('/macros');
  };

  return (
    <div className="space-y-6 px-2 sm:px-6 py-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-1">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-snug">{todayDisplay}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-primary rounded-lg"><Target className="h-5 w-5 text-primary-foreground" /></span>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Today's Goal</p>
              <p className="text-lg sm:text-xl font-bold leading-tight">
                {isLoading ? 'Loading...' : error ? 'Error' : goal !== null ? `${setsCompleted} / ${goal} Sets` : `${setsCompleted} Sets`}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-accent rounded-lg"><TrendingUp className="h-5 w-5 text-accent-foreground" /></span>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">This Week</p>
              <p className="text-lg sm:text-xl font-bold leading-tight">
                {isLoading ? 'Loading...' : error ? 'Error' : `${thisWeekWorkouts.length} Workout${thisWeekWorkouts.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-success rounded-lg"><Zap className="h-5 w-5 text-success-foreground" /></span>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Streak</p>
              <p className="text-lg sm:text-xl font-bold leading-tight">
                {isLoading ? 'Loading...' : error ? 'Error' : `${streak} Day${streak === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        {/* <Button onClick={handleHealthSync} className="flex-1 px-4 py-3 rounded border border-green-300 bg-green-50 hover:bg-green-100 text-green-800 text-lg font-semibold"> <Heart className="h-5 w-5" /> Health Sync </Button> */}
        <Button onClick={handleMacros} className="flex-1 px-4 py-3 rounded border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 text-lg font-semibold"> <Calculator className="h-5 w-5" /> Macros </Button>
        <Button onClick={handleViewProgress} className="flex-1 px-4 py-3 rounded border text-lg font-semibold hover:bg-outline/80"> <TrendingUp className="h-5 w-5" /> View Progress </Button>
      </div>
    </div>
  );
};