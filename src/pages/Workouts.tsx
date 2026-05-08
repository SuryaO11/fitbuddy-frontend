import React, { useState, useEffect } from 'react';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Calendar, 
  Target, 
  Dumbbell,
  ChevronDown,
  ChevronRight,
  Minus,
  Check,
  Weight,
  Zap
} from 'lucide-react';
import { apiService } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { useToast } from '../hooks/use-toast';

interface WorkoutsProps {
  // Component props interface
}

export const Workouts: React.FC<WorkoutsProps> = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentWorkout, setCurrentWorkout] = useState<any[]>([]);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showPreviousWorkouts, setShowPreviousWorkouts] = useState(true);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [isKg, setIsKg] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [workoutNotes, setWorkoutNotes] = useState('');

  // Fetch workouts data
  const { data: workouts = [], isLoading: workoutsLoading, refetch } = useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      return await apiService.getWorkouts();
    },
    enabled: !!user // Only fetch if user is authenticated
  });

  // Extract workouts array from response
  const workoutsData = Array.isArray(workouts) ? workouts : [];

  // Generate last 7 days for date selection
  const generateDateButtons = () => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      dates.push(date);
    }
    return dates;
  };

  const dateButtons = generateDateButtons();

  // Get workouts for selected date
  const getWorkoutsForDate = (date: Date) => {
    // Ensure workouts is an array before filtering
    if (!Array.isArray(workoutsData)) {
      console.warn('Workouts data is not an array:', workoutsData);
      return [];
    }
    return workoutsData.filter((workout: any) => 
      isSameDay(new Date(workout.date), date)
    );
  };

  // Workout management functions
  const addExercise = () => {
    if (!newExerciseName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an exercise name",
        variant: "destructive",
      });
      return;
    }

    const newExercise = {
      name: newExerciseName.trim(),
      sets: [{ weight: 0, reps: 0 }]
    };

    setCurrentWorkout(prev => [...prev, newExercise]);
    setNewExerciseName('');
    setShowAddExercise(false);
    setIsWorkoutActive(true);
    
    toast({
      title: "Exercise Added",
      description: `${newExerciseName} has been added to your workout`,
    });
  };

  const removeExercise = (index: number) => {
    setCurrentWorkout(prev => prev.filter((_, i) => i !== index));
    if (currentWorkout.length === 1) {
      setIsWorkoutActive(false);
    }
  };

  const addSet = (exerciseIndex: number) => {
    setCurrentWorkout(prev => prev.map((exercise, i) => 
      i === exerciseIndex 
        ? { ...exercise, sets: [...exercise.sets, { weight: 0, reps: 0 }] }
        : exercise
    ));
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setCurrentWorkout(prev => prev.map((exercise, i) => 
      i === exerciseIndex 
        ? { ...exercise, sets: exercise.sets.filter((_, j) => j !== setIndex) }
        : exercise
    ));
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setCurrentWorkout(prev => prev.map((exercise, i) => 
      i === exerciseIndex 
        ? { 
            ...exercise, 
            sets: exercise.sets.map((set, j) => 
              j === setIndex 
                ? { ...set, [field]: Math.max(0, set[field] + value) }
                : set
            )
          }
        : exercise
    ));
  };

  const saveWorkout = async () => {
    if (currentWorkout.length === 0) {
      toast({
        title: "No workout to save",
        description: "Please add some exercises to your workout session.",
        variant: "destructive",
      });
      return;
    }

    // Validate that all exercises have required fields
    const invalidExercises = currentWorkout.filter(exercise => 
      !exercise.name || !exercise.targetSets || !exercise.sets || exercise.sets.length === 0
    );

    if (invalidExercises.length > 0) {
      toast({
        title: "Invalid workout data",
        description: "Some exercises are missing required information. Please check your workout.",
        variant: "destructive",
      });
      return;
    }

    setSaveStatus('loading');
    try {
      console.log('Saving workout data:', currentWorkout); // Debug log
      
      // Send only the session data as expected by the backend
      await apiService.saveWorkout(currentWorkout);

      // Optimistically update the cache with the new workout
      const newWorkout = {
        _id: Date.now().toString(), // Temporary ID
        user: user?._id,
        session: currentWorkout,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Update all workout queries with the new data
      queryClient.setQueriesData(
        { predicate: (query) => query.queryKey[0] === 'workouts' },
        (oldData: any) => {
          if (!oldData) return [newWorkout];
          return [newWorkout, ...(Array.isArray(oldData) ? oldData : [])];
        }
      );
      
      // Also update workouts-dashboard queries
      queryClient.setQueriesData(
        { predicate: (query) => query.queryKey[0] === 'workouts-dashboard' },
        (oldData: any) => {
          if (!oldData) return [newWorkout];
          return [newWorkout, ...(Array.isArray(oldData) ? oldData : [])];
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

      toast({
        title: "Workout saved!",
        description: "Your workout has been saved successfully.",
        variant: "default",
      });

      setCurrentWorkout([]);
      setWorkoutNotes('');
      setSaveStatus('success');
    } catch (error) {
      console.error('Save workout error:', error);
      toast({
        title: "Error saving workout",
        description: "Failed to save your workout. Please try again.",
        variant: "destructive",
      });
      setSaveStatus('error');
    }
  };

  const clearWorkout = async () => {
    try {
      await apiService.clearCurrentWorkout();
      setCurrentWorkout([]);
      setIsWorkoutActive(false);
      toast({
        title: "Workout Cleared",
        description: "Current workout has been cleared",
      });
    } catch (error) {
      console.error('Error clearing workout:', error);
      toast({
        title: "Error",
        description: "Failed to clear workout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const convertWeight = (weight: number) => {
    return isKg ? Math.round(weight * 0.453592) : weight;
  };

  const getWeightIncrement = () => {
    return isKg ? 2.5 : 5;
  };

  const updateSetInput = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setCurrentWorkout(prev => prev.map((exercise, i) => 
      i === exerciseIndex 
        ? { 
            ...exercise, 
            sets: exercise.sets.map((set, j) => 
              j === setIndex 
                ? { ...set, [field]: Math.max(0, value) }
                : set
            )
          }
        : exercise
    ));
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    setCurrentWorkout(prev => prev.map((exercise, i) => 
      i === exerciseIndex 
        ? { 
            ...exercise, 
            sets: exercise.sets.map((set, j) => 
              j === setIndex 
                ? { ...set, completed: !set.completed }
                : set
            )
          }
        : exercise
    ));
  };

  const addSessionExercise = () => {
    if (!newExerciseName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an exercise name",
        variant: "destructive",
      });
      return;
    }

    const newExercise = {
      name: newExerciseName.trim(),
      sets: [{ weight: 0, reps: 0 }],
      targetSets: 1
    };
    
    setCurrentWorkout(prev => [...prev, newExercise]);
    setNewExerciseName('');
    setIsWorkoutActive(true);
  };

  // Load current workout from backend on component mount
  useEffect(() => {
    const loadCurrentWorkout = async () => {
      try {
        const currentWorkoutData = await apiService.getCurrentWorkout();
        console.log('Loaded current workout from backend:', currentWorkoutData); // Debug log
        
        if (currentWorkoutData && currentWorkoutData.length > 0) {
          // Validate and fix the workout data structure
          const validatedWorkout = currentWorkoutData.filter((exercise: any) => 
            exercise && exercise.name && exercise.name.trim() !== ''
          ).map((exercise: any) => ({
            ...exercise,
            name: exercise.name.trim(),
            targetSets: exercise.targetSets || exercise.sets?.length || 1, // Ensure targetSets exists
            sets: exercise.sets || [{ weight: 0, reps: 0 }] // Ensure sets exist
          }));
          
          console.log('Validated workout data:', validatedWorkout); // Debug log
          setCurrentWorkout(validatedWorkout);
          setIsWorkoutActive(validatedWorkout.length > 0);
        }
      } catch (error) {
        console.error('Error loading current workout:', error);
      }
    };
    
    loadCurrentWorkout();
  }, []);

  // Save current workout to backend whenever it changes
  useEffect(() => {
    const saveCurrentWorkout = async () => {
      if (currentWorkout.length > 0) {
        try {
          await apiService.saveCurrentWorkout(currentWorkout);
        } catch (error) {
          console.error('Error saving current workout:', error);
        }
      } else {
        try {
          await apiService.clearCurrentWorkout();
        } catch (error) {
          console.error('Error clearing current workout:', error);
        }
      }
    };
    
    // Increase debounce time to 3 seconds to reduce API calls
    const timeoutId = setTimeout(saveCurrentWorkout, 3000);
    return () => clearTimeout(timeoutId);
  }, [currentWorkout]);

  if (workoutsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" id="workouts-content">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" id="workouts-content">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Dumbbell className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workouts</h1>
              <p className="text-gray-600">Manage your current and previous workout sessions</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Current Workout Session */}
          <Card className="flex-1 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Current Workout Session</h3>
              </div>
            </div>

            <div className="space-y-6">
              {currentWorkout.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mb-4">
                    <Target className="h-16 w-16 mx-auto text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Workout Plan Selected</h3>
                  <p className="text-gray-500 mb-4">
                    Please select a workout plan from the recommended workout section above to start your session.
                  </p>
                  <div className="text-sm text-gray-400">
                    Click "Start Your Workout Today" to load your recommended workout into this session.
                  </div>
                </div>
              ) : (
                currentWorkout
                  .filter((exercise: any) => exercise && exercise.name && exercise.name.trim() !== '')
                  .map((exercise, exerciseIndex) => {
                    const completedSets = exercise.sets.filter((set: any) => set.completed).length;
                    const progress = (completedSets / exercise.sets.length) * 100;
                    return (
                      <Card key={exercise.id || exerciseIndex} className="p-6 bg-white border-green-200">
                        <div className="space-y-6">
                          {/* Exercise Header */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex-1">
                              <h2 className="text-xl font-bold text-gray-900 mb-1">{exercise.name}</h2>
                              <div className="flex items-center gap-4">
                                <p className="text-sm text-gray-600">
                                  {completedSets} of {exercise.sets.length} sets completed
                                </p>
                                <Button 
                                  onClick={() => setIsKg(!isKg)}
                                  className="text-xs border border-gray-300 hover:bg-gray-100"
                                >
                                  {isKg ? 'kg' : 'lbs'}
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                onClick={() => removeExercise(exerciseIndex)} 
                                disabled={currentWorkout.length === 1}
                                className="text-red-600 hover:text-red-700 border-red-300 border px-3 py-1 text-sm"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                              <span>Progress</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-3" />
                          </div>

                          {/* Sets */}
                          <div className="space-y-4">
                            {exercise.sets.map((set: any, setIndex: number) => (
                              <Card key={set.id || setIndex} className={`p-3 transition-all ${
                                set.completed 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}>
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                                  <div className="flex flex-wrap items-center gap-3">
                                    <Badge className="w-7 h-7 rounded-full p-0 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                      {setIndex + 1}
                                    </Badge>
                                    
                                    {/* Weight Control */}
                                    <div className="flex items-center gap-1">
                                      <Weight className="h-3 w-3 text-gray-500" />
                                      <Button 
                                        onClick={() => updateSet(exerciseIndex, setIndex, 'weight', -getWeightIncrement())}
                                        className="border border-gray-300 hover:bg-gray-100 px-1.5 py-1 bg-white text-xs"
                                        title="Decrease Weight"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <Input 
                                        value={convertWeight(set.weight)} 
                                        onChange={e => { 
                                          const value = parseFloat(e.target.value) || 0; 
                                          const convertedValue = isKg ? Math.round(value / 0.453592) : value; 
                                          updateSetInput(exerciseIndex, setIndex, 'weight', convertedValue); 
                                        }} 
                                        className="w-16 text-center text-sm" 
                                      />
                                      <span className="text-xs text-gray-600 w-6">{isKg ? 'kg' : 'lbs'}</span>
                                      <Button 
                                        onClick={() => updateSet(exerciseIndex, setIndex, 'weight', getWeightIncrement())}
                                        className="border border-gray-300 hover:bg-gray-100 px-1.5 py-1 bg-white text-xs"
                                        title="Increase Weight"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>

                                    {/* Reps Control */}
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        onClick={() => updateSet(exerciseIndex, setIndex, 'reps', -1)}
                                        className="border border-gray-300 hover:bg-gray-100 px-1.5 py-1 bg-white text-xs"
                                        title="Decrease Reps"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <Input 
                                        value={set.reps} 
                                        onChange={e => { 
                                          const value = parseInt(e.target.value) || 0; 
                                          updateSetInput(exerciseIndex, setIndex, 'reps', value); 
                                        }} 
                                        className="w-16 text-center text-sm" 
                                      />
                                      <span className="text-xs text-gray-600 w-8">reps</span>
                                      <Button 
                                        onClick={() => updateSet(exerciseIndex, setIndex, 'reps', 1)}
                                        className="border border-gray-300 hover:bg-gray-100 px-1.5 py-1 bg-white text-xs"
                                        title="Increase Reps"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-2">
                                    <Button
                                      onClick={() => toggleSetComplete(exerciseIndex, setIndex)}
                                      className={`min-w-[100px] ${
                                        set.completed
                                          ? 'bg-green-600 hover:bg-green-700 text-white'
                                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                      }`}
                                    >
                                      {set.completed ? (
                                        <>
                                          <Check className="h-4 w-4 mr-2" />
                                          Done
                                        </>
                                      ) : (
                                        'Complete'
                                      )}
                                    </Button>
                                    <Button
                                      onClick={() => removeSet(exerciseIndex, setIndex)}
                                      disabled={exercise.sets.length === 1}
                                      className="text-red-600 hover:text-red-700 border-red-300 border px-2 py-1 text-sm"
                                      title="Remove Set"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}

                            <div className="flex justify-end">
                              <Button
                                onClick={() => addSet(exerciseIndex)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Set
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
              )}
            </div>

            {/* Add Exercise */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="Enter exercise name..."
                  value={newExerciseName}
                  onChange={e => setNewExerciseName(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && addSessionExercise()}
                />
                <Button
                  onClick={addSessionExercise}
                  disabled={!newExerciseName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            {currentWorkout.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={saveWorkout}
                  disabled={saveStatus === 'loading'}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 text-lg rounded-lg transition-colors"
                >
                  {saveStatus === 'loading' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : saveStatus === 'success' ? (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Saved!
                    </>
                  ) : saveStatus === 'error' ? (
                    <>
                      <Edit className="h-5 w-5 mr-2" />
                      Error
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Save Workout
                    </>
                  )}
                </Button>
                <Button
                  onClick={clearWorkout}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 text-lg rounded-lg transition-colors"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Clear Workout
                </Button>
              </div>
            )}
          </Card>

          {/* Previous Workouts */}
          <Card className="xl:w-96 lg:w-80 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Previous Workouts</h3>
              </div>
              <Button
                onClick={() => setShowPreviousWorkouts(!showPreviousWorkouts)}
                className="xl:hidden text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                {showPreviousWorkouts ? (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Show
                  </>
                )}
              </Button>
            </div>

            <div className={`space-y-6 ${showPreviousWorkouts ? 'block' : 'hidden xl:block'}`}>
              {/* Date Selection Buttons */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {dateButtons.map((date) => {
                  const dayWorkouts = getWorkoutsForDate(date);
                  const isSelected = isSameDay(date, selectedDate);
                  const hasWorkouts = dayWorkouts.length > 0;
                  
                  return (
                    <Button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : hasWorkouts
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xs">{format(date, 'EEE')}</div>
                        <div className="font-bold">{format(date, 'd')}</div>
                        {hasWorkouts && (
                          <div className="text-xs mt-1">
                            {dayWorkouts.length} workout{dayWorkouts.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>

              {/* Selected Date Workouts */}
              <div className="space-y-4">
                {getWorkoutsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No workouts found for {format(selectedDate, 'MMMM d, yyyy')}
                  </div>
                ) : (
                  getWorkoutsForDate(selectedDate).map((workout: any, index: number) => {
                    // Handle both old format (exercise) and new format (session)
                    const exercises = workout.session || (workout.exercise ? [workout.exercise] : []);
                    
                    return (
                      <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                        <div className="space-y-4">
                          {/* Workout Header */}
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-gray-900">
                              Workout {index + 1}
                            </h4>
                            <Badge className="bg-blue-100 text-blue-700">
                              {exercises.length} exercises
                            </Badge>
                          </div>
                          
                          {/* Exercises with Data Entry Pattern */}
                          <div className="space-y-3">
                            {exercises.map((exercise: any, exIndex: number) => (
                              <div key={exIndex} className="border-l-2 border-blue-200 pl-3">
                                {/* Exercise Name */}
                                <div className="font-medium text-gray-800 mb-2">{exercise.name}</div>
                                
                                {/* Sets Data Display */}
                                <div className="space-y-2">
                                  {exercise.sets.map((set: any, setIndex: number) => (
                                    <div key={setIndex} className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                                      Set {setIndex + 1}: {set.weight || 0}kg × {set.reps || 0} reps
                                    </div>
                                  ))}
                                </div>
                                
                                {/* Summary */}
                                <div className="text-sm text-gray-500 mt-2">
                                  {exercise.sets.length} sets • {exercise.sets[0]?.reps || 0} reps
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Workouts; 