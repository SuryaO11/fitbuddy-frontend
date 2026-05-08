import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useToast } from '../hooks/use-toast';
import { apiService } from '../lib/api';
import Button from '@/components/ui/button';
import Card from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bell, 
  Shield, 
  Download, 
  Cloud, 
  Save, 
  Clock, 
  Calendar, 
  Video, 
  Activity,
  Settings as SettingsIcon,
  Database,
  Smartphone,
  Mail,
  Users,
  Lock
} from 'lucide-react';

interface UserSettings {
  // Notification & Reminder Settings
  workoutReminders: boolean;
  workoutReminderTime: string;
  workoutReminderDays: string[];
  restDayReminders: boolean;
  restDayReminderTime: string;
  progressCheckins: boolean;
  progressCheckinFrequency: 'weekly' | 'monthly';
  formCheckReminders: boolean;
  formCheckReminderFrequency: 'weekly' | 'biweekly' | 'monthly';
  
  // Data & Privacy Settings
  autoSaveWorkouts: boolean;
  dataExportFormats: string[];
  shareProgressWithFriends: boolean;
  shareProgressWithTrainer: boolean;
  cloudSync: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  
  // Privacy Controls
  showOnLeaderboard: boolean;
  receiveEmails: boolean;
  allowFriendRequests: boolean;
  profileVisibility: 'public' | 'friends' | 'private';
}

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    // Notification & Reminder Settings
    workoutReminders: true,
    workoutReminderTime: '18:00',
    workoutReminderDays: ['monday', 'wednesday', 'friday'],
    restDayReminders: true,
    restDayReminderTime: '09:00',
    progressCheckins: true,
    progressCheckinFrequency: 'weekly',
    formCheckReminders: true,
    formCheckReminderFrequency: 'weekly',
    
    // Data & Privacy Settings
    autoSaveWorkouts: true,
    dataExportFormats: ['json', 'csv', 'pdf'],
    shareProgressWithFriends: true,
    shareProgressWithTrainer: false,
    cloudSync: true,
    backupFrequency: 'weekly',
    
    // Privacy Controls
    showOnLeaderboard: true,
    receiveEmails: true,
    allowFriendRequests: true,
    profileVisibility: 'friends',
  });

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      if (user?._id) {
        try {
          const userSettings = await apiService.getUserSettings();
          if (userSettings) {
            setSettings(prev => ({ ...prev, ...userSettings }));
          }
        } catch (error) {
          console.error('Error loading settings:', error);
          toast({
            title: 'Error Loading Settings',
            description: 'Failed to load your settings. Using defaults.',
            variant: 'destructive',
          });
        }
      }
    };
    loadSettings();
  }, [user?._id, toast]);

  // Save settings to backend
  const saveSettings = async () => {
    setLoading(true);
    try {
      await apiService.saveUserSettings(settings);
      toast({
        title: 'Settings Saved',
        description: 'Your settings have been saved successfully.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error Saving Settings',
        description: 'Failed to save your settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Export data
  const exportData = async (format: string) => {
    setExporting(true);
    try {
      const data = await apiService.exportUserData(format);
      
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fitbuddy-data-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Data Exported',
        description: `Your data has been exported as ${format.toUpperCase()}.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export your data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleSetting = (key: keyof UserSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleWorkoutDay = (day: string) => {
    setSettings(prev => ({
      ...prev,
      workoutReminderDays: prev.workoutReminderDays.includes(day)
        ? prev.workoutReminderDays.filter(d => d !== day)
        : [...prev.workoutReminderDays, day]
    }));
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Mon' },
    { key: 'tuesday', label: 'Tue' },
    { key: 'wednesday', label: 'Wed' },
    { key: 'thursday', label: 'Thu' },
    { key: 'friday', label: 'Fri' },
    { key: 'saturday', label: 'Sat' },
    { key: 'sunday', label: 'Sun' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <SettingsIcon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Customize your FitBuddy experience</p>
          </div>
        </div>

        {/* Notification & Reminder Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Notification & Reminder Settings</h2>
          </div>
          
          <div className="space-y-6">
            {/* Workout Reminders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Workout Reminders</Label>
                  <p className="text-sm text-gray-600">Get reminded to work out on your schedule</p>
                </div>
                <Switch
                  checked={settings.workoutReminders}
                  onCheckedChange={() => toggleSetting('workoutReminders')}
                />
              </div>
              
              {settings.workoutReminders && (
                <div className="ml-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Reminder Time</Label>
                      <Input
                        type="time"
                        value={settings.workoutReminderTime}
                        onChange={(e) => updateSetting('workoutReminderTime', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Days of Week</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {daysOfWeek.map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => toggleWorkoutDay(key)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              settings.workoutReminderDays.includes(key)
                                ? 'bg-primary text-black'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rest Day Reminders */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Rest Day Reminders</Label>
                <p className="text-sm text-gray-600">Get reminded to take recovery days</p>
              </div>
              <Switch
                checked={settings.restDayReminders}
                onCheckedChange={() => toggleSetting('restDayReminders')}
              />
            </div>

            {/* Progress Check-ins */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Progress Check-ins</Label>
                  <p className="text-sm text-gray-600">Regular progress review reminders</p>
                </div>
                <Switch
                  checked={settings.progressCheckins}
                  onCheckedChange={() => toggleSetting('progressCheckins')}
                />
              </div>
              
              {settings.progressCheckins && (
                <div className="ml-6">
                  <Label className="text-sm font-medium">Frequency</Label>
                  <Select
                    value={settings.progressCheckinFrequency}
                    onValueChange={(value: 'weekly' | 'monthly') => updateSetting('progressCheckinFrequency', value)}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Form Check Reminders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Form Check Reminders</Label>
                  <p className="text-sm text-gray-600">Regular form assessment prompts</p>
                </div>
                <Switch
                  checked={settings.formCheckReminders}
                  onCheckedChange={() => toggleSetting('formCheckReminders')}
                />
              </div>
              
              {settings.formCheckReminders && (
                <div className="ml-6">
                  <Label className="text-sm font-medium">Frequency</Label>
                  <Select
                    value={settings.formCheckReminderFrequency}
                    onValueChange={(value: 'weekly' | 'biweekly' | 'monthly') => updateSetting('formCheckReminderFrequency', value)}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Data & Privacy Settings */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Data & Privacy Settings</h2>
          </div>
          
          <div className="space-y-6">
            {/* Auto-save Workouts */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Auto-save Workouts</Label>
                <p className="text-sm text-gray-600">Automatically save incomplete workouts</p>
              </div>
              <Switch
                checked={settings.autoSaveWorkouts}
                onCheckedChange={() => toggleSetting('autoSaveWorkouts')}
              />
            </div>

            {/* Data Export */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Data Export</Label>
                <p className="text-sm text-gray-600">Download your workout history in various formats</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {['json', 'csv', 'pdf'].map((format) => (
                  <Button
                    key={format}
                    onClick={() => exportData(format)}
                    disabled={exporting}
                    className="flex items-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 text-sm"
                  >
                    <Download className="h-4 w-4" />
                    Export {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Privacy Controls */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Privacy Controls</Label>
                <p className="text-sm text-gray-600">Control who can see your progress</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Share progress with friends</span>
                  </div>
                  <Switch
                    checked={settings.shareProgressWithFriends}
                    onCheckedChange={() => toggleSetting('shareProgressWithFriends')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Share progress with trainer</span>
                  </div>
                  <Switch
                    checked={settings.shareProgressWithTrainer}
                    onCheckedChange={() => toggleSetting('shareProgressWithTrainer')}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Show on leaderboard</span>
                  </div>
                  <Switch
                    checked={settings.showOnLeaderboard}
                    onCheckedChange={() => toggleSetting('showOnLeaderboard')}
                  />
                </div>
              </div>
        </div>

            {/* Cloud Sync */}
            <div className="space-y-4">
        <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Cloud Sync</Label>
                  <p className="text-sm text-gray-600">Sync your data across devices</p>
                </div>
                <Switch
                  checked={settings.cloudSync}
                  onCheckedChange={() => toggleSetting('cloudSync')}
                />
              </div>
              
              {settings.cloudSync && (
                <div className="ml-6">
                  <Label className="text-sm font-medium">Backup Frequency</Label>
                  <Select
                    value={settings.backupFrequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => updateSetting('backupFrequency', value)}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
          >
            {loading ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings; 