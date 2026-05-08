import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">FitForge Buddy</h2>
        <p className="text-gray-600">Loading your fitness companion...</p>
        <div className="mt-4 text-sm text-gray-500">
          <p>If this takes too long, try refreshing the page</p>
          <p className="mt-1">Press Ctrl+Shift+D for diagnostic info</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen; 