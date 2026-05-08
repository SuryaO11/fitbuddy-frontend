import { useAuth } from "../lib/auth";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Minus, Check, Timer, Weight, RotateCcw, Calendar, Target, TrendingUp, Zap, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { sendNotification } from "../lib/notifications";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Skeleton from './ui/skeleton';
import { CameraButton } from './ui/camera-button';
import { addDays, format, isSameDay, subDays } from 'date-fns';
import { apiService } from '../lib/api';

interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  targetSets: number;
}

interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

interface FormErrors {
  exerciseName?: string;
  weight?: string;
  reps?: string;
  general?: string;
}



// Add a type for the recommendation API response
interface RecommendationResponse {
  recommendation: {
    exercises: Array<{
      name: string;
      sets: Array<{ weight: number; reps: number }>;
    }>;
  } | null;
}

export const WorkoutTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isKg, setIsKg] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [currentSession, setCurrentSession] = useState<Exercise[]>([]);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);
  const [workoutsError, setWorkoutsError] = useState<string | null>(null);
  

  const { data: recData, isLoading: recLoading, error: recError } = useQuery<RecommendationResponse>({
    queryKey: ['recommendation', user?._id],
    queryFn: async () => {
      return await apiService.getRecommendation();
    },
    enabled: !!user?._id,
  });
  const recommendation = recData?.recommendation || null;
  const [recFeedbackSent, setRecFeedbackSent] = useState(false);
  const { toast } = useToast();

  // Workout plan query
  const { data: planData, isLoading: planLoading, error: planError, refetch: refetchPlan } = useQuery({
    queryKey: ['workout-plan', user?._id],
    queryFn: async () => {
      try {
        const workoutPlan = await apiService.getWorkoutPlan();
        console.log('Loaded workout plan from backend:', workoutPlan); // Debug log
        return workoutPlan;
      } catch (error) {
        console.error('Error loading workout plan:', error);
        // Return null instead of throwing to prevent the error from breaking the UI
        return null;
      }
    },
    enabled: !!user?._id,
    retry: 1, // Only retry once to avoid infinite loops
    refetchOnWindowFocus: false, // Prevent refetching when window gains focus
  });
  const plan = planData || null;
  
  // Local state for immediate UI updates
  const [localPlan, setLocalPlan] = useState(plan);
  
  // Update local plan when server plan changes
  useEffect(() => {
    if (plan) {
      console.log('Updating local plan from server data:', plan);
      setLocalPlan(plan);
    }
  }, [plan]);
  
  // Debug log for plan changes
  useEffect(() => {
    console.log('Plan data changed:', plan);
    console.log('Local plan updated:', localPlan);
  }, [plan, localPlan]);

  // Test server connection
  const testServerConnection = async () => {
    try {
      const response = await fetch('https://fitbuddy-backend-l3r0.onrender.com/api/health');
      const data = await response.json();
      console.log('Server health check:', data);
      toast({
        title: "Server Connected",
        description: "Backend server is running properly.",
        variant: "default",
      });
    } catch (error) {
      console.error('Server connection test failed:', error);
      toast({
        title: "Server Disconnected",
        description: "Cannot connect to backend server.",
        variant: "destructive",
      });
    }
  };

  // Workout plan mutations
  const saveWorkoutPlanMutation = useMutation({
    mutationFn: async (newPlan: any) => {
      console.log('Saving workout plan:', newPlan); // Debug log
      return await apiService.saveWorkoutPlan(newPlan);
    },
    onMutate: async (newPlan) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['workout-plan', user?._id] });
      
      // Snapshot the previous value
      const previousPlan = queryClient.getQueryData(['workout-plan', user?._id]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['workout-plan', user?._id], newPlan);
      
      // Return a context object with the snapshotted value
      return { previousPlan };
    },
    onSuccess: (data, variables) => {
      console.log('Workout plan saved successfully:', data); // Debug log
      console.log('Updated plan data:', variables); // Debug log
      
      // Immediately update the cache with the new data
      queryClient.setQueryData(['workout-plan', user?._id], variables);
      
      // Update local state immediately for instant UI feedback
      setLocalPlan(variables);
      
      // Also invalidate to ensure consistency
      queryClient.invalidateQueries({ 
        queryKey: ['workout-plan', user?._id],
        exact: true 
      });
      
      // Force a refetch after a short delay to ensure we have the latest data
      setTimeout(() => {
        refetchPlan();
      }, 100);
    },
    onError: (err, newPlan, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPlan) {
        queryClient.setQueryData(['workout-plan', user?._id], context.previousPlan);
      }
      console.error('Failed to save workout plan:', err);
    },
  });

  const deleteWorkoutPlanMutation = useMutation({
    mutationFn: async () => {
      return await apiService.deleteWorkoutPlan();
    },
    onSuccess: () => {
      // Invalidate and refetch workout plan data
      queryClient.invalidateQueries({ queryKey: ['workout-plan', user?._id] });
    },
  });



  // Weekly Workout Plan Feature
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const today = new Date();
  // Fix the day calculation: getDay() returns 0=Sunday, 1=Monday, etc.
  // We need to convert this to our array where Monday=0, Tuesday=1, etc.
  const getDayIndex = (date: Date) => {
    const day = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Convert to our array index: Sunday=6, Monday=0, Tuesday=1, etc.
    return day === 0 ? 6 : day - 1;
  };
  const todayDay = daysOfWeek[getDayIndex(today)];
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editDay, setEditDay] = useState<string | null>(null);
  const [editExercises, setEditExercises] = useState<any[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPreferences, setAiPreferences] = useState({
    fitnessLevel: 'beginner',
    goals: ['strength'],
    availableDays: daysOfWeek,
    equipment: ['bodyweight'],
    focusAreas: ['full_body'],
    restDays: ["Sunday"] // Default rest day
  });
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Load user preferences from backend
  const [userPreferences, setUserPreferences] = useState<any>({});

  useEffect(() => {
    const loadUserPreferences = async () => {
      if (user?._id) {
        try {
          const preferences = await apiService.getUserPreferences();
          setUserPreferences(preferences);
        } catch (error) {
          console.error('Error loading user preferences:', error);
          setUserPreferences({});
        }
      }
    };
    loadUserPreferences();
  }, [user?._id]);

  // Save user preference helper
  const saveUserPreference = async (key: string, value: any) => {
    try {
      await apiService.saveUserPreference(key, value);
      setUserPreferences(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error saving user preference:', error);
    }
  };



  // Add/Edit Plan Handlers
  const openEditDay = (day: string) => {
    setEditDay(day);
    setEditExercises(localPlan?.[day] || []);
    setShowPlanModal(true);
  };
  const saveDayPlan = async () => {
    const newPlan = { ...(localPlan || {}) };
    newPlan[editDay!] = editExercises;
    
    console.log('Saving day plan for:', editDay); // Debug log
    console.log('Current plan before save:', plan); // Debug log
    console.log('New plan to save:', newPlan); // Debug log
    
    // Immediately update local state for instant UI feedback
    setLocalPlan(newPlan);
    
    try {
      await saveWorkoutPlanMutation.mutateAsync(newPlan);
      
      // Force a refetch to ensure we have the latest data from server
      setTimeout(() => {
        refetchPlan();
      }, 500);
      
      toast({
        title: "Plan Saved!",
        description: "Your weekly workout plan has been saved.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving workout plan:', error);
      // Revert local state if save failed
      setLocalPlan(plan);
      toast({
        title: "Save Failed",
        description: "Failed to save your weekly workout plan. Please try again.",
        variant: "destructive",
      });
    }
    setShowPlanModal(false);
    setEditDay(null);
    setEditExercises([]);
  };
  const addPlanExercise = () => setEditExercises([...editExercises, { name: "", sets: 3, reps: 10 }]);
  const updateExercise = (idx: number, field: string, value: any) => {
    setEditExercises(editExercises.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex));
  };
  const removePlanExercise = (idx: number) => setEditExercises(editExercises.filter((_, i) => i !== idx));

  // AI Workout Generation
  const generateAIWorkout = async () => {
    if (aiPreferences.restDays.length === daysOfWeek.length) {
      setAiSuggestions(null);
      toast({
        title: 'Invalid Plan',
        description: 'You must have at least one working day.',
        variant: 'destructive',
      });
      setIsGeneratingAI(false);
      return;
    }
    setIsGeneratingAI(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const workoutTemplates = {
        beginner: {
          strength: {
            Monday: [
              { name: "Full Body Strength", sets: 3, reps: 12 },
              { name: "Core Stability", sets: 3, reps: 30 }
            ],
            Tuesday: [
              { name: "Walking", sets: 1, reps: 20 },
              { name: "Stretching", sets: 1, reps: 15 }
            ],
            Wednesday: [
              { name: "Lower Body Focus", sets: 3, reps: 30 },
              { name: "Mobility Training", sets: 3, reps: 20 },
              { name: "Core Development", sets: 3, reps: 10 }
            ],
            Thursday: [
              { name: "Walking", sets: 1, reps: 25 },
              { name: "Yoga", sets: 1, reps: 20 }
            ],
            Friday: [
              { name: "Lunges", sets: 3, reps: 10 },
              { name: "Mountain Climbers", sets: 3, reps: 20 },
              { name: "Burpees", sets: 3, reps: 5 }
            ],
            Saturday: [
              { name: "Active Recovery", sets: 1, reps: 45 },
              { name: "Mobility Work", sets: 1, reps: 30 }
            ],
            Sunday: [
              { name: "Light Cardio", sets: 1, reps: 30 },
              { name: "Stretching", sets: 1, reps: 20 }
            ]
          },
          cardio: {
            Monday: [
              { name: "Jogging", sets: 1, reps: 15 },
              { name: "Jumping Jacks", sets: 3, reps: 20 }
            ],
            Tuesday: [
              { name: "Walking", sets: 1, reps: 30 },
              { name: "Stretching", sets: 1, reps: 15 }
            ],
            Wednesday: [
              { name: "Cycling", sets: 1, reps: 20 },
              { name: "High Knees", sets: 3, reps: 30 }
            ],
            Thursday: [
              { name: "Swimming", sets: 1, reps: 15 },
              { name: "Cool Down", sets: 1, reps: 10 }
            ],
            Friday: [
              { name: "Running", sets: 1, reps: 20 },
              { name: "Burpees", sets: 3, reps: 10 }
            ],
            Saturday: [
              { name: "Active Recovery", sets: 1, reps: 45 },
              { name: "Mobility Work", sets: 1, reps: 30 }
            ],
            Sunday: [
              { name: "Light Walking", sets: 1, reps: 25 },
              { name: "Gentle Stretching", sets: 1, reps: 15 }
            ]
          }
        },
        intermediate: {
          strength: {
            Monday: [
              { name: "Push Day Strength", sets: 4, reps: 8 },
              { name: "Upper Body Power", sets: 3, reps: 10 },
              { name: "Compound Movements", sets: 3, reps: 12 }
            ],
            Tuesday: [
              { name: "Deadlifts", sets: 4, reps: 6 },
              { name: "Barbell Rows", sets: 3, reps: 10 },
              { name: "Pull-ups", sets: 3, reps: 8 }
            ],
            Wednesday: [
              { name: "Leg Day Strength", sets: 4, reps: 8 },
              { name: "Lower Body Power", sets: 3, reps: 12 },
              { name: "Leg Development", sets: 4, reps: 15 }
            ],
            Thursday: [
              { name: "Overhead Press", sets: 4, reps: 8 },
              { name: "Lateral Raises", sets: 3, reps: 12 },
              { name: "Shrugs", sets: 3, reps: 15 }
            ],
            Friday: [
              { name: "Bicep Curls", sets: 3, reps: 12 },
              { name: "Tricep Extensions", sets: 3, reps: 12 },
              { name: "Forearm Curls", sets: 3, reps: 15 }
            ],
            Saturday: [
              { name: "Active Recovery", sets: 1, reps: 45 },
              { name: "Mobility Work", sets: 1, reps: 30 }
            ],
            Sunday: [
              { name: "Moderate Cardio", sets: 1, reps: 35 },
              { name: "Core Work", sets: 3, reps: 15 }
            ]
          },
          cardio: {
            Monday: [
              { name: "HIIT Training", sets: 5, reps: 30 },
              { name: "Sprint Intervals", sets: 8, reps: 30 }
            ],
            Tuesday: [
              { name: "Steady State Cardio", sets: 1, reps: 45 },
              { name: "Cool Down", sets: 1, reps: 10 }
            ],
            Wednesday: [
              { name: "Circuit Training", sets: 4, reps: 40 },
              { name: "Burpees", sets: 5, reps: 15 }
            ],
            Thursday: [
              { name: "Long Distance Run", sets: 1, reps: 60 },
              { name: "Stretching", sets: 1, reps: 15 }
            ],
            Friday: [
              { name: "Tabata Training", sets: 8, reps: 20 },
              { name: "Mountain Climbers", sets: 4, reps: 30 }
            ],
            Saturday: [
              { name: "Active Recovery", sets: 1, reps: 45 },
              { name: "Mobility Work", sets: 1, reps: 30 }
            ],
            Sunday: [
              { name: "Steady State Cardio", sets: 1, reps: 40 },
              { name: "Recovery Stretching", sets: 1, reps: 20 }
            ]
          }
        },
        advanced: {
          strength: {
            Monday: [
              { name: "Advanced Push Day", sets: 5, reps: 5 },
              { name: "Heavy Compound Lifts", sets: 4, reps: 8 },
              { name: "Power Development", sets: 4, reps: 10 },
              { name: "Accessory Work", sets: 3, reps: 12 }
            ],
            Tuesday: [
              { name: "Heavy Deadlifts", sets: 5, reps: 3 },
              { name: "T-Bar Rows", sets: 4, reps: 8 },
              { name: "Weighted Pull-ups", sets: 4, reps: 8 },
              { name: "Face Pulls", sets: 3, reps: 15 }
            ],
            Wednesday: [
              { name: "Advanced Leg Day", sets: 5, reps: 5 },
              { name: "Heavy Lower Body", sets: 4, reps: 8 },
              { name: "Leg Power Training", sets: 4, reps: 12 },
              { name: "Lower Body Development", sets: 5, reps: 20 }
            ],
            Thursday: [
              { name: "Military Press", sets: 5, reps: 5 },
              { name: "Lateral Raises", sets: 4, reps: 12 },
              { name: "Rear Delt Flyes", sets: 4, reps: 15 },
              { name: "Upright Rows", sets: 3, reps: 10 }
            ],
            Friday: [
              { name: "Barbell Curls", sets: 4, reps: 8 },
              { name: "Skull Crushers", sets: 4, reps: 10 },
              { name: "Hammer Curls", sets: 3, reps: 12 },
              { name: "Diamond Push-ups", sets: 3, reps: 15 }
            ],
            Saturday: [
              { name: "Active Recovery", sets: 1, reps: 45 },
              { name: "Mobility Work", sets: 1, reps: 30 }
            ],
            Sunday: [
              { name: "Intense Cardio", sets: 1, reps: 45 },
              { name: "Advanced Core", sets: 4, reps: 20 }
            ]
          },
          cardio: {
            Monday: [
              { name: "Advanced HIIT", sets: 8, reps: 45 },
              { name: "Plyometric Training", sets: 6, reps: 30 }
            ],
            Tuesday: [
              { name: "Long Distance Run", sets: 1, reps: 90 },
              { name: "Recovery Stretching", sets: 1, reps: 20 }
            ],
            Wednesday: [
              { name: "CrossFit Style", sets: 10, reps: 40 },
              { name: "Olympic Lifts", sets: 5, reps: 5 }
            ],
            Thursday: [
              { name: "Tempo Training", sets: 1, reps: 75 },
              { name: "Dynamic Stretching", sets: 1, reps: 15 }
            ],
            Friday: [
              { name: "Sprint Training", sets: 12, reps: 30 },
              { name: "Agility Drills", sets: 6, reps: 20 }
            ],
            Saturday: [
              { name: "Active Recovery", sets: 1, reps: 45 },
              { name: "Mobility Work", sets: 1, reps: 30 }
            ],
            Sunday: [
              { name: "Endurance Training", sets: 1, reps: 50 },
              { name: "Recovery Workout", sets: 2, reps: 25 }
            ]
          }
        }
      };

      const level = aiPreferences.fitnessLevel;
      const goal = aiPreferences.goals[0];
      const basePlan = workoutTemplates[level]?.[goal] || workoutTemplates.beginner.strength;

      // Adjust plan based on user-selected rest days
      const adjustedPlan = { ...basePlan };
      daysOfWeek.forEach(day => {
        if (aiPreferences.restDays.includes(day)) {
          adjustedPlan[day] = [{ name: "Rest Day", sets: 0, reps: 0 }];
        } else if (!basePlan[day] || basePlan[day].length === 0) {
          // If no workout for this day in template, use a default advanced workout
          adjustedPlan[day] = [
            { name: "Full Body Strength", sets: 5, reps: 5 }
          ];
        }
      });

      setAiSuggestions(adjustedPlan);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Save AI workout plan to backend
  const saveAIWorkoutPlan = async (workoutPlan: any) => {
    try {
      const response = await fetch('/api/workout-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getToken()}`,
        },
        body: JSON.stringify({ workoutPlan }),
      });
      if (!response.ok) throw new Error('Failed to save workout plan');
      return await response.json();
    } catch (error) {
      console.error('Error saving workout plan:', error);
      throw error;
    }
  };

  // Detect workout type based on exercises
  const getWorkoutType = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return "Rest Day";
    
    const exerciseNames = exercises.map(ex => ex.name.toLowerCase());
    
    // Check for specific workout types first
    if (exerciseNames.some(name => name.includes('active recovery') || name.includes('mobility'))) {
      return "Active Recovery & Mobility";
    }
    
    if (exerciseNames.some(name => name.includes('light walking') || name.includes('light jogging') || name.includes('recovery'))) {
      return "Recovery Day";
    }
    
    if (exerciseNames.some(name => name.includes('yoga') || name.includes('stretching'))) {
      return "Flexibility & Mobility";
    }
    
    if (exerciseNames.some(name => name.includes('hiit') || name.includes('tabata') || name.includes('circuit'))) {
      return "HIIT Training";
    }
    
    if (exerciseNames.some(name => name.includes('run') || name.includes('jog') || name.includes('cardio'))) {
      return "Cardio Training";
    }
    
    // Check for strength training patterns
    const hasLegExercises = exerciseNames.some(name => 
      name.includes('squat') || name.includes('lunge') || name.includes('leg') || 
      name.includes('calf') || name.includes('deadlift')
    );
    
    const hasPushExercises = exerciseNames.some(name => 
      name.includes('push') || name.includes('press') || name.includes('chest') || 
      name.includes('shoulder') || name.includes('tricep') || name.includes('dip')
    );
    
    const hasPullExercises = exerciseNames.some(name => 
      name.includes('pull') || name.includes('row') || name.includes('back') || 
      name.includes('bicep') || name.includes('curl')
    );
    
    // Determine workout type based on exercise patterns
    if (hasLegExercises && !hasPushExercises && !hasPullExercises) {
      return "Leg Day";
    }
    
    if (hasPushExercises && !hasLegExercises && !hasPullExercises) {
      return "Push Day";
    }
    
    if (hasPullExercises && !hasLegExercises && !hasPushExercises) {
      return "Pull Day";
    }
    
    if (hasLegExercises && hasPushExercises && hasPullExercises) {
      return "Full Body Strength";
    }
    
    if (hasPushExercises && hasPullExercises) {
      return "Upper Body Strength";
    }
    
    // Default strength training
    if (exerciseNames.some(name => 
      name.includes('weight') || name.includes('barbell') || name.includes('dumbbell') ||
      name.includes('strength') || name.includes('heavy')
    )) {
      return "Strength Training";
    }
    
    return "General Fitness";
  };

  const acceptAIWorkout = async () => {
    try {
      // Immediately update local state for instant UI feedback
      setLocalPlan(aiSuggestions);
      
      await saveWorkoutPlanMutation.mutateAsync(aiSuggestions);
      
      // Force a refetch to ensure we have the latest data from server
      setTimeout(() => {
        refetchPlan();
      }, 500);
      
      toast({
        title: "AI Workout Plan Applied!",
        description: "Your personalized weekly workout plan has been created and saved.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving AI workout plan:', error);
      // Revert local state if save failed
      setLocalPlan(plan);
      toast({
        title: "Save Failed",
        description: "Failed to save your AI workout plan. Please try again.",
        variant: "destructive",
      });
    }
    setShowAIModal(false);
    setAiSuggestions(null);
  };

  const modifyAIWorkout = () => {
    setShowAIModal(false);
    setShowPlanModal(true);
    setEditDay(daysOfWeek[0]);
    setEditExercises(aiSuggestions[daysOfWeek[0]] || []);
  };

  // Form validation functions
  const validateExerciseName = (name: string): string | undefined => {
    if (!name.trim()) return "Exercise name is required";
    if (name.trim().length < 2) return "Exercise name must be at least 2 characters";
    if (name.trim().length > 50) return "Exercise name must be less than 50 characters";
    return undefined;
  };

  const validateWeight = (weight: number): string | undefined => {
    if (weight < 0) return "Weight cannot be negative";
    if (weight > 1000) return "Weight seems too high";
    return undefined;
  };

  const validateReps = (reps: number): string | undefined => {
    if (reps < 0) return "Reps cannot be negative";
    if (reps > 100) return "Reps seem too high";
    return undefined;
  };

  const validateWorkoutSession = (): FormErrors => {
    const errors: FormErrors = {};
    
    // Check if there are any exercises
    if (currentSession.length === 0) {
      errors.general = "At least one exercise is required";
      return errors;
    }

    // Validate each exercise and its sets
    for (const exercise of currentSession) {
      if (!exercise.name.trim()) {
        errors.general = "All exercises must have names";
        return errors;
      }

      if (exercise.sets.length === 0) {
        errors.general = "Each exercise must have at least one set";
        return errors;
      }

      for (const set of exercise.sets) {
        const weightError = validateWeight(set.weight);
        const repsError = validateReps(set.reps);
        
        if (weightError) {
          errors.weight = weightError;
          return errors;
        }
        
        if (repsError) {
          errors.reps = repsError;
          return errors;
        }
      }
    }

    return errors;
  };

  const clearFormErrors = () => {
    setFormErrors({});
  };



  useEffect(() => {
    const fetchWorkouts = async () => {
      setWorkoutsLoading(true);
      setWorkoutsError(null);
      try {
        const workouts = await apiService.getWorkouts();
        console.log('Loaded workouts:', workouts); // Debug log
        setWorkouts(workouts || []);
      } catch (e: any) {
        console.error('Error fetching workouts:', e);
        setWorkoutsError(e.message || 'Error loading workouts');
      } finally {
        setWorkoutsLoading(false);
      }
    };
    if (user?._id) fetchWorkouts();
  }, [user?._id]);

  useEffect(() => {
    // Detect new coach notes
    const seenNotesKey = 'seen_coach_notes';
    const prevSeen = userPreferences[seenNotesKey] || [];
    const currentNotes = workouts
      .filter(w => w.note)
      .map(w => w.id)
      .sort();
    const newNotes = currentNotes.filter(id => !prevSeen.includes(id));
    if (newNotes.length > 0) {
      toast({
        title: 'New Coach Feedback',
        description: 'You have new feedback from your coach!',
        variant: 'default',
      });
      sendNotification('New Coach Feedback', { body: 'You have new feedback from your coach!' });
      saveUserPreference(seenNotesKey, currentNotes);
    }
  }, [workouts, userPreferences]);

  // Define streak as a derived value (e.g., consecutive workout days)
  const workoutDates = workouts.map(w => w.date || w.createdAt).filter(Boolean).map((d: string) => new Date(d).toDateString());
  const uniqueDates = Array.from(new Set(workoutDates)).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  let streak = 0;
  if (uniqueDates.length > 0) {
    let currentStreak = 1;
    for (let i = uniqueDates.length - 1; i > 0; i--) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    streak = currentStreak;
  }

  // Streak milestone notifications
  useEffect(() => {
    const streakMilestones = [7, 30, 100];
    const notifiedKey = 'streak_milestones_notified';
    const notified = userPreferences[notifiedKey] || [];
    streakMilestones.forEach(milestone => {
      if (streak === milestone && !notified.includes(milestone)) {
        sendNotification('Streak Milestone!', { body: `Congrats! You've hit a ${milestone}-day workout streak!` });
        saveUserPreference(notifiedKey, [...notified, milestone]);
      }
    });
  }, [streak, userPreferences]);

  // Helper to check if a day is a rest day in the plan
  const isRestDay = (planData: any, day: string) => {
    const exs = planData?.[day];
    return (
      exs &&
      exs.length === 1 &&
      exs[0].name.toLowerCase().includes('rest') &&
      exs[0].sets === 0 &&
      exs[0].reps === 0
    );
  };

  // Delete/Clear Plan
  const clearPlan = async () => {
    try {
      await deleteWorkoutPlanMutation.mutateAsync();
      toast({
        title: "Plan Deleted",
        description: "Your weekly workout plan has been deleted.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error clearing workout plan:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete your weekly workout plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Accept recommendation for today from the saved plan (not just AI suggestion)
  const acceptRecommendation = async () => {
    console.log('acceptRecommendation called, user:', user); // Debug log
    
    if (!localPlan || !localPlan[todayDay] || isRestDay(localPlan, todayDay)) {
      toast({
        title: "Rest Day!",
        description: "Today is your rest day. No workout to start.",
        variant: "default",
      });
      return;
    }
    
    // Convert today's plan to current session format
    const todayPlan = localPlan[todayDay];
    console.log('Loading today\'s plan:', todayDay, todayPlan); // Debug log
    
    // Convert to the format expected by Workouts page and save to backend
    const workoutForStorage = todayPlan
      .filter((ex: any) => ex && ex.name && ex.name.trim() !== '')
      .map((ex: any, index: number) => ({
        id: (Date.now() + index).toString(),
        name: ex.name.trim(),
        targetSets: ex.sets, // Add the missing targetSets field
        sets: Array.from({ length: ex.sets }, (_, setIndex) => ({
          id: (Date.now() + index * 100 + setIndex).toString(),
          weight: 0,
          reps: ex.reps,
        completed: false
      }))
      }));
    
    try {
      await apiService.saveCurrentWorkout(workoutForStorage);
      console.log('Workout saved to backend, navigating to /workouts'); // Debug log
    } catch (error) {
      console.error('Error saving current workout:', error);
      toast({
        title: "Error",
        description: "Failed to save workout session. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Workout Started!",
      description: `Your ${getWorkoutType(todayPlan)} workout has been loaded. Redirecting to Workouts page...`,
      variant: "default",
    });
    
    // Navigate to Workouts page immediately to prevent token issues
    console.log('Navigating to /workouts immediately, user authenticated:', !!user); // Debug log
    console.log('Token valid:', apiService.isAuthenticated()); // Debug log
    
    if (!apiService.isAuthenticated()) {
      console.error('Token lost, redirecting to login');
      navigate('/login');
      return;
    }
    
    navigate('/workouts');
  };

  const completedSets = currentSession.reduce((sum, ex) => sum + ex.sets.filter(set => set.completed).length, 0);
  const totalSets = currentSession.reduce((sum, ex) => sum + ex.targetSets, 0);
  const progress = (completedSets / totalSets) * 100;

  const convertWeight = (weight: number) => {
    return isKg ? Math.round(weight * 0.453592 * 10) / 10 : weight;
  };

  const getWeightIncrement = () => {
    return isKg ? 2.5 : 5;
  };

  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', delta: number) => {
    setCurrentSession(prev => prev.map(ex =>
      ex.id === exerciseId
        ? {
            ...ex,
            sets: ex.sets.map(set =>
        set.id === setId 
          ? { ...set, [field]: Math.max(0, set[field] + delta) }
          : set
      )
          }
        : ex
    ));
    clearFormErrors();
  };

  const toggleSetComplete = (exerciseId: string, setId: string) => {
    setCurrentSession(prev => prev.map(ex =>
      ex.id === exerciseId
        ? {
            ...ex,
            sets: ex.sets.map(set =>
        set.id === setId 
          ? { ...set, completed: !set.completed }
          : set
      )
          }
        : ex
    ));
  };

  const addSessionExercise = () => {
    const nameError = validateExerciseName(newExerciseName);
    if (nameError) {
      setFormErrors({ exerciseName: nameError });
      return;
    }

    setCurrentSession(prev => [
      ...prev,
      {
        id: (Date.now() + Math.random()).toString(),
        name: newExerciseName.trim(),
        targetSets: 3,
        sets: [
          { id: "1", weight: 100, reps: 8, completed: false },
          { id: "2", weight: 100, reps: 8, completed: false },
          { id: "3", weight: 100, reps: 8, completed: false },
        ]
      }
    ]);
    setNewExerciseName("");
    clearFormErrors();
  };

  const updateSetInput = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    // Validate input
    if (field === 'weight') {
      const weightError = validateWeight(value);
      if (weightError) {
        setFormErrors({ weight: weightError });
        return;
      }
    } else if (field === 'reps') {
      const repsError = validateReps(value);
      if (repsError) {
        setFormErrors({ reps: repsError });
        return;
      }
    }

    setCurrentSession(prev => prev.map(ex =>
      ex.id === exerciseId
        ? {
            ...ex,
            sets: ex.sets.map(set =>
              set.id === setId
                ? { ...set, [field]: value }
                : set
            )
          }
        : ex
    ));
    clearFormErrors();
  };

  const addSet = (exerciseId: string) => {
    setCurrentSession(prev => prev.map(ex =>
      ex.id === exerciseId
        ? {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: (Date.now() + Math.random()).toString(),
                weight: 100,
                reps: 8,
                completed: false
              }
            ],
            targetSets: ex.targetSets + 1
          }
        : ex
    ));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setCurrentSession(prev => prev.map(ex =>
      ex.id === exerciseId && ex.sets.length > 1
        ? {
            ...ex,
            sets: ex.sets.filter(set => set.id !== setId),
            targetSets: ex.targetSets - 1
          }
        : ex
    ));
  };

  const removeExercise = (exerciseId: string) => {
    if (currentSession.length === 1) return;
    setCurrentSession(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const saveWorkout = async () => {
    // Validate the entire workout session before saving
    const validationErrors = validateWorkoutSession();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      toast({
        title: 'Validation Error',
        description: validationErrors.general || validationErrors.weight || validationErrors.reps || 'Please check your workout data',
        variant: 'destructive',
      });
      return;
    }

    setSaveStatus('loading');
    clearFormErrors();
    
    try {
      console.log('Saving workout session:', currentSession);
      console.log('User ID:', user?._id);
      console.log('Token valid:', apiService.isAuthenticated());
      
      const requestBody = { session: currentSession };
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getToken()}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('Save workout response status:', res.status);
      console.log('Save workout response headers:', res.headers);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to save workout' }));
        console.error('Save workout error response:', errorData);
        throw new Error(errorData.message || errorData.error || 'Failed to save workout');
      }
      
      const data = await res.json();
      console.log('Workout saved successfully:', data);
      
      // Show success toast
      toast({
        title: 'Workout Saved!',
        description: 'Your workout has been saved successfully.',
        variant: 'default',
      });
      
      setSaveStatus('success');
      
      // Optimistically update the cache with the new workout
      const newWorkout = {
        _id: Date.now().toString(), // Temporary ID
        user: user?._id,
        session: currentSession,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Update all workout queries with the new data
      queryClient.setQueriesData(
        { predicate: (query) => query.queryKey[0] === 'workouts' },
        (oldData: any) => {
          if (!oldData) return { workouts: [newWorkout] };
          return {
            ...oldData,
            workouts: [newWorkout, ...(oldData.workouts || [])]
          };
        }
      );
      
      // Also update workouts-dashboard queries
      queryClient.setQueriesData(
        { predicate: (query) => query.queryKey[0] === 'workouts-dashboard' },
        (oldData: any) => {
          if (!oldData) return { workouts: [newWorkout] };
          return {
            ...oldData,
            workouts: [newWorkout, ...(oldData.workouts || [])]
          };
        }
      );
      
      // Force refetch to get the actual data from server
      setTimeout(async () => {
        await queryClient.refetchQueries({ 
          predicate: (query) => 
            query.queryKey[0] === 'workouts' || 
            query.queryKey[0] === 'workouts-dashboard'
        });
      }, 100);
      
      // Clear the current session after successful save
      setTimeout(() => {
        setCurrentSession([]);
        setSaveStatus('idle');
      }, 2000);
      
    } catch (e: any) {
      console.error('Save workout error:', e);
      console.error('Error details:', {
        message: e.message,
        stack: e.stack,
        name: e.name
      });
      
      // Show error toast
      toast({
        title: 'Save Failed',
        description: e.message || 'Failed to save workout. Please try again.',
        variant: 'destructive',
      });
      
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const sendRecFeedback = async (rating: 'easy' | 'just_right' | 'hard') => {
    try {
      await fetch('/api/recommendation/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getToken()}`,
        },
        body: JSON.stringify({ rating }),
      });
      setRecFeedbackSent(true);
      setTimeout(() => setRecFeedbackSent(false), 2000);
    } catch (error) {
      console.error('Error sending recommendation feedback:', error);
    }
  };

  const seenNotesKey = 'seen_coach_notes';
  const prevSeen = JSON.parse(localStorage.getItem(seenNotesKey) || '[]');
  const allNoteIds = workouts.filter(w => w.note).map(w => w.id);
  const unreadNoteIds = allNoteIds.filter(id => !prevSeen.includes(id));
  const markAllAsRead = async () => {
    await saveUserPreference(seenNotesKey, allNoteIds);
    window.location.reload(); // quick way to update UI
  };

  // Show all workouts directly without date filtering
  const displayWorkouts = workouts;

  // Helper to get last 7 dates including today
  const [last7Dates, setLast7Dates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Update last7Dates when component mounts and when workouts change
  useEffect(() => {
    const getLast7Dates = () => {
      const dates = [];
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        dates.push(subDays(today, i));
      }
      return dates.reverse();
    };
    setLast7Dates(getLast7Dates());
  }, [workouts]); // Recalculate when workouts change

  return (
    <div className="space-y-6">
      {/* Form Validation Errors */}
      {Object.keys(formErrors).length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-red-800">Please fix the following errors:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {formErrors.exerciseName && <li>• Exercise Name: {formErrors.exerciseName}</li>}
                {formErrors.weight && <li>• Weight: {formErrors.weight}</li>}
                {formErrors.reps && <li>• Reps: {formErrors.reps}</li>}
                {formErrors.general && <li>• {formErrors.general}</li>}
              </ul>
            </div>
          </div>
        </Card>
      )}



      {/* Recommended Workout Section */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Target className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Recommended Workout</h3>
        </div>
        
        {/* Weekly Plan Feature */}
        {!plan && (
          <div className="mb-4 space-y-3">
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => setShowPlanModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded">
                Add Your Weekly Workout Plan
              </Button>
              <Button 
                onClick={() => setShowAIModal(true)} 
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-semibold shadow-md transition-colors duration-200 border-2 border-purple-800"
                style={{ position: 'relative', zIndex: 10 }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Plan Your Week with AI
              </Button>
              </div>
            <p className="text-sm text-gray-600">
              Create your own plan or let AI suggest a personalized workout routine based on your fitness level and goals.
            </p>
            </div>
          )}
        {planLoading ? (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-blue-700">
                Today's Plan ({todayDay}) - Loading...
              </div>
              <div className="flex gap-2">
                <Button disabled className="text-xs px-2 py-1 bg-purple-100 text-purple-700 opacity-50">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Suggestions
                </Button>
                <Button disabled className="text-xs px-2 py-1 opacity-50">Edit Plan</Button>
              </div>
            </div>
            <div className="text-gray-500 text-sm">Loading your workout plan...</div>
          </div>
        ) : planError ? (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-red-600">⚠️</span>
              <div className="font-semibold text-red-700">Connection Error</div>
            </div>
            <div className="text-sm text-red-600 mb-3">
              Unable to load your workout plan. Please check if the server is running.
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => refetchPlan()} 
                className="text-xs px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-md transition-colors"
              >
                🔄 Retry
              </Button>
              <Button 
                onClick={() => setShowPlanModal(true)} 
                className="text-xs px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 rounded-md transition-colors"
              >
                Create New Plan
              </Button>
            </div>
          </div>
        ) : localPlan ? (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-blue-700">
                Today's Plan ({todayDay}) - {isRestDay(localPlan, todayDay) ? 'Rest Day' : getWorkoutType(localPlan[todayDay] || [])}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    console.log('Manual refresh clicked');
                    refetchPlan();
                  }} 
                  className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md transition-colors"
                  disabled={planLoading}
                >
                  <span className="mr-0">{planLoading ? '⏳' : '🔄'}</span>
                  {planLoading ? 'Loading...' : ''}
                </Button>
                <Button 
                  onClick={() => setShowAIModal(true)} 
                  className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-500 rounded-md transition-colors font-semibold shadow-sm"
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Suggestions
                </Button>
                <Button 
                  onClick={() => setShowPlanModal(true)} 
                  className="text-xs px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-md transition-colors"
                >
                  Edit Plan
                </Button>
              </div>
            </div>
            {isRestDay(localPlan, todayDay) ? (
              <div className="mt-4 space-y-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Today's Plan:</h4>
                  <div className="text-blue-600 text-sm">Today is a Rest Day. Enjoy your recovery!</div>
                </div>
                
                <Button 
                  onClick={() => {
                    toast({
                      title: "Rest Day!",
                      description: "Today is your rest day. No workout to start.",
                      variant: "default",
                    });
                  }}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-semibold"
                  disabled
                >
                  Rest Day - No Workout Today
                </Button>
              </div>
            ) : localPlan[todayDay] ? (
              <div className="mt-4 space-y-3">
                {/* Today's Exercises */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Today's Exercises:</h4>
                  <div className="space-y-2">
                    {localPlan[todayDay].map((exercise: any, index: number) => (
                      <div key={index} className="flex justify-between items-center bg-white p-2 rounded border">
                        <span className="font-medium text-gray-800">{exercise.name}</span>
                        <span className="text-sm text-gray-600">
                          {exercise.sets} sets × {exercise.reps} reps
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={acceptRecommendation}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold"
                >
                  Start Your Workout Today
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">No Plan for Today:</h4>
                  <div className="text-yellow-600 text-sm">No exercises planned for today. Edit your plan to add exercises.</div>
                </div>
                
                <Button 
                  onClick={() => setShowPlanModal(true)}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md font-semibold"
                >
                  Add Exercises for Today
                </Button>
              </div>
            )}
            

          </div>
        ) : null}

        {/* AI Recommendation Modal */}
        {showAIModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold">AI Workout Planner</h2>
              </div>

              {!aiSuggestions ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    Let AI create a personalized workout plan based on your fitness level, goals, and preferences.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fitness Level
                      </label>
                      <select
                        value={aiPreferences.fitnessLevel}
                        onChange={(e) => setAiPreferences({...aiPreferences, fitnessLevel: e.target.value})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Goal
                      </label>
                      <select
                        value={aiPreferences.goals[0]}
                        onChange={(e) => setAiPreferences({...aiPreferences, goals: [e.target.value]})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="strength">Strength Training</option>
                        <option value="cardio">Cardio & Endurance</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Which days are your <span className="font-semibold">rest days</span>?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {daysOfWeek.map(day => (
                          <label key={day} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={aiPreferences.restDays.includes(day)}
                              onChange={e => {
                                let newRestDays;
                                if (e.target.checked) {
                                  // Prevent all days from being selected as rest days
                                  if (aiPreferences.restDays.length === daysOfWeek.length - 1) {
                                    alert('At least one working day is required.');
                                    return;
                                  }
                                  newRestDays = [...aiPreferences.restDays, day];
                                } else {
                                  newRestDays = aiPreferences.restDays.filter(d => d !== day);
                                }
                                setAiPreferences({ ...aiPreferences, restDays: newRestDays });
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{day}</span>
                          </label>
                        ))}
                      </div>
                      {aiPreferences.restDays.length === daysOfWeek.length && (
                        <div className="text-red-600 text-xs mt-2">You must have at least one working day.</div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Equipment
                      </label>
                      <select
                        value={aiPreferences.equipment[0]}
                        onChange={(e) => setAiPreferences({...aiPreferences, equipment: [e.target.value]})}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="bodyweight">Bodyweight Only</option>
                        <option value="basic">Basic Equipment (Dumbbells, Resistance Bands)</option>
                        <option value="full">Full Gym Access</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end mt-6">
                    <Button onClick={() => setShowAIModal(false)} className="px-4 py-2">
                      Cancel
                    </Button>
                    <Button 
                      onClick={generateAIWorkout}
                      disabled={isGeneratingAI}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md transition-colors duration-200"
                    >
                      {isGeneratingAI ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Workout Plan
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                          <div>
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg mb-2">Your AI-Generated Workout Plan</h3>
                    <p className="text-sm text-gray-600">
                      Based on your preferences: {aiPreferences.fitnessLevel} level, {aiPreferences.goals[0]} focus
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    {aiPreferences.availableDays.map(day => (
                      <div key={day} className="border rounded p-3">
                        <h4 className="font-semibold text-blue-700 mb-2">{day}</h4>
                        {aiSuggestions[day] ? (
                          <div className="space-y-1">
                            {aiSuggestions[day].map((ex: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 text-sm">
                                <span className="font-medium">{ex.name}</span>
                                <span className="text-gray-600">{ex.sets} sets × {ex.reps} reps</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Rest day</p>
                        )}
                          </div>
                    ))}
                      </div>

                  <div className="flex gap-3 justify-end">
                    <Button onClick={() => setShowAIModal(false)} className="px-4 py-2">
                      Cancel
                    </Button>
                    <Button 
                      onClick={modifyAIWorkout} 
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-colors duration-200"
                    >
                      Modify Plan
                    </Button>
                    <Button 
                      onClick={acceptAIWorkout} 
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md transition-colors duration-200"
                    >
                      Accept Plan
                    </Button>
        </div>
                    </div>
                        )}
                    </div>
                  </div>
                    )}

        {/* Plan Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
              <h2 className="text-lg font-bold mb-4">Edit Weekly Workout Plan</h2>
              <div className="flex gap-2 mb-4 flex-wrap">
                {daysOfWeek.map(day => (
                  <Button key={day} onClick={() => openEditDay(day)} className={`px-3 py-1 text-xs rounded ${editDay === day ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{day}</Button>
                ))}
          </div>
              {editDay && (
                <div className="mb-4">
                  <div className="font-semibold mb-2">{editDay}</div>
                  {editExercises.map((ex, idx) => (
                    <div key={idx} className="flex gap-2 items-center mb-2">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={e => updateExercise(idx, 'name', e.target.value)}
                        placeholder="Exercise Name"
                        className="border rounded px-2 py-1 text-sm flex-1"
                      />
                      <input
                        type="number"
                        min="1"
                        value={ex.sets}
                        onChange={e => updateExercise(idx, 'sets', Number(e.target.value))}
                        className="border rounded px-2 py-1 w-16 text-sm"
                        placeholder="Sets"
                      />
                      <input
                        type="number"
                        min="1"
                        value={ex.reps}
                        onChange={e => updateExercise(idx, 'reps', Number(e.target.value))}
                        className="border rounded px-2 py-1 w-16 text-sm"
                        placeholder="Reps"
                      />
                      <Button onClick={() => removePlanExercise(idx)} className="text-xs px-2 py-1 bg-red-100 text-red-700">Remove</Button>
        </div>
                  ))}
                  <Button onClick={addPlanExercise} className="text-xs px-2 py-1 mt-2">Add Exercise</Button>
                  </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowPlanModal(false)} className="px-3 py-1">Cancel</Button>
                <Button onClick={saveDayPlan} className="px-3 py-1 bg-blue-600 text-white">Save Day</Button>
                            </div>
                          </div>
                          </div>
        )}
        {recLoading && <Skeleton className="w-full h-32 mb-4" />}
        {recError && <div className="text-red-500 text-sm">{(recError as Error).message}</div>}
        
          {!recLoading && !recError && recommendation && Array.isArray(recommendation.exercises) && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="space-y-3">
                {recommendation.exercises.map((ex: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{ex.name}</h4>
                      <p className="text-sm text-gray-600">{ex.sets.length} sets</p>
                        </div>
                    <div className="flex flex-wrap gap-1">
                    {ex.sets.map((set: any, j: number) => (
                        <Badge key={j} variant="secondary" className="text-xs">
                          {set.weight} lbs × {set.reps}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                </div>
              </div>
            

      </div>
          )}
        
          {!recLoading && !recError && !recommendation && (
          <div className="text-gray-500 text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No recommendation available at the moment.</p>
          </div>
        )}
    </Card>

      {/* Date Circles Selector */}
      {/* This section is now moved directly under the 'Previous Workouts' heading */}




      </div>
  );
};