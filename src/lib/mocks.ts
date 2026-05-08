import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';

let worker: any = null;

if (import.meta.env.DEV) {
  console.log('MSW static import setup starting...');
  
  // Load users from localStorage or initialize empty array
  const getUsers = (): { email: string; password: string; name: string }[] => {
    try {
      const stored = localStorage.getItem('msw-users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save users to localStorage
  const saveUsers = (users: { email: string; password: string; name: string }[]) => {
    try {
      localStorage.setItem('msw-users', JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save users to localStorage:', error);
    }
  };

  // Load workouts from localStorage or initialize empty array
  const getWorkouts = (): any[] => {
    try {
      const stored = localStorage.getItem('msw-workouts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save workouts to localStorage
  const saveWorkouts = (workouts: any[]) => {
    try {
      localStorage.setItem('msw-workouts', JSON.stringify(workouts));
    } catch (error) {
      console.error('Failed to save workouts to localStorage:', error);
    }
  };

  // Load workout plans from localStorage or initialize empty array
  const getWorkoutPlans = (): any[] => {
    try {
      const stored = localStorage.getItem('msw-workout-plans');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save workout plans to localStorage
  const saveWorkoutPlans = (plans: any[]) => {
    try {
      localStorage.setItem('msw-workout-plans', JSON.stringify(plans));
    } catch (error) {
      console.error('Failed to save workout plans to localStorage:', error);
    }
  };

  // Initialize with some test users if none exist
  const initializeTestUsers = () => {
    const users = getUsers();
    if (users.length === 0) {
      const testUsers = [
        { email: 'test@example.com', password: 'password123', name: 'Rahul Sharma' },
        { email: 'admin@example.com', password: 'admin123', name: 'Priya Patel' }
      ];
      saveUsers(testUsers);
      console.log('Initialized with test users:', testUsers.map(u => ({ email: u.email, name: u.name })));
    }
  };

  // Initialize test workouts if none exist
  const initializeTestWorkouts = () => {
    const workouts = getWorkouts();
    if (workouts.length === 0) {
      const testWorkouts = [
        {
          id: '1',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
          exercise: {
            name: 'Bench Press',
            sets: [
              { id: '1', weight: 185, reps: 8, completed: true },
              { id: '2', weight: 185, reps: 8, completed: true },
              { id: '3', weight: 190, reps: 6, completed: true },
              { id: '4', weight: 190, reps: 6, completed: true },
            ]
          },
          note: 'Great form! Keep up the good work.'
        },
        {
          id: '2',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
          exercise: {
            name: 'Squats',
            sets: [
              { id: '1', weight: 225, reps: 10, completed: true },
              { id: '2', weight: 225, reps: 10, completed: true },
              { id: '3', weight: 230, reps: 8, completed: true },
            ]
          }
        }
      ];
      saveWorkouts(testWorkouts);
      console.log('Initialized with test workouts');
    }
  };

  // Initialize test data
  initializeTestUsers();
  initializeTestWorkouts();

  const handlers = [
    http.post('/api/register', async (req) => {
      try {
      const { email, password, name } = await req.request.json() as { email: string; password: string; name: string };
        
      if (!email || !password || !name) {
        return HttpResponse.json({ message: 'All fields required' }, { status: 400 });
      }
        
        const users = getUsers();
      if (users.find(u => u.email === email)) {
        return HttpResponse.json({ message: 'Email already registered' }, { status: 409 });
      }
        
      users.push({ email, password, name });
        saveUsers(users);
        
        console.log('User registered successfully:', { email, name });
      return new HttpResponse(null, { status: 201 });
      } catch (error) {
        console.error('Registration error:', error);
        return HttpResponse.json({ message: 'Registration failed' }, { status: 500 });
      }
    }),
    
    http.post('/api/login', async (req) => {
      try {
      const { email, password } = await req.request.json() as { email: string; password: string };
        
        if (!email || !password) {
          return HttpResponse.json({ message: 'Email and password required' }, { status: 400 });
        }
        
        const users = getUsers();
        console.log('Available users:', users.map(u => ({ email: u.email, name: u.name })));
        
      const user = users.find(u => u.email === email && u.password === password);
        
      if (!user) {
          console.log('Login failed for email:', email);
        return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }
        
        console.log('Login successful for user:', user.name);
        return HttpResponse.json({ 
          token: 'demo-jwt-token', 
          name: user.name, 
          role: 'user' 
        }, { status: 200 });
      } catch (error) {
        console.error('Login error:', error);
        return HttpResponse.json({ message: 'Login failed' }, { status: 500 });
      }
    }),

    // GET /api/workouts - Retrieve user's workouts
    http.get('/api/workouts', async (req) => {
      try {
        const workouts = getWorkouts();
        console.log('Retrieved workouts:', workouts.length);
        return HttpResponse.json({ workouts }, { status: 200 });
      } catch (error) {
        console.error('Failed to retrieve workouts:', error);
        return HttpResponse.json({ message: 'Failed to retrieve workouts' }, { status: 500 });
      }
    }),

    // POST /api/workouts - Save a new workout
    http.post('/api/workouts', async (req) => {
      try {
        const { session } = await req.request.json() as { session: any[] };
        
        if (!session || !Array.isArray(session)) {
          return HttpResponse.json({ message: 'Invalid workout data' }, { status: 400 });
        }

        const workouts = getWorkouts();
        const newWorkout = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          session: session,
          createdAt: new Date().toISOString()
        };
        
        workouts.unshift(newWorkout); // Add to beginning of array
        saveWorkouts(workouts);
        
        console.log('Workout saved successfully:', newWorkout.id);
        return HttpResponse.json({ 
          message: 'Workout saved successfully',
          workout: newWorkout 
        }, { status: 201 });
      } catch (error) {
        console.error('Failed to save workout:', error);
        return HttpResponse.json({ message: 'Failed to save workout' }, { status: 500 });
      }
    }),

    // GET /api/recommendation - Get workout recommendations
    http.get('/api/recommendation', async (req) => {
      try {
        // Get today's workout plan from localStorage
        const savedPlan = localStorage.getItem('weekly-workout-plan');
        const today = new Date();
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        const getDayIndex = (date: Date) => {
          const day = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
          return day === 0 ? 6 : day - 1;
        };
        const todayDay = daysOfWeek[getDayIndex(today)];
        
        let recommendation = null;
        
        if (savedPlan) {
          const plan = JSON.parse(savedPlan);
          const todayPlan = plan[todayDay];
          
          if (todayPlan && todayPlan.length > 0) {
            // Convert today's plan to recommendation format
            recommendation = {
              exercises: todayPlan.map((ex: any) => ({
                name: ex.name,
                sets: Array.from({ length: ex.sets }, () => ({
                  weight: 0, // No weight for recovery/mobility exercises
                  reps: ex.reps
                }))
              }))
            };
            console.log('Generated recommendation from today\'s plan:', todayDay, recommendation);
          }
        }
        
        // Fallback to default recommendation if no plan exists
        if (!recommendation) {
          recommendation = {
            exercises: [
              {
                name: 'Active Recovery',
                sets: [
                  { weight: 0, reps: 45 }
                ]
              },
              {
                name: 'Mobility Work',
                sets: [
                  { weight: 0, reps: 30 }
                ]
              }
            ]
          };
          console.log('Generated fallback recommendation');
        }
        
        return HttpResponse.json({ recommendation }, { status: 200 });
      } catch (error) {
        console.error('Failed to generate recommendation:', error);
        return HttpResponse.json({ message: 'Failed to generate recommendation' }, { status: 500 });
      }
    }),

    // POST /api/recommendation/feedback - Submit recommendation feedback
    http.post('/api/recommendation/feedback', async (req) => {
      try {
        const { rating } = await req.request.json() as { rating: string };
        console.log('Received recommendation feedback:', rating);
        return HttpResponse.json({ message: 'Feedback received' }, { status: 200 });
      } catch (error) {
        console.error('Failed to save feedback:', error);
        return HttpResponse.json({ message: 'Failed to save feedback' }, { status: 500 });
      }
    }),

    // POST /api/workout-plans - Save AI-generated workout plan
    http.post('/api/workout-plans', async (req) => {
      try {
        const { plan, preferences, createdAt } = await req.request.json() as { 
          plan: any; 
          preferences: any; 
          createdAt: string; 
        };
        
        if (!plan || !preferences) {
          return HttpResponse.json({ message: 'Invalid workout plan data' }, { status: 400 });
        }

        const plans = getWorkoutPlans();
        const newPlan = {
          id: Date.now().toString(),
          plan: plan,
          preferences: preferences,
          createdAt: createdAt || new Date().toISOString(),
          userId: 'demo-user-id'
        };
        
        plans.unshift(newPlan); // Add to beginning of array
        saveWorkoutPlans(plans);
        
        console.log('Workout plan saved successfully:', newPlan.id);
        return HttpResponse.json({ 
          message: 'Workout plan saved successfully',
          plan: newPlan 
        }, { status: 201 });
      } catch (error) {
        console.error('Failed to save workout plan:', error);
        return HttpResponse.json({ message: 'Failed to save workout plan' }, { status: 500 });
      }
    }),

    // GET /api/workout-plans - Get user's workout plans
    http.get('/api/workout-plans', async (req) => {
      try {
        const plans = getWorkoutPlans();
        console.log('Retrieved workout plans:', plans.length);
        return HttpResponse.json({ plans }, { status: 200 });
      } catch (error) {
        console.error('Failed to retrieve workout plans:', error);
        return HttpResponse.json({ message: 'Failed to retrieve workout plans' }, { status: 500 });
      }
    }),

    // Add a helper endpoint to clear mock data (for testing)
    http.post('/api/clear-mock-data', () => {
      try {
        localStorage.removeItem('msw-users');
        localStorage.removeItem('msw-workouts');
        localStorage.removeItem('msw-workout-plans');
        console.log('Mock data cleared');
        return HttpResponse.json({ message: 'Mock data cleared' }, { status: 200 });
      } catch (error) {
        console.error('Failed to clear mock data:', error);
        return HttpResponse.json({ message: 'Failed to clear mock data' }, { status: 500 });
      }
    }),
  ];
  
  worker = setupWorker(...handlers);
  worker.start().then(() => {
    console.log('MSW worker started successfully');
    console.log('Available test users:');
    console.log('- test@example.com / password123 (Rahul Sharma)');
    console.log('- admin@example.com / admin123 (Priya Patel)');
    console.log('Available endpoints:');
    console.log('- POST /api/register');
    console.log('- POST /api/login');
    console.log('- GET /api/workouts');
    console.log('- POST /api/workouts');
    console.log('- GET /api/recommendation');
    console.log('- POST /api/recommendation/feedback');
    console.log('- POST /api/workout-plans');
    console.log('- GET /api/workout-plans');
  }).catch((err) => {
    console.error('MSW worker failed to start:', err);
  });
} 

export { worker }; 