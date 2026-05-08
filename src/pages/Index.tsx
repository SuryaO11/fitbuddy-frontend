import { DashboardHeader } from "@/components/DashboardHeader";
import { WorkoutTracker } from "@/components/WorkoutTracker";
import { QuickActions } from "@/components/QuickActions";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { TrendingUp, BarChart3 } from "lucide-react";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Use the actual user's name or fallback to "Athlete" if not available
  const displayName = user?.name || "Athlete";
  
  const handleViewProgress = () => {
    navigate('/activity-log');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" id="home-content">
        {/* Dashboard Header */}
        <DashboardHeader userName={displayName} />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Workout Tracker */}
          <div className="lg:col-span-2">
            <WorkoutTracker />
          </div>
          
          {/* Right Column - Quick Actions */}
          <div className="space-y-6">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
