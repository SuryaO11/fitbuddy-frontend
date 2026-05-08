import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/button";
import { Camera } from "lucide-react";

interface FormCheck {
  id: string;
  exerciseId: string;
  exerciseName: string;
  timestamp: string;
  // Add other form check properties as needed
}

interface CameraButtonProps {
  exerciseId: string;
  exerciseName: string;
  onFormCheckSaved?: (formCheck: FormCheck) => void;
  className?: string;
}

export const CameraButton = ({ 
  exerciseId, 
  exerciseName, 
  onFormCheckSaved,
  className = "" 
}: CameraButtonProps) => {
  const navigate = useNavigate();

  const handleFormCheck = () => {
    // Navigate to form check page with parameters to auto-open camera
    navigate(`/form-check?openCamera=true&exercise=${encodeURIComponent(exerciseName)}`);
  };

  return (
    <Button 
      onClick={handleFormCheck}
      className={`bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded ${className}`}
    >
      <Camera className="h-4 w-4 mr-1" />
      Form Check
    </Button>
  );
}; 