import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../lib/api';

// Universal data hooks that work on both web and mobile

// User data hooks
export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await apiService.getCurrentUser();
      return response.data;
    },
    enabled: apiService.isAuthenticated(),
  });
};

export const useUserPreferences = () => {
  return useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      return await apiService.getUserPreferences();
    },
    enabled: apiService.isAuthenticated(),
  });
};

export const useUserSettings = () => {
  return useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      return await apiService.getUserSettings();
    },
    enabled: apiService.isAuthenticated(),
  });
};

// Workout data hooks
export const useWorkouts = () => {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      return await apiService.getWorkouts();
    },
    enabled: apiService.isAuthenticated(),
  });
};

export const useWorkoutPlan = () => {
  return useQuery({
    queryKey: ['workoutPlan'],
    queryFn: async () => {
      return await apiService.getWorkoutPlan();
    },
    enabled: apiService.isAuthenticated(),
  });
};

export const useCurrentWorkout = () => {
  return useQuery({
    queryKey: ['currentWorkout'],
    queryFn: async () => {
      return await apiService.getCurrentWorkout();
    },
    enabled: apiService.isAuthenticated(),
  });
};

export const useRecommendation = () => {
  return useQuery({
    queryKey: ['recommendation'],
    queryFn: async () => {
      return await apiService.getRecommendation();
    },
    enabled: apiService.isAuthenticated(),
  });
};

// New Analytics hooks
export const useWorkoutAnalytics = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['workoutAnalytics', startDate, endDate],
    queryFn: async () => {
      return await apiService.getWorkoutAnalytics(startDate, endDate);
    },
    enabled: apiService.isAuthenticated(),
  });
};

// Macro tracking hooks
export const useMacroData = (date?: string) => {
  return useQuery({
    queryKey: ['macroData', date],
    queryFn: async () => {
      return await apiService.getMacroData(date);
    },
    enabled: apiService.isAuthenticated(),
  });
};

// Friends and social hooks
export const useFriends = () => {
  return useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      return await apiService.getFriends();
    },
    enabled: apiService.isAuthenticated(),
  });
};

export const useFriendRequests = () => {
  return useQuery({
    queryKey: ['friendRequests'],
    queryFn: async () => {
      return await apiService.getFriendRequests();
    },
    enabled: apiService.isAuthenticated(),
  });
};

// Challenge hooks
export const useChallenges = () => {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      return await apiService.getChallenges();
    },
    enabled: apiService.isAuthenticated(),
  });
};

// Coach-specific hooks
export const useCoachClients = () => {
  return useQuery({
    queryKey: ['coachClients'],
    queryFn: async () => {
      return await apiService.getCoachClients();
    },
    enabled: apiService.isAuthenticated(),
  });
};

// Admin-specific hooks
export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      return await apiService.getAdminUsers();
    },
    enabled: apiService.isAuthenticated(),
  });
};

export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      return await apiService.getAdminAnalytics();
    },
    enabled: apiService.isAuthenticated(),
  });
};

// Form check data hooks
export const useFormChecks = () => {
  return useQuery({
    queryKey: ['formChecks'],
    queryFn: async () => {
      return await apiService.getFormChecks();
    },
    enabled: apiService.isAuthenticated(),
  });
};



// Mutation hooks
export const useSaveWorkout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (session: any[]) => {
      return await apiService.saveWorkout(session);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workoutAnalytics'] });
    },
  });
};

export const useSaveWorkoutPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (plan: any) => {
      return await apiService.saveWorkoutPlan(plan);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutPlan'] });
    },
  });
};

export const useSaveCurrentWorkout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (session: any[]) => {
      return await apiService.saveCurrentWorkout(session);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentWorkout'] });
    },
  });
};

export const useSaveFormCheck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      return await apiService.saveFormCheck(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formChecks'] });
    },
  });
};

export const useDeleteFormCheck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      return await apiService.deleteFormCheck(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formChecks'] });
    },
  });
};

export const useDeleteAllFormChecks = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      return await apiService.deleteAllFormChecks();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formChecks'] });
    },
  });
};

export const useSaveUserPreference = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      return await apiService.saveUserPreference(key, value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    },
  });
};

export const useSaveUserSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: any) => {
      return await apiService.saveUserSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });
};

// New mutation hooks for enhanced functionality
export const useSaveMacroData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (macroData: any) => {
      return await apiService.saveMacroData(macroData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['macroData'] });
    },
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (friendId: string) => {
      return await apiService.sendFriendRequest(friendId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (requestId: string) => {
      return await apiService.acceptFriendRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
};

export const useCreateChallenge = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (challengeData: any) => {
      return await apiService.createChallenge(challengeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

export const useJoinChallenge = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (challengeId: string) => {
      return await apiService.joinChallenge(challengeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

// Coach-specific mutations
export const useAssignWorkoutToClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ clientId, workoutData }: { clientId: string; workoutData: any }) => {
      return await apiService.assignWorkoutToClient(clientId, workoutData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coachClients'] });
    },
  });
};



// Authentication mutations
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      return await apiService.login(email, password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ name, email, password }: { name: string; email: string; password: string }) => {
      return await apiService.register(name, email, password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });
};


