import { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/auth";
import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { Video, X, Trash2, Calendar, Filter, Search, Plus, Camera, Pause, Check, RotateCcw, Image as ImageIcon, Database, Upload, Smartphone, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { apiService } from '../lib/api';
import { useQuery } from '@tanstack/react-query';

interface FormCheck {
  id: string;
  exerciseId: string;
  exerciseName: string;
  exercise?: string; // Add this for backward compatibility
  imageUrl?: string | null;
  videoUrl?: string | null;
  mediaType?: 'image' | 'video'; // Add mediaType field
  timestamp: string;
  notes?: string;
}

const FormCheck = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [formChecks, setFormChecks] = useState<FormCheck[]>([]);
  const [filteredChecks, setFilteredChecks] = useState<FormCheck[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "exercise">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();

  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [exerciseName, setExerciseName] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [captureMode, setCaptureMode] = useState<'image' | 'video'>('video');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Video player modal states
  const [selectedVideo, setSelectedVideo] = useState<FormCheck | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  // Confirmation modal states
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Camera functions
  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return result.state;
    } catch (error) {
      console.log('Permission API not supported, will try direct access');
      return 'unknown';
    }
  };

  const openCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Check if we're on HTTPS (required for camera access in most browsers)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        toast({
          title: 'HTTPS Required',
          description: 'Camera access requires HTTPS. Please use localhost or enable HTTPS.',
          variant: 'destructive',
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: 'environment' // Prefer back camera on mobile
        },
        audio: true
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'Unable to access camera. Please check permissions.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on your device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera access is not supported in this browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      }
      
      toast({
        title: 'Camera Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCurrentVideo(null);
    setIsRecording(false);
    setCapturedImage(null);
    setShowAddModal(false);
  };

  // Check if we should auto-open camera (from form check button)
  useEffect(() => {
    const shouldOpenCamera = searchParams.get('openCamera');
    const exercise = searchParams.get('exercise');
    
    if (shouldOpenCamera === 'true' && exercise) {
      setExerciseName(exercise);
      openCamera();
    }
  }, [searchParams]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Download functions
  const downloadFile = async (url: string, filename: string, mediaType: 'image' | 'video') => {
    try {
      // Show loading toast
      toast({ 
        title: 'Downloading...', 
        description: `Preparing ${mediaType} for download...`, 
        variant: 'default' 
      });

      // Fetch the file as a blob
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      // Create a blob URL
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      
      // Append to body, click, and cleanup
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      // Success toast
      toast({ 
        title: 'Download Complete', 
        description: `${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} downloaded successfully!`, 
        variant: 'default' 
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({ 
        title: 'Download Failed', 
        description: `Failed to download ${mediaType}. Please try again.`, 
        variant: 'destructive' 
      });
    }
  };

  const downloadImage = (imageUrl: string, exerciseName: string, timestamp: string) => {
    // Determine file extension based on the URL
    let extension = '.png'; // default
    if (imageUrl.includes('data:image/jpeg') || imageUrl.includes('image/jpeg')) {
      extension = '.jpg';
    } else if (imageUrl.includes('data:image/png') || imageUrl.includes('image/png')) {
      extension = '.png';
    } else if (imageUrl.includes('data:image/webp') || imageUrl.includes('image/webp')) {
      extension = '.webp';
    }
    
    const filename = `${exerciseName}_${new Date(timestamp).toISOString().split('T')[0]}${extension}`;
    downloadFile(imageUrl, filename, 'image');
  };

  const downloadVideo = (videoUrl: string, exerciseName: string, timestamp: string) => {
    // Determine file extension based on the URL
    let extension = '.webm'; // default
    if (videoUrl.includes('data:video/mp4') || videoUrl.includes('video/mp4')) {
      extension = '.mp4';
    } else if (videoUrl.includes('data:video/webm') || videoUrl.includes('video/webm')) {
      extension = '.webm';
    } else if (videoUrl.includes('data:video/ogg') || videoUrl.includes('video/ogg')) {
      extension = '.ogg';
    }
    
    const filename = `${exerciseName}_${new Date(timestamp).toISOString().split('T')[0]}${extension}`;
    downloadFile(videoUrl, filename, 'video');
  };

  // Initialize form checks function
  const initializeFormChecks = async () => {
    try {
      const response = await apiService.getFormChecks();
      // Ensure response is an array and has proper structure
      const checks = Array.isArray(response) ? response : [];
      const validatedChecks = checks.map(check => {
        // Debug logging for each check
        console.log('Processing form check:', {
          id: check.id || check._id,
          exercise: check.exercise,
          mediaType: check.mediaType,
          mediaUrl: check.mediaUrl
        });

        // Determine which URL field to use based on mediaType
        const isImage = check.mediaType === 'image';
        const isVideo = check.mediaType === 'video';
        
        return {
          id: check.id || check._id || Math.random().toString(),
          exerciseId: check.exerciseId || '',
          exerciseName: check.exerciseName || check.exercise || 'Unknown Exercise',
          exercise: check.exercise || check.exerciseName || 'Unknown Exercise',
          imageUrl: isImage ? (check.imageUrl || check.mediaUrl) : null,
          videoUrl: isVideo ? (check.videoUrl || check.mediaUrl) : null,
          mediaType: check.mediaType, // Add mediaType to the frontend object
          timestamp: check.timestamp || check.date || new Date().toISOString(),
          notes: check.notes || ''
        };
      });
      
      // Debug logging for processed checks
      console.log('Processed form checks:', validatedChecks.map(check => ({
        id: check.id,
        exercise: check.exercise,
        mediaType: check.mediaType,
        hasImageUrl: !!check.imageUrl,
        hasVideoUrl: !!check.videoUrl
      })));
      
      setFormChecks(validatedChecks);
      setFilteredChecks(validatedChecks);
    } catch (error) {
      console.error('Error loading form checks:', error);
      toast({
        title: 'Error Loading Form Checks',
        description: 'Failed to load form checks from the server. Please try refreshing the page.',
        variant: 'destructive',
      });
      // Set empty arrays if loading fails
      setFormChecks([]);
      setFilteredChecks([]);
    }
  };

  // Load form checks on component mount
  useEffect(() => {
    initializeFormChecks();
  }, []);

  // Filter and sort form checks
  useEffect(() => {
    const filtered = formChecks.filter(check => {
      const exerciseName = check.exerciseName || check.exercise || 'Unknown Exercise';
      const matchesSearch = exerciseName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesExercise = selectedExercise === "all" || exerciseName === selectedExercise;
      return matchesSearch && matchesExercise;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        const nameA = (a.exerciseName || a.exercise || 'Unknown Exercise').toLowerCase();
        const nameB = (b.exerciseName || b.exercise || 'Unknown Exercise').toLowerCase();
        return sortOrder === "asc" 
          ? nameA.localeCompare(nameB) 
          : nameB.localeCompare(nameA);
      }
    });

    setFilteredChecks(filtered);
  }, [formChecks, searchTerm, selectedExercise, sortBy, sortOrder]);

  const deleteFormCheck = async (formCheckId: string) => {
    try {
      // Try to delete from backend first
      await apiService.deleteFormCheck(formCheckId);
      
      // Update local state
      setFormChecks(prev => {
        const updated = prev.filter(check => check.id !== formCheckId);
        const deletedCheck = prev.find(check => check.id === formCheckId);
        if (deletedCheck) {
          // Clean up object URLs if they exist
          if (deletedCheck.videoUrl && deletedCheck.videoUrl.startsWith('blob:')) {
            URL.revokeObjectURL(deletedCheck.videoUrl);
          }
          if (deletedCheck.imageUrl && deletedCheck.imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(deletedCheck.imageUrl);
          }
        }
        return updated;
      });
      
      toast({
        title: 'Form Check Deleted',
        description: 'The form check has been deleted successfully.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting form check:', error);
      toast({
        title: 'Error Deleting Form Check',
        description: 'Failed to delete the form check. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const deleteAllFormChecks = () => {
    setShowClearAllConfirm(true);
  };

  const confirmDeleteAll = async () => {
    try {
      // Try to delete from backend first
      await apiService.deleteAllFormChecks();
      
      // Clean up all object URLs
      formChecks.forEach(check => {
        if (check.videoUrl && check.videoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(check.videoUrl);
        }
        if (check.imageUrl && check.imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(check.imageUrl);
        }
      });
      
      setFormChecks([]);
      setFilteredChecks([]);
      setShowClearAllConfirm(false);
      
      toast({
        title: 'All Form Checks Deleted',
        description: 'All form checks have been deleted successfully.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error deleting all form checks:', error);
      toast({
        title: 'Error Deleting All Form Checks',
        description: 'Failed to delete all form checks. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const cancelDeleteAll = () => {
    setShowClearAllConfirm(false);
  };

  // Clear all form checks function
  const clearAllFormChecks = async () => {
    try {
      // Revoke all blob URLs first
      formChecks.forEach(check => {
        if (check.videoUrl && check.videoUrl.startsWith('blob:')) {
          URL.revokeObjectURL(check.videoUrl);
        }
        if (check.imageUrl && check.imageUrl.startsWith('blob:')) {
          URL.revokeObjectURL(check.imageUrl);
        }
      });
      
      // Clear from backend
      await apiService.deleteAllFormChecks();
      setFormChecks([]);
      setFilteredChecks([]);
      
      toast({
        title: 'All Form Checks Cleared',
        description: 'All form checks have been deleted successfully.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to clear form checks:', error);
      toast({
        title: 'Error Clearing Form Checks',
        description: 'Failed to clear form checks. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getUniqueExercises = () => {
    const exercises = formChecks.map(check => check.exerciseName || check.exercise || 'Unknown Exercise');
    return ["all", ...Array.from(new Set(exercises))];
  };

  const getFormCheckStats = () => {
    const total = formChecks.length;
    const thisWeek = formChecks.filter(check => {
      const checkDate = new Date(check.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return checkDate >= weekAgo;
    }).length;
    const uniqueExercises = new Set(formChecks.map(check => check.exerciseName || check.exercise || 'Unknown Exercise')).size;
    
    return { total, thisWeek, uniqueExercises };
  };

  const stats = getFormCheckStats();

  const startRecording = () => {
    if (!streamRef.current) {
      console.error('No stream available for recording');
      return;
    }

    console.log('Starting recording');
    recordedChunksRef.current = [];
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9'
      });

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, creating blob');
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setCurrentVideo(videoUrl);
        console.log('Video URL created:', videoUrl);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Error',
        description: 'Failed to start recording. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Convert blob to data URL for better persistence
  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Modified saveFormCheck to handle both image and video
  const saveFormCheck = async () => {
    if (captureMode === 'image') {
      if (!capturedImage) {
        toast({ title: 'No image captured', description: 'Please capture an image first.', variant: 'destructive' });
        return;
      }
      const label = newLabel || exerciseName || 'Unknown Exercise';
      try {
        // Convert data URL to blob
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        
        const formData = new FormData();
        formData.append('exercise', label);
        formData.append('mediaType', 'image');
        formData.append('media', blob, 'form-check-image.png');
        formData.append('notes', newLabel || '');
        await apiService.saveFormCheck(formData);
        setNewLabel("");
        setShowAddModal(false);
        setCapturedImage(null);
        toast({
          title: 'Form Check Saved!',
          description: 'Your form check image has been saved to the library.',
          variant: 'default',
        });
        closeCamera();
        // Refresh form checks after saving
        initializeFormChecks();
      } catch (error) {
        console.error('Error saving image:', error);
        toast({
          title: 'Error Saving Image',
          description: 'Failed to save the image. Please try again.',
          variant: 'destructive',
        });
      }
      return;
    }
    
    // Video mode - convert blob to data URL for better persistence
    if (!currentVideo) {
      toast({ title: 'No video recorded', description: 'Please record a video first.', variant: 'destructive' });
      return;
    }

    try {
      // Convert blob URL to blob
      const response = await fetch(currentVideo);
      const blob = await response.blob();
      
      const label = newLabel || exerciseName || 'Unknown Exercise';
      try {
        const formData = new FormData();
        formData.append('exercise', label);
        formData.append('mediaType', 'video');
        formData.append('media', blob, 'form-check-video.webm');
        formData.append('notes', newLabel || '');
        await apiService.saveFormCheck(formData);
        setNewLabel("");
        setShowAddModal(false);
        toast({
          title: 'Form Check Saved!',
          description: 'Your form check video has been saved to the library.',
          variant: 'default',
        });
        closeCamera();
        // Refresh form checks after saving
        initializeFormChecks();
      } catch (error) {
        console.error('Error saving video:', error);
        toast({
          title: 'Error Saving Video',
          description: 'Failed to save the video. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving video:', error);
      toast({
        title: 'Error Saving Video',
        description: 'Failed to save the video. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Add captureImage function for image mode
  const captureImage = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      setCapturedImage(canvas.toDataURL('image/png'));
    }
  };

  // Convert data URL to blob URL for better video playback
  const convertDataUrlToBlobUrl = async (dataUrl: string): Promise<string> => {
    if (dataUrl.startsWith('data:')) {
      try {
        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (error) {
        console.warn('Failed to convert data URL to blob URL:', error);
        return dataUrl; // Fallback to original URL
      }
    }
    return dataUrl; // Already a regular URL
  };

  // File upload functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Debug logging
    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Enhanced file type validation
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    
    const isImage = validImageTypes.includes(file.type);
    const isVideo = validVideoTypes.includes(file.type);
    
    if (!isImage && !isVideo) {
      // Fallback: check file extension
      const fileName = file.name.toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
      
      const hasImageExt = imageExtensions.some(ext => fileName.endsWith(ext));
      const hasVideoExt = videoExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasImageExt && !hasVideoExt) {
        toast({
          title: 'Invalid File Type',
          description: `File type "${file.type}" is not supported. Please select an image (JPEG, PNG, WebP) or video (MP4, WebM, OGG) file.`,
          variant: 'destructive',
        });
        return;
      }
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'Please select a file smaller than 50MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploadedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Show success message with detected type
    const detectedType = isImage ? 'image' : isVideo ? 'video' : 'file';
    toast({
      title: 'File Selected',
      description: `${detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} file "${file.name}" selected successfully.`,
      variant: 'default',
    });
  };

  const saveUploadedFile = async () => {
    if (!uploadedFile || !uploadPreview) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    const label = newLabel || 'Uploaded Form Check';
    
    // Enhanced media type detection
    let mediaType: 'image' | 'video';
    const fileType = uploadedFile.type.toLowerCase();
    
    if (fileType.startsWith('image/')) {
      mediaType = 'image';
    } else if (fileType.startsWith('video/')) {
      mediaType = 'video';
    } else {
      // Fallback: check file extension
      const fileName = uploadedFile.name.toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'];
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
      
      const isImage = imageExtensions.some(ext => fileName.endsWith(ext));
      const isVideo = videoExtensions.some(ext => fileName.endsWith(ext));
      
      if (isImage) {
        mediaType = 'image';
      } else if (isVideo) {
        mediaType = 'video';
      } else {
        toast({
          title: 'Unsupported File Type',
          description: 'Please select a valid image or video file.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Debug logging
    console.log('File upload details:', {
      fileName: uploadedFile.name,
      fileType: uploadedFile.type,
      fileSize: uploadedFile.size,
      detectedMediaType: mediaType
    });

    try {
      const formData = new FormData();
      formData.append('exercise', label);
      formData.append('mediaType', mediaType);
      formData.append('media', uploadedFile);
      formData.append('notes', newLabel || '');

      await apiService.saveFormCheck(formData);
      
      setNewLabel("");
      setShowUploadModal(false);
      setUploadedFile(null);
      setUploadPreview(null);
      
      toast({
        title: 'Form Check Saved!',
        description: isMobile 
          ? `Your ${mediaType} has been uploaded from your phone and saved successfully as ${mediaType}.`
          : `Your ${mediaType} has been uploaded and saved successfully as ${mediaType}.`,
        variant: 'default',
      });
      
      // Refresh form checks after saving
      initializeFormChecks();
    } catch (error) {
      console.error('Error saving uploaded file:', error);
      toast({
        title: 'Error Saving File',
        description: 'Failed to save the uploaded file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openFileUpload = () => {
    setShowUploadModal(true);
    setNewLabel("");
    setUploadedFile(null);
    setUploadPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openVideoModal = async (formCheck: FormCheck) => {
    // Convert data URLs to blob URLs for better video playback
    const processedFormCheck = { ...formCheck };
    
    if (formCheck.videoUrl && formCheck.videoUrl.startsWith('data:')) {
      try {
        const blobUrl = await convertDataUrlToBlobUrl(formCheck.videoUrl);
        processedFormCheck.videoUrl = blobUrl;
      } catch (error) {
        console.warn('Failed to convert video URL:', error);
      }
    }
    
    setSelectedVideo(processedFormCheck);
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    // Clean up blob URLs if they were created
    if (selectedVideo && selectedVideo.videoUrl && selectedVideo.videoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(selectedVideo.videoUrl);
    }
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const playVideo = (videoUrl: string) => {
    try {
      // Create a temporary video element to test if the video can be played
      const testVideo = document.createElement('video');
      testVideo.src = videoUrl;
      testVideo.onloadeddata = () => {
        openVideoModal({ id: 'temp', exerciseId: 'temp', exerciseName: 'Video', videoUrl, timestamp: new Date().toISOString() });
      };
      testVideo.onerror = () => {
        toast({ 
          title: 'Video Error', 
          description: 'This video cannot be played. It may have been corrupted or the format is not supported.', 
          variant: 'destructive' 
        });
      };
    } catch (error) {
      toast({ 
        title: 'Video Error', 
        description: 'Failed to load video. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  // Modified modal JSX to fix button logic and ensure camera opens
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" id="form-check-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Form Check Library</h1>
          <p className="text-gray-600 mt-2">
            {isMobile 
              ? 'Capture, upload, and review your exercise form photos and videos from your phone'
              : 'Review and manage your exercise form videos and photos'
            }
          </p>
        </div>
      </div>

      {/* Add New Form Check Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera Capture Card */}
        <Card className="p-6 flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={async () => { 
          setShowAddModal(true); 
          setIsCameraOpen(true); 
          setNewLabel(""); 
          setExerciseName(""); 
          setCaptureMode('video'); 
          setCapturedImage(null);
          setCurrentVideo(null);
          setIsRecording(false);
          
          // Check camera permission first
          const permission = await checkCameraPermission();
          if (permission === 'denied') {
            toast({
              title: 'Camera Permission Denied',
              description: 'Please enable camera access in your browser settings and try again.',
              variant: 'destructive',
            });
            return;
          }
          
          // Open camera immediately when modal opens
          setTimeout(() => openCamera(), 100);
        }}>
          <div className="p-3 bg-blue-100 rounded-full">
            <Camera className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Camera Capture</h2>
            <p className="text-gray-600">Record video or take photos using your device camera</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg font-semibold rounded-lg shadow-md transition-colors duration-200 border-2 border-blue-800">
            <Camera className="h-5 w-5 mr-2" /> Start
          </Button>
        </Card>

        {/* File Upload Card */}
        <Card className="p-6 flex items-center gap-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={openFileUpload}>
          <div className="p-3 bg-purple-100 rounded-full">
            <Upload className="h-8 w-8 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">Upload from Device</h2>
            <p className="text-gray-600">Upload existing photos or videos from your device</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 text-lg font-semibold rounded-lg shadow-md transition-colors duration-200 border-2 border-purple-800">
            <Upload className="h-5 w-5 mr-2" /> Upload
          </Button>
        </Card>
      </div>

      {/* Camera Modal (for Add New) */}
      {showAddModal && isCameraOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-white">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Add New Form Check</h3>
                <Button onClick={() => { setShowAddModal(false); closeCamera(); setCapturedImage(null); }} className="p-2">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="mb-4 flex gap-2 items-center">
                <Input
                  placeholder="Enter exercise name or label (optional)"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="w-full"
                />
                <Button
                  className={captureMode === 'image' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
                  onClick={() => { setCaptureMode('image'); setCapturedImage(null); }}
                >
                  <ImageIcon className="h-4 w-4 mr-1" /> Image
                </Button>
                <Button
                  className={captureMode === 'video' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
                  onClick={() => { setCaptureMode('video'); setCapturedImage(null); setCurrentVideo(null); setIsRecording(false); }}
                >
                  <Video className="h-4 w-4 mr-1" /> Video
                </Button>
              </div>
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                {/* Live camera feed always shown */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                  style={{ display: (capturedImage || currentVideo) ? 'none' : 'block' }}
                />
                {/* Camera troubleshooting help
                {!videoRef.current?.srcObject && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
                    <div className="text-center text-white p-4">
                      <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h4 className="text-lg font-semibold mb-2">Camera Not Connected</h4>
                      <p className="text-sm text-gray-300 mb-4">
                        Please allow camera access when prompted, or check your browser settings.
                      </p>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p>• Make sure you're using HTTPS or localhost</p>
                        <p>• Check browser camera permissions</p>
                        <p>• Ensure no other app is using the camera</p>
                      </div>
                      <Button 
                        onClick={openCamera}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                )} */}
                {/* Image preview */}
                {captureMode === 'image' && capturedImage && (
                  <img src={capturedImage} alt="Captured" className="w-full h-64 object-cover rounded" />
                )}
                {/* Video preview */}
                {captureMode === 'video' && currentVideo && (
                  <video
                    src={currentVideo}
                    controls
                    className="w-full h-64 object-cover"
                  />
                )}
                {isRecording && captureMode === 'video' && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                    REC
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                {captureMode === 'image' ? (
                  !capturedImage ? (
                    <Button
                      onClick={captureImage}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-colors duration-200 border-2 border-blue-800"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Capture Photo
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setCapturedImage(null)}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retake
                    </Button>
                  )
                ) : (
                  // Video mode - only show recording buttons when no video is recorded yet
                  !currentVideo ? (
                    !isRecording ? (
                      <Button 
                        onClick={startRecording}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopRecording}
                        className="bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Recording
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={() => { setCurrentVideo(null); setIsRecording(false); }}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-semibold shadow-md transition-colors duration-200 border-2 border-gray-800"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Record Again
                    </Button>
                  )
                )}
                {/* Save button for both modes */}
                {(capturedImage || currentVideo) && (
                  <Button
                    onClick={saveFormCheck}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md transition-colors duration-200 border-2 border-green-800"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Save Form Check
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* File Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-white">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Upload Form Check from Device</h3>
                <Button onClick={() => { 
                  setShowUploadModal(false); 
                  setUploadedFile(null); 
                  setUploadPreview(null); 
                  setNewLabel(""); 
                }} className="p-2">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="mb-4">
                <Input
                  placeholder="Enter exercise name or label (optional)"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  className="w-full mb-4"
                />
                
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm,video/ogg,video/quicktime"
                    capture={isMobile ? "environment" : undefined}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                                     {!uploadPreview ? (
                     <div onClick={() => fileInputRef.current?.click()}>
                       <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                       <h4 className="text-lg font-semibold text-gray-700 mb-2">
                         {isMobile ? 'Upload from Your Phone' : 'Upload Photo or Video'}
                       </h4>
                       <p className="text-gray-500 mb-4">
                         {isMobile 
                           ? 'Tap to select a photo or video from your device gallery'
                           : 'Click to select a file from your device'
                         }
                       </p>
                       <p className="text-sm text-gray-400 mb-4">
                         Supports: JPEG, PNG, WebP, MP4, WebM, OGG (Max 50MB)
                       </p>
                       {isMobile && (
                         <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                           <p className="text-sm text-blue-700">
                             💡 <strong>Mobile Tip:</strong> You can also take a new photo or video directly from your camera
                           </p>
                         </div>
                       )}
                       <div className="flex gap-3 justify-center">
                         <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                           <Smartphone className="h-4 w-4 mr-2" />
                           {isMobile ? 'Choose from Gallery' : 'Choose File'}
                         </Button>
                         {isMobile && (
                           <>
                             <Button 
                               onClick={() => {
                                 if (fileInputRef.current) {
                                   fileInputRef.current.capture = "environment";
                                   fileInputRef.current.accept = "image/*";
                                   fileInputRef.current.click();
                                 }
                               }}
                               className="bg-green-600 hover:bg-green-700 text-white"
                             >
                               <Camera className="h-4 w-4 mr-2" />
                               Take Photo
                             </Button>
                             <Button 
                               onClick={() => {
                                 if (fileInputRef.current) {
                                   fileInputRef.current.capture = "environment";
                                   fileInputRef.current.accept = "video/*";
                                   fileInputRef.current.click();
                                 }
                               }}
                               className="bg-red-600 hover:bg-red-700 text-white"
                             >
                               <Video className="h-4 w-4 mr-2" />
                               Record Video
                             </Button>
                           </>
                         )}
                       </div>
                     </div>
                                      ) : (
                     <div>
                       <h4 className="text-lg font-semibold text-gray-700 mb-4">File Preview</h4>
                       
                       {/* File Type Indicator */}
                       <div className="mb-4">
                         <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                           uploadedFile?.type.startsWith('image/') 
                             ? 'bg-green-100 text-green-800' 
                             : 'bg-blue-100 text-blue-800'
                         }`}>
                           {uploadedFile?.type.startsWith('image/') ? (
                             <>
                               <ImageIcon className="h-4 w-4 mr-2" />
                               Image File
                             </>
                           ) : (
                             <>
                               <Video className="h-4 w-4 mr-2" />
                               Video File
                             </>
                           )}
                         </div>
                         <p className="text-sm text-gray-600 mt-1">
                           {uploadedFile?.name} ({(uploadedFile?.size / 1024 / 1024).toFixed(2)} MB)
                         </p>
                       </div>
                       
                       <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                         {uploadedFile?.type.startsWith('image/') ? (
                           <img 
                             src={uploadPreview} 
                             alt="Preview" 
                             className="w-full h-64 object-contain mx-auto" 
                           />
                         ) : (
                           <video 
                             src={uploadPreview} 
                             controls 
                             className="w-full h-64 object-contain mx-auto"
                           />
                         )}
                       </div>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => {
                            setUploadedFile(null);
                            setUploadPreview(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                          className="bg-gray-600 hover:bg-gray-700 text-white"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Choose Different File
                        </Button>
                        <Button
                          onClick={saveUploadedFile}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Save Form Check
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Camera Modal (for auto-open from button) remains as before, but only opens if !showAddModal && isCameraOpen */}
      {(!showAddModal && isCameraOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-white">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Form Check - {exerciseName || 'Exercise'}</h3>
                <Button onClick={closeCamera} className="p-2">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                {!currentVideo ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <video
                    src={currentVideo}
                    controls
                    className="w-full h-64 object-cover"
                  />
                )}
                {isRecording && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
                    REC
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-center">
                {!currentVideo ? (
                  <>
                    {!isRecording ? (
                      <Button 
                        onClick={startRecording}
                        className="bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md transition-colors duration-200 border-2 border-red-800"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button 
                        onClick={stopRecording}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold shadow-md transition-colors duration-200 border-2 border-gray-800"
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        Stop Recording
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={saveFormCheck}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Save Form Check
                    </Button>
                    <Button 
                      onClick={() => {
                        setCurrentVideo(null);
                        recordedChunksRef.current = [];
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Record Again
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Video className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Form Checks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Plus className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Exercises</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueExercises}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search form checks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Exercise Filter */}
          <div className="flex gap-2">
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getUniqueExercises().map(exercise => (
                <option key={exercise} value={exercise}>
                  {exercise === "all" ? "All Exercises" : exercise}
                </option>
              ))}
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "exercise")}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="exercise">Sort by Exercise</option>
            </select>

            {/* Sort Order */}
            <Button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 border border-gray-300 hover:bg-gray-50"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Form Checks Grid */}
      {filteredChecks.length === 0 ? (
        <Card className="p-12 text-center">
          <Video className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Form Checks Found</h3>
          <p className="text-gray-600">
            {formChecks.length === 0 
              ? "You haven't recorded any form checks yet. Start by recording your exercise form in the workout tracker."
              : "No form checks match your current filters."
            }
          </p>
        </Card>
      ) : (
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {filteredChecks.map((check) => (
            <Card key={check.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                {check.mediaType === 'image' && check.imageUrl ? (
                  <div className="relative w-full h-48 bg-black">
                    <img src={check.imageUrl} alt="Form Check" className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      Image
                    </div>
                  </div>
                ) : check.mediaType === 'video' && check.videoUrl ? (
                  <div className="relative w-full h-48 bg-black">
                    {/* Show actual video preview */}
                    <video
                      src={check.videoUrl}
                      className="w-full h-full object-cover"
                      preload="metadata"
                      muted
                      onLoadedData={(e) => {
                        // Try to set a thumbnail frame
                        const video = e.target as HTMLVideoElement;
                        if (video.videoWidth > 0) {
                          video.currentTime = 0.1; // Set to 0.1 seconds for thumbnail
                        }
                      }}
                      onError={(e) => {
                        console.error('Video preview error:', e);
                        // Show fallback if video preview fails
                        const video = e.target as HTMLVideoElement;
                        if (video) {
                          video.style.display = 'none';
                          // Show a placeholder instead
                          const parent = video.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                <div class="text-center">
                                  <svg class="h-12 w-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                  </svg>
                                  <p class="text-gray-400 text-sm">Video Recording</p>
                                </div>
                              </div>
                            `;
                          }
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <Button
                        onClick={() => openVideoModal(check)}
                        className="bg-white bg-opacity-90 hover:bg-opacity-100 text-black p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <Video className="h-8 w-8" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      Video
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">No media</p>
                  </div>
                )}
                <Button
                  onClick={() => deleteFormCheck(check.id)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{check.exerciseName || check.exercise || 'Unknown Exercise'}</h3>
                  <Badge className="bg-gray-100 text-gray-800 text-xs">
                    {new Date(check.timestamp).toLocaleDateString()}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-500 mb-3">
                  {new Date(check.timestamp).toLocaleString()}
                </p>
                
                <div className="flex items-center gap-2">
                  {check.mediaType === 'image' && check.imageUrl && (
                    <>
                      <Button
                        onClick={() => openVideoModal(check)}
                        className="text-blue-600 hover:text-blue-700 border-blue-300 border text-sm"
                      >
                        <ImageIcon className="h-4 w-4 mr-1" />
                        View Image
                      </Button>
                      <Button
                        onClick={() => downloadImage(check.imageUrl!, check.exerciseName || check.exercise || 'Unknown Exercise', check.timestamp)}
                        className="text-green-600 hover:text-green-700 border-green-300 border text-sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                  {check.mediaType === 'video' && check.videoUrl && (
                    <>
                      <Button
                        onClick={() => openVideoModal(check)}
                        className="text-blue-600 hover:text-blue-700 border-blue-300 border text-sm"
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Play Video
                      </Button>
                      <Button
                        onClick={() => downloadVideo(check.videoUrl!, check.exerciseName || check.exercise || 'Unknown Exercise', check.timestamp)}
                        className="text-green-600 hover:text-green-700 border-green-300 border text-sm"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => deleteFormCheck(check.id)}
                    className="text-red-600 hover:text-red-700 border-red-300 border text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Clear All Button - Safe Location */}
      {formChecks.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800">Danger Zone</h3>
              <p className="text-sm text-red-600 mt-1">
                Permanently delete all form check videos and images
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={deleteAllFormChecks}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Form Checks
              </Button>
              <Button 
                onClick={clearAllFormChecks}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2"
              >
                <Database className="h-4 w-4 mr-2" />
                Clear Storage
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Video Player Modal */}
      {showVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl bg-white">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{selectedVideo.exerciseName}</h3>
                <Button onClick={closeVideoModal} className="p-2">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                {selectedVideo.mediaType === 'image' && selectedVideo.imageUrl ? (
                  <img 
                    src={selectedVideo.imageUrl} 
                    alt="Form Check" 
                    className="w-full max-h-96 object-contain mx-auto" 
                  />
                ) : selectedVideo.mediaType === 'video' && selectedVideo.videoUrl ? (
                  <div className="relative">
                    <video
                      src={selectedVideo.videoUrl}
                      controls
                      autoPlay
                      className="w-full max-h-96 object-contain mx-auto"
                      onError={(e) => {
                        console.error('Video playback error:', e);
                        console.log('Video URL:', selectedVideo.videoUrl);
                        console.log('Video URL type:', typeof selectedVideo.videoUrl);
                        console.log('Video URL starts with data:', selectedVideo.videoUrl?.startsWith('data:'));
                        console.log('Video URL starts with blob:', selectedVideo.videoUrl?.startsWith('blob:'));
                        
                        // Show fallback
                        const video = e.target as HTMLVideoElement;
                        const fallback = document.getElementById('video-fallback');
                        if (video && fallback) {
                          video.style.display = 'none';
                          fallback.classList.remove('hidden');
                        }
                        toast({ 
                          title: 'Video Error', 
                          description: 'This video cannot be played. You can still download it.', 
                          variant: 'destructive' 
                        });
                      }}
                      onLoadStart={() => {
                        console.log('Video loading started');
                        console.log('Loading video URL:', selectedVideo.videoUrl);
                        // Hide fallback when video starts loading
                        const fallback = document.getElementById('video-fallback');
                        if (fallback) {
                          fallback.classList.add('hidden');
                        }
                      }}
                      onCanPlay={() => {
                        console.log('Video can play successfully');
                        // Hide fallback when video can play
                        const fallback = document.getElementById('video-fallback');
                        if (fallback) {
                          fallback.classList.add('hidden');
                        }
                      }}
                      onLoadedMetadata={(e) => {
                        console.log('Video metadata loaded');
                        console.log('Video duration:', (e.target as HTMLVideoElement).duration);
                        console.log('Video dimensions:', (e.target as HTMLVideoElement).videoWidth, 'x', (e.target as HTMLVideoElement).videoHeight);
                      }}
                    >
                      <source src={selectedVideo.videoUrl} type="video/webm" />
                      <source src={selectedVideo.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    
                    {/* Fallback message if video fails to load */}
                    <div id="video-fallback" className="hidden w-full h-96 bg-gray-800 text-white">
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg mb-2">Video cannot be played</p>
                          <p className="text-sm text-gray-400 mb-4">The video format may not be supported by your browser</p>
                          <Button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = selectedVideo.videoUrl;
                              link.download = `${selectedVideo.exerciseName}_${new Date(selectedVideo.timestamp).toISOString().split('T')[0]}.webm`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              toast({ 
                                title: 'Download Started', 
                                description: 'Your video is being downloaded.', 
                                variant: 'default' 
                              });
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                          >
                            Download Video
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-96 flex items-center justify-center text-white">
                    <p>No media available</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Recorded: {new Date(selectedVideo.timestamp).toLocaleString()}</span>
                <div className="flex gap-2">
                  {selectedVideo.mediaType === 'image' && selectedVideo.imageUrl && (
                    <Button
                      onClick={() => downloadImage(selectedVideo.imageUrl!, selectedVideo.exerciseName || 'Unknown Exercise', selectedVideo.timestamp)}
                      className="text-blue-600 hover:text-blue-700 border-blue-300 border text-sm"
                    >
                      Download Image
                    </Button>
                  )}
                  {selectedVideo.mediaType === 'video' && selectedVideo.videoUrl && (
                    <Button
                      onClick={() => downloadVideo(selectedVideo.videoUrl!, selectedVideo.exerciseName || 'Unknown Exercise', selectedVideo.timestamp)}
                      className="text-blue-600 hover:text-blue-700 border-blue-300 border text-sm"
                    >
                      Download Video
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      deleteFormCheck(selectedVideo.id);
                      closeVideoModal();
                    }}
                    className="text-red-600 hover:text-red-700 border-red-300 border text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Clear All Form Checks?</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                This action will permanently delete all {formChecks.length} form check videos and images. 
                This cannot be undone.
              </p>
              
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={cancelDeleteAll}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteAll}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
};

export default FormCheck; 