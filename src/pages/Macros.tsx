import React, { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Card from '@/components/ui/card';
import Button from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, Target, TrendingUp, Activity, Zap, Save, Share2, Utensils, AlertTriangle, Info, Database, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '../lib/api';
import { useQuery } from '@tanstack/react-query';
import { saveAs } from 'file-saver';
import { pdfService, type NutritionPlanData } from '@/lib/pdfService';

// Updated interfaces to include training experience
interface UserMetrics {
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: number;
  goal: 'cut' | 'bulk' | 'maintain';
  trainingExperience: 'beginner' | 'intermediate' | 'advanced';
}

interface MacroResults {
  bmr: number;
  tdee: number;
  macros: {
    calories: number;
    protein: {
      min: number;
      max: number;
      range: string;
      color: string;
    };
    carbs: number;
    fat: number;
  };
  warnings: string[];
}

// Training experience options
const trainingExperienceOptions = [
  { value: 'beginner', label: 'Beginner (< 2 years)', description: 'New to resistance training or < 2 years experience' },
  { value: 'intermediate', label: 'Intermediate (2-5 years)', description: '2-5 years of consistent resistance training' },
  { value: 'advanced', label: 'Advanced (5+ years)', description: '5+ years of serious resistance training' }
];

// Activity level options
const activityOptions = [
  { value: 1.2, label: 'Sedentary', description: 'Little to no exercise' },
  { value: 1.375, label: 'Lightly Active', description: 'Light exercise 1-3 days/week' },
  { value: 1.55, label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week' },
  { value: 1.725, label: 'Very Active', description: 'Hard exercise 6-7 days/week' },
  { value: 1.9, label: 'Extremely Active', description: 'Very hard exercise, physical job' }
];

// Goal options
const goalOptions = [
  { value: 'cut', label: 'Cutting / Fat Loss', description: 'Reduce body fat while preserving muscle' },
  { value: 'bulk', label: 'Lean Bulk', description: 'Build muscle with minimal fat gain' },
  { value: 'maintain', label: 'Maintenance', description: 'Maintain current body composition' }
];

// Evidence-based protein ranges (g/kg/day) based on training experience and goal
const trainingTiers = {
  beginner: {
    maintain: [1.4, 1.6],
    bulk: [1.6, 1.8],
    cut: [1.8, 2.0]
  },
  intermediate: {
    maintain: [1.6, 1.8],
    bulk: [1.8, 2.0],
    cut: [2.0, 2.3]
  },
  advanced: {
    maintain: [1.7, 1.9],
    bulk: [1.8, 2.2],
    cut: [2.2, 2.4]
  }
};

const useMacroCalculator = () => {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  
  const calculateBMR = useCallback((data: UserMetrics) => {
    const { weight, height, age, gender } = data;
    const genderOffset = gender === 'male' ? 5 : -161;
    return Math.round((10 * weight) + (6.25 * height) - (5 * age) + genderOffset);
  }, []);

  const calculateTDEE = useCallback((bmr: number, activityLevel: number) => {
    return Math.round(bmr * activityLevel);
  }, []);

  const calculateProteinRange = useCallback((weight: number, trainingExperience: string, goal: string) => {
    const [low, high] = trainingTiers[trainingExperience as keyof typeof trainingTiers][goal as keyof typeof trainingTiers.beginner];
    const minGrams = Math.round(low * weight);
    const maxGrams = Math.round(high * weight);
    
    // Color coding based on protein levels
    let color = 'bg-green-100 text-green-800';
    const proteinPerKg = maxGrams / weight;
    
    if (proteinPerKg > 2.7) {
      color = 'bg-red-100 text-red-800';
    } else if (proteinPerKg > 2.0) {
      color = 'bg-yellow-100 text-yellow-800';
    }
    
    return {
      min: minGrams,
      max: maxGrams,
      range: `${minGrams}-${maxGrams}g`,
      color
    };
  }, []);

  const calculateMacros = useCallback((tdee: number, goal: string, weight: number, trainingExperience: string) => {
    const protein = calculateProteinRange(weight, trainingExperience, goal);
    
    // Calculate remaining calories for carbs and fat
    const proteinCalories = protein.max * 4; // Use max protein for conservative calculation
    const remainingCalories = tdee - proteinCalories;
    
    // Adjust carb and fat ratios based on goal
    const ratios = {
      cut: { carbs: 0.35, fat: 0.35 },
      bulk: { carbs: 0.5, fat: 0.25 },
      maintain: { carbs: 0.45, fat: 0.3 }
    };
    
    const ratio = ratios[goal as keyof typeof ratios];
    const carbs = Math.round((remainingCalories * ratio.carbs) / 4);
    const fat = Math.round((remainingCalories * ratio.fat) / 9);
    
    return {
      calories: tdee,
      protein,
      carbs,
      fat
    };
  }, [calculateProteinRange]);

  const generateWarnings = useCallback((metrics: UserMetrics, tdee: number) => {
    const warnings: string[] = [];
    
    // Check for aggressive calorie deficit
    const bmr = calculateBMR(metrics);
    const deficit = bmr - tdee;
    const deficitPercentage = (deficit / bmr) * 100;
    
    if (deficitPercentage > 25) {
      warnings.push(`⚠️ Aggressive deficit detected (${Math.round(deficitPercentage)}%). Consider a more moderate approach for better muscle preservation.`);
    }
    
    // Check protein levels
    const proteinRange = calculateProteinRange(metrics.weight, metrics.trainingExperience, metrics.goal);
    const proteinPerKg = proteinRange.max / metrics.weight;
    
    if (proteinPerKg > 2.7) {
      warnings.push(`⚠️ High protein intake (${proteinPerKg.toFixed(1)}g/kg). Consider reducing to stay within safe limits.`);
    }
    
    if (proteinPerKg < 1.4) {
      warnings.push(`⚠️ Low protein intake (${proteinPerKg.toFixed(1)}g/kg). Consider increasing for better muscle preservation.`);
    }
    
    return warnings;
  }, [calculateBMR, calculateProteinRange]);

  const results = useMemo(() => {
    if (!metrics) return null;
    
    const bmr = calculateBMR(metrics);
    const tdee = calculateTDEE(bmr, metrics.activityLevel);
    const macros = calculateMacros(tdee, metrics.goal, metrics.weight, metrics.trainingExperience);
    const warnings = generateWarnings(metrics, tdee);
    
    return { bmr, tdee, macros, warnings };
  }, [metrics, calculateBMR, calculateTDEE, calculateMacros, generateWarnings]);

  return { setMetrics, results, isCalculated: !!results };
};

const UserInputForm: React.FC<{ onSubmit: (data: UserMetrics) => void }> = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm<UserMetrics>();
  const { toast } = useToast();

  const onFormSubmit = (data: UserMetrics) => {
    // Validate inputs
    if (data.weight < 30 || data.weight > 300) {
      toast({
        title: 'Invalid Weight',
        description: 'Weight must be between 30kg and 300kg for accurate calculations.',
        variant: 'destructive',
      });
      return;
    }
    
    if (data.height < 100 || data.height > 250) {
      toast({
        title: 'Invalid Height',
        description: 'Height must be between 100cm and 250cm for accurate calculations.',
        variant: 'destructive',
      });
      return;
    }
    
    if (data.age < 13 || data.age > 100) {
      toast({
        title: 'Invalid Age',
        description: 'Age must be between 13 and 100 years for accurate calculations.',
        variant: 'destructive',
      });
      return;
    }
    
    onSubmit(data);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Macro Calculator</h2>
      </div>
      
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              {...register('weight', { required: true, min: 30, max: 300 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="70"
            />
            {errors.weight && <p className="text-red-500 text-sm mt-1">Valid weight required (30-300kg)</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Height (cm)</label>
            <input
              type="number"
              {...register('height', { required: true, min: 100, max: 250 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="175"
            />
            {errors.height && <p className="text-red-500 text-sm mt-1">Valid height required (100-250cm)</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Age</label>
            <input
              type="number"
              {...register('age', { required: true, min: 13, max: 100 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="25"
            />
            {errors.age && <p className="text-red-500 text-sm mt-1">Valid age required (13-100)</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Gender</label>
            <select
              {...register('gender', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            {errors.gender && <p className="text-red-500 text-sm mt-1">Gender selection required</p>}
          </div>
        </div>

        {/* Training Experience */}
        <div>
          <label className="block text-sm font-medium mb-3">Training Experience</label>
          <div className="space-y-3">
            {trainingExperienceOptions.map((option) => (
              <label key={option.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value={option.value}
                  {...register('trainingExperience', { required: true })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.trainingExperience && <p className="text-red-500 text-sm mt-1">Training experience selection required</p>}
        </div>

        {/* Activity Level */}
        <div>
          <label className="block text-sm font-medium mb-3">Activity Level</label>
          <div className="space-y-3">
            {activityOptions.map((option) => (
              <label key={option.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value={option.value}
                  {...register('activityLevel', { required: true })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.activityLevel && <p className="text-red-500 text-sm mt-1">Activity level selection required</p>}
        </div>

        {/* Goal */}
        <div>
          <label className="block text-sm font-medium mb-3">Fitness Goal</label>
          <div className="space-y-3">
            {goalOptions.map((option) => (
              <label key={option.value} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value={option.value}
                  {...register('goal', { required: true })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
          {errors.goal && <p className="text-red-500 text-sm mt-1">Goal selection required</p>}
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold">
          Calculate Macros
        </Button>
      </form>
    </Card>
  );
};

const ResultsDisplay: React.FC<{ results: MacroResults }> = ({ results }) => {
  const { bmr, tdee, macros, warnings } = results;
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      const macroPlan = {
        period: 'weekly',
        summary: {
          bmr,
          tdee,
          calories: macros.calories,
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
          goal: 'nutrition_plan',
          type: 'macro_calculation'
        },
        exercises: [], // No exercises for nutrition plans
        nutritionPlan: {
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
          calories: macros.calories
        }
      };

      // Save to backend
      const response = await fetch('https://fitbuddy-backend-l3r0.onrender.com/api/workouts/macro-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getToken()}`
        },
        body: JSON.stringify(macroPlan)
      });

      if (!response.ok) {
        throw new Error('Failed to save macro plan');
      }

      toast({
        title: 'Macro Plan Saved!',
        description: 'Your nutrition plan has been saved to your profile for future reference.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save macro plan to profile.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveToDevice = () => {
    try {
      const date = new Date().toLocaleDateString();
      const time = new Date().toLocaleTimeString();
      
      let content = `NUTRITION MACRO PLAN
Generated on: ${date} at ${time}
=====================================\n\n`;

      // Energy Requirements
      content += `ENERGY REQUIREMENTS
====================
Basal Metabolic Rate (BMR): ${bmr.toLocaleString()} calories
   - Calories burned at rest\n\n`;
      
      content += `Total Daily Energy Expenditure (TDEE): ${tdee.toLocaleString()} calories
   - Daily calorie target for your goal\n\n`;

      // Macro Breakdown
      content += `MACRO BREAKDOWN
===============
Daily Calorie Target: ${macros.calories.toLocaleString()} calories\n\n`;

      content += `PROTEIN: ${macros.protein.range}
   - Evidence-based range for your training level and goal
   - Aim for ${macros.protein.max}g per day for optimal results
   - Distribute across 4-5 meals every 3-4 hours
   - 20-40g protein per meal to maximize muscle protein synthesis\n\n`;

      content += `CARBOHYDRATES: ${macros.carbs}g
   - ${Math.round((macros.carbs * 4 / macros.calories) * 100)}% of total calories
   - Primary fuel source for workouts and daily activities
   - Focus on complex carbs: rice, potatoes, oats, fruits\n\n`;

      content += `FAT: ${macros.fat}g
   - ${Math.round((macros.fat * 9 / macros.calories) * 100)}% of total calories
   - Essential for hormone production and nutrient absorption
   - Include healthy fats: nuts, avocados, olive oil, fish\n\n`;

      // Meal Planning Tips
      content += `MEAL PLANNING TIPS
==================
• Eat every 3-4 hours to maintain stable energy levels
• Include protein with every meal (20-40g)
• Pre-workout: Carbs + moderate protein 2-3 hours before
• Post-workout: Protein + carbs within 30 minutes
• Stay hydrated: Aim for 8-10 glasses of water daily
• Track your progress and adjust as needed\n\n`;

      // Warnings
      if (warnings.length > 0) {
        content += `IMPORTANT CONSIDERATIONS
==========================
`;
        warnings.forEach((warning: string) => {
          content += `• ${warning.replace('⚠️ ', '')}\n`;
        });
        content += '\n';
      }

      content += `=====================================
Plan generated by FitForge Buddy
For personal nutrition planning use only
=====================================`;

      const blob = new Blob([content], { 
        type: 'text/plain;charset=utf-8' 
      });
      saveAs(blob, `nutrition-plan-${new Date().toISOString().split('T')[0]}.txt`);

      toast({
        title: 'Nutrition Plan Saved!',
        description: 'Human-readable nutrition plan has been saved to your device.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save nutrition plan to device.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveToPDF = async () => {
    try {
      const nutritionData: NutritionPlanData = {
        bmr,
        tdee,
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        warnings
      };

      const pdfBlob = await pdfService.generateNutritionPlanPDF(nutritionData);
      saveAs(pdfBlob, `nutrition-plan-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: 'PDF Plan Generated!',
        description: 'Beautiful nutrition plan PDF has been saved to your device.',
      });
    } catch (error) {
      toast({
        title: 'PDF Generation Failed',
        description: 'Failed to generate PDF nutrition plan.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveWorkoutProgress = async () => {
    try {
      // Fetch workout data to calculate progress summary
      const workoutResponse = await fetch('https://fitbuddy-backend-l3r0.onrender.com/api/workouts', {
        headers: { 'Authorization': `Bearer ${apiService.getToken()}` },
        cache: 'no-store'
      });

      if (!workoutResponse.ok) {
        throw new Error('Failed to fetch workout data');
      }

      const workoutData = await workoutResponse.json();
      const workouts = workoutData.workouts || [];

      if (workouts.length === 0) {
        toast({
          title: 'No Workout Data',
          description: 'No workout data found to save progress summary.',
          variant: 'destructive',
        });
        return;
      }

      // Calculate workout progress summary
      const totalSets = workouts.reduce((sum: number, workout: any) => {
        return sum + (workout.session || []).reduce((s: number, exercise: any) => {
          return s + (exercise.sets || []).length;
        }, 0);
      }, 0);

      const totalReps = workouts.reduce((sum: number, workout: any) => {
        return sum + (workout.session || []).reduce((s: number, exercise: any) => {
          return s + (exercise.sets || []).reduce((r: number, set: any) => r + (set.reps || 0), 0);
        }, 0);
      }, 0);

      const maxWeight = Math.max(...workouts.flatMap((workout: any) => 
        (workout.session || []).flatMap((exercise: any) => 
          (exercise.sets || []).map((set: any) => set.weight || 0)
        )
      ), 0);

      const avgWeight = workouts.length > 0 ? 
        workouts.reduce((sum: number, workout: any) => {
          return sum + (workout.session || []).reduce((s: number, exercise: any) => {
            return s + (exercise.sets || []).reduce((w: number, set: any) => w + (set.weight || 0), 0);
          }, 0);
        }, 0) / totalSets : 0;

      // Find most frequent exercise
      const exerciseCounts: { [key: string]: number } = {};
      workouts.forEach((workout: any) => {
        (workout.session || []).forEach((exercise: any) => {
          exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] || 0) + 1;
        });
      });
      const mostFrequentExercise = Object.entries(exerciseCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

      const workoutProgressSummary = {
        period: 'weekly',
        summary: {
          totalWorkouts: workouts.length,
          totalSets,
          totalReps,
          maxWeight,
          avgWeight: Math.round(avgWeight * 100) / 100,
          mostFrequentExercise,
          improvementRate: 0, // Would need to calculate from exercise progress
          consistency: 0, // Would need to calculate from exercise progress
          goal: 'workout_progress',
          type: 'workout_summary'
        },
        exercises: Object.entries(exerciseCounts).slice(0, 10).map(([name, count]) => ({
          name,
          totalSets: count,
          maxWeight: 0, // Would need to calculate
          maxReps: 0, // Would need to calculate
          improvement: 0 // Would need to calculate
        }))
      };

      // Save to backend
      const response = await fetch('https://fitbuddy-backend-l3r0.onrender.com/api/workouts/macro-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiService.getToken()}`
        },
        body: JSON.stringify(workoutProgressSummary)
      });

      if (!response.ok) {
        throw new Error('Failed to save workout progress summary');
      }

      toast({
        title: 'Workout Progress Saved!',
        description: 'Your workout progress summary has been saved to your profile.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save workout progress summary.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = () => {
    const text = `My Macro Plan:
BMR: ${bmr} calories
TDEE: ${tdee} calories
Protein: ${macros.protein.range}
Carbs: ${macros.carbs}g
Fat: ${macros.fat}g`;
    
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to Clipboard!',
        description: 'Your macro plan has been copied.',
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-6 w-6 text-green-600" />
        <h2 className="text-2xl font-bold">Your Macro Plan</h2>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800 mb-2">Important Considerations</h3>
              <ul className="space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-700">{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Energy Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">BMR (Basal Metabolic Rate)</h3>
          </div>
          <p className="text-2xl font-bold text-blue-900">{bmr.toLocaleString()} calories</p>
          <p className="text-sm text-blue-700">Calories burned at rest</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-800">TDEE (Total Daily Energy Expenditure)</h3>
          </div>
          <p className="text-2xl font-bold text-green-900">{tdee.toLocaleString()} calories</p>
          <p className="text-sm text-green-700">Daily calorie target</p>
        </div>
      </div>

      {/* Macro Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Macro Breakdown</h3>
        
        {/* Protein - Range Display */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="font-medium">Protein</span>
            </div>
            <Badge className={macros.protein.color}>
              {macros.protein.range}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="h-4 w-4" />
            <span>Evidence-based range for your training level and goal</span>
          </div>
        </div>

        {/* Carbs */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span className="font-medium">Carbohydrates</span>
            </div>
            <span className="font-bold text-lg">{macros.carbs}g</span>
          </div>
          <Progress value={(macros.carbs * 4 / macros.calories) * 100} className="h-2" />
          <p className="text-sm text-gray-600 mt-1">
            {Math.round((macros.carbs * 4 / macros.calories) * 100)}% of total calories
          </p>
        </div>

        {/* Fat */}
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span className="font-medium">Fat</span>
            </div>
            <span className="font-bold text-lg">{macros.fat}g</span>
          </div>
          <Progress value={(macros.fat * 9 / macros.calories) * 100} className="h-2" />
          <p className="text-sm text-gray-600 mt-1">
            {Math.round((macros.fat * 9 / macros.calories) * 100)}% of total calories
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
          <Save className="h-4 w-4 mr-2" />
          Save to Profile
        </Button>
        <Button onClick={handleSaveToDevice} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
          <Download className="h-4 w-4 mr-2" />
          Save to Device
        </Button>
        <Button onClick={handleSaveToPDF} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
          <FileText className="h-4 w-4 mr-2" />
          Save PDF
        </Button>
        <Button onClick={handleShare} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>

      {/* Save Workout Progress Button */}
      <div className="mt-4">
        <Button 
          onClick={handleSaveWorkoutProgress} 
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Database className="h-4 w-4 mr-2" />
          Save Workout Progress Summary
        </Button>
      </div>

      {/* Evidence-based Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Evidence-Based Recommendations</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Protein ranges are based on training experience and goal</li>
          <li>• Beginners typically need 1.4-1.8g/kg, advanced lifters 1.7-2.4g/kg</li>
          <li>• Higher protein during cuts (2.0-2.4g/kg) helps preserve muscle</li>
          <li>• Distribute protein across 4-5 meals every 3-4 hours</li>
          <li>• Aim for 20-40g protein per meal to maximize muscle protein synthesis</li>
        </ul>
      </div>
    </Card>
  );
};

const Macros = () => {
  const { setMetrics, results, isCalculated } = useMacroCalculator();
  const { toast } = useToast();

  // Fetch macro summaries
  const { data: macroSummariesData } = useQuery({
    queryKey: ['macro-summaries'],
    queryFn: async () => {
      const res = await fetch('https://fitbuddy-backend-l3r0.onrender.com/api/workouts/macro-summaries', {
        headers: { 'Authorization': `Bearer ${apiService.getToken()}` },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('Failed to load macro summaries');
      return res.json();
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 0,
    gcTime: 0,
  });

  const macroSummaries = macroSummariesData?.macroSummaries || [];

  const handleCalculate = (data: UserMetrics) => {
    setMetrics(data);
    toast({
      title: 'Macros Calculated!',
      description: 'Your personalized macro plan is ready.',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Macro Calculator</h1>
          <p className="text-gray-600">Get evidence-based macro recommendations based on your training experience and goals</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <UserInputForm onSubmit={handleCalculate} />
          {isCalculated && results && <ResultsDisplay results={results} />}
        </div>

        {/* Macro Summaries History */}
        {macroSummaries.length > 0 && (
          <div className="mt-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Saved Macro Summaries</h2>
              <p className="text-gray-600">Your previously saved nutrition and workout progress summaries</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {macroSummaries.slice(0, 6).map((summary: any, index: number) => (
                <Card key={index} className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">
                      {summary.summary.type === 'macro_calculation' ? 'Nutrition Plan' : 'Workout Progress'}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(summary.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {summary.summary.type === 'macro_calculation' ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Calories:</span>
                        <div className="font-bold text-lg text-blue-600">{summary.summary.calories}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Protein:</span>
                        <div className="font-bold text-lg text-red-600">{summary.summary.protein.range}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-sm text-gray-600">Carbs:</span>
                          <div className="font-bold text-blue-600">{summary.summary.carbs}g</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Fat:</span>
                          <div className="font-bold text-yellow-600">{summary.summary.fat}g</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Workouts:</span>
                        <div className="font-bold text-lg text-green-600">{summary.summary.totalWorkouts}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total Sets:</span>
                        <div className="font-bold text-lg text-purple-600">{summary.summary.totalSets}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Max Weight:</span>
                        <div className="font-bold text-orange-600">{summary.summary.maxWeight} lbs</div>
                      </div>
                      {summary.exercises.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">Top Exercise:</span>
                          <div className="font-bold text-gray-900">{summary.exercises[0]?.name}</div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Macros; 