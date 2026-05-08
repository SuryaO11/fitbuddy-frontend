import React, { useState } from 'react';

const steps = [
  {
    title: 'Welcome to FitBuddy!',
    content: 'Track your workouts, analyze your progress, and join the community.'
  },
  {
    title: 'Log Your First Workout',
    content: 'Use the workout tracker to quickly log sets, reps, and weight.'
  },
  {
    title: 'View Analytics',
    content: 'See your streaks, trends, and personal bests in the analytics dashboard.'
  },
  {
    title: 'Join a Challenge',
    content: 'Stay motivated by joining community challenges and climbing the leaderboard.'
  },
  {
    title: 'Privacy & Data',
    content: 'Control your privacy, export your data, or request account deletion anytime.'
  },
];

const Onboarding: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-4 max-w-md w-full relative">
        <h3 className="text-lg font-bold mb-2">{steps[step].title}</h3>
        <div className="mb-4 text-xs sm:text-base">{steps[step].content}</div>
        <div className="flex justify-end gap-2">
          {step < steps.length - 1 ? (
            <button className="px-3 py-1 rounded bg-primary text-white text-xs font-semibold hover:bg-primary/80" onClick={() => setStep(s => s + 1)}>Next</button>
          ) : (
            <button className="px-3 py-1 rounded bg-success text-white text-xs font-semibold hover:bg-success/80" onClick={onFinish}>Finish</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 