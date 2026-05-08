
class ApiService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = 'https://fitbuddy-backend-l3r0.onrender.com/api';
    // this.baseURL = 'http://localhost:5000/api'
    this.token = localStorage.getItem('token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: this.getHeaders(),
    };

    try {
      const response = await fetch(url, config);
      
      // Check if the response is ok first
      if (!response.ok) {
        const text = await response.text();
        console.error('HTTP error response:', response.status, text);
        
        // Try to parse as JSON for error messages
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${text}`);
        } catch {
          // If it's not JSON, throw a generic error
          throw new Error(`HTTP ${response.status}: ${text}`);
        }
      }
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        
        // Check if it's an HTML error page
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          throw new Error(`Server returned HTML instead of JSON. This usually means the server is not running or there's a connection issue. Status: ${response.status}`);
        }
        
        throw new Error(`Server error: ${response.status} - Expected JSON but received ${contentType || 'unknown content type'}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        const text = await response.text();
        console.error('Response text that failed to parse:', text);
        throw new Error('Invalid JSON response from server - check if server is running');
      }

      return data;
    } catch (error) {
      console.error('API request error for endpoint:', endpoint, error);
      throw error;
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    const response = await this.request<{ message: string; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.token = response.token;
    localStorage.setItem('token', response.token);

    return {
      success: true,
      data: response.user,
    };
  }

  async register(name: string, email: string, password: string) {
    const response = await this.request<{ message: string; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    this.token = response.token;
    localStorage.setItem('token', response.token);

    return {
      success: true,
      data: response.user,
    };
  }

  async getCurrentUser() {
    const response = await this.request<{ user: any }>('/auth/me');
    return {
      success: true,
      data: response.user,
    };
  }

  async firebaseAuth(firebaseToken: string, provider: string, userData?: any) {
    const response = await this.request<{ message: string; token: string; user: any }>('/auth/firebase', {
      method: 'POST',
      body: JSON.stringify({ firebaseToken, provider, userData }),
    });

    this.token = response.token;
    localStorage.setItem('token', response.token);

    return {
      success: true,
      data: response.user,
    };
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  // Workout methods
  async getWorkouts() {
    const response = await this.request<{ workouts: any[] }>('/workouts');
    return response.workouts;
  }

  async saveWorkout(session: any[]) {
    const response = await this.request<{ message: string; workout: any }>('/workouts', {
      method: 'POST',
      body: JSON.stringify({ session }),
    });
    return response;
  }

  // Form check methods
  async saveFormCheck(formData: FormData) {
    const headers = this.getHeaders();
    delete headers['Content-Type']; // Let browser set content-type for FormData

    const response = await fetch(`${this.baseURL}/form-check`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to save form check');
    }

    return data;
  }

  async getFormChecks() {
    const response = await this.request<{ success: boolean; data: any[] }>('/form-check');
    return response.data;
  }

  async deleteFormCheck(id: string) {
    const response = await this.request<{ success: boolean; message: string }>(`/form-check/${id}`, {
      method: 'DELETE',
    });
    return response;
  }

  async deleteAllFormChecks() {
    const response = await this.request<{ success: boolean; message: string }>('/form-check', {
      method: 'DELETE',
    });
    return response;
  }

  // Workout plan methods
  async getWorkoutPlan() {
    const response = await this.request<{ workoutPlan: any }>('/workout-plans');
    return response.workoutPlan;
  }

  async saveWorkoutPlan(plan: any) {
    const response = await this.request<{ message: string; workoutPlan: any }>('/workout-plans', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
    return response;
  }

  async deleteWorkoutPlan() {
    const response = await this.request<{ message: string }>('/workout-plans', {
      method: 'DELETE',
    });
    return response;
  }

  // Recommendation methods
  async getRecommendation() {
    return this.request<any>('/recommendation');
  }

  // Current workout session methods
  async getCurrentWorkout() {
    const response = await this.request<{ currentWorkout: any[] }>('/current-workout');
    return response.currentWorkout;
  }

  async saveCurrentWorkout(session: any[]) {
    const response = await this.request<{ message: string; currentWorkout: any[] }>('/current-workout', {
      method: 'POST',
      body: JSON.stringify({ session }),
    });
    return response;
  }

  async clearCurrentWorkout() {
    const response = await this.request<{ message: string }>('/current-workout', {
      method: 'DELETE',
    });
    return response;
  }

  // User preferences methods
  async getUserPreferences() {
    const response = await this.request<{ preferences: any }>('/user-preferences');
    return response.preferences;
  }

  async saveUserPreference(key: string, value: any) {
    const response = await this.request<{ message: string; preferences: any }>('/user-preferences', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
    return response;
  }

  async getUserPreference(key: string) {
    const response = await this.request<{ value: any }>(`/user-preferences/${key}`);
    return response.value;
  }

  // Bluetooth Device Management
  async getBluetoothDevices(): Promise<any[]> {
    return this.request<any[]>('/bluetooth/devices');
  }

  async pairBluetoothDevice(deviceData: {
    deviceId: string;
    deviceName: string;
    deviceType?: string;
    brand: string;
    model: string;
    macAddress?: string;
    firmwareVersion?: string;
  }): Promise<any> {
    return this.request<any>('/bluetooth/devices/pair', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  }

  async updateDeviceStatus(deviceId: string, status: {
    isConnected: boolean;
    batteryLevel?: number;
    signalStrength?: number;
  }): Promise<any> {
    return this.request<any>(`/bluetooth/devices/${deviceId}/status`, {
      method: 'PUT',
      body: JSON.stringify(status),
    });
  }

  async unpairDevice(deviceId: string): Promise<any> {
    return this.request<any>(`/bluetooth/devices/${deviceId}`, {
      method: 'DELETE',
    });
  }

  async syncDeviceData(deviceId: string, healthData: any[], syncType: 'full' | 'incremental' = 'incremental'): Promise<any> {
    return this.request<any>(`/bluetooth/devices/${deviceId}/sync`, {
      method: 'POST',
      body: JSON.stringify({ healthData, syncType }),
    });
  }

  async getDeviceHealthData(deviceId: string, startDate?: string, endDate?: string, limit?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit.toString());
    
    return this.request<any[]>(`/bluetooth/devices/${deviceId}/health-data?${params.toString()}`);
  }

  async getDeviceSyncHistory(deviceId: string, limit?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    return this.request<any[]>(`/bluetooth/devices/${deviceId}/sync-history?${params.toString()}`);
  }

  async getAllSyncSessions(limit?: number): Promise<any[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    
    return this.request<any[]>(`/bluetooth/sync-sessions?${params.toString()}`);
  }

  // User Settings methods
  async getUserSettings(): Promise<any> {
    return this.request<any>('/user/settings');
  }

  async saveUserSettings(settings: any): Promise<any> {
    return this.request<any>('/user/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async exportUserData(format: string): Promise<any> {
    return this.request<any>(`/user/export?format=${format}`);
  }

  // Workout analytics
  async getWorkoutAnalytics(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request<any>(`/workouts/analytics?${params.toString()}`);
  }

  // Macro data
  async getMacroData(date?: string): Promise<any> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    return this.request<any>(`/macros?${params.toString()}`);
  }

  async saveMacroData(macroData: any): Promise<any> {
    return this.request<any>('/macros', {
      method: 'POST',
      body: JSON.stringify(macroData),
    });
  }

  // Friends
  async getFriends(): Promise<any[]> {
    return this.request<any[]>('/friends');
  }

  async getFriendRequests(): Promise<any[]> {
    return this.request<any[]>('/friends/requests');
  }

  async sendFriendRequest(friendId: string): Promise<any> {
    return this.request<any>('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
  }

  async acceptFriendRequest(requestId: string): Promise<any> {
    return this.request<any>(`/friends/request/${requestId}/accept`, {
      method: 'POST',
    });
  }

  // Challenges
  async getChallenges(): Promise<any[]> {
    return this.request<any[]>('/challenges');
  }

  async createChallenge(challengeData: any): Promise<any> {
    return this.request<any>('/challenges', {
      method: 'POST',
      body: JSON.stringify(challengeData),
    });
  }

  async joinChallenge(challengeId: string): Promise<any> {
    return this.request<any>(`/challenges/${challengeId}/join`, {
      method: 'POST',
    });
  }

  // Coach
  async getCoachClients(): Promise<any[]> {
    return this.request<any[]>('/coach/clients');
  }

  async assignWorkoutToClient(clientId: string, workoutData: any): Promise<any> {
    return this.request<any>(`/coach/clients/${clientId}/assign-workout`, {
      method: 'POST',
      body: JSON.stringify(workoutData),
    });
  }

  // Admin
  async getAdminUsers(): Promise<any[]> {
    return this.request<any[]>('/admin/users');
  }

  async getAdminAnalytics(): Promise<any> {
    return this.request<any>('/admin/analytics');
  }
}

export const apiService = new ApiService(); 