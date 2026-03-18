import { API_CONFIG } from '../config/api.config';
import {
  Student,
  Staff,
  HOD,
  SecurityPersonnel,
  UserRole,
  OTPResponse,
  LoginResponse,
  GatePassRequest,
  GroupPassRequest,
  ApiResponse,
} from '../types';

class ApiService {
  private baseURL: string;
  private isBackendAvailable = false;
  private healthCheckInProgress = false;
  private discoveredURL: string | null = null;

  constructor() {
    // Start with config URL (auto-detected from Expo)
    this.baseURL = API_CONFIG.BASE_URL;
    console.log('🚀 ApiService initialized');
    console.log('📍 Initial URL:', this.baseURL);
    
    // Force clear stale cache and initialize (async but fire-and-forget)
    this.forceClearAndInitialize();
  }

  // Force clear stale cache and initialize
  private async forceClearAndInitialize() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const Constants = require('expo-constants').default;
      
      // Get current network IP from Expo Constants
      let currentNetworkIP: string | null = null;
      let currentNetworkURL: string | null = null;
      
      if (Constants.expoConfig?.hostUri) {
        currentNetworkIP = Constants.expoConfig.hostUri.split(':')[0];
        currentNetworkURL = `http://${currentNetworkIP}:8080/api`;
        console.log('📍 Current network IP:', currentNetworkIP);
        console.log('📍 Current network URL:', currentNetworkURL);
      }
      
      // Check cached IPs
      const manualIP = await AsyncStorage.getItem('@mygate_manual_ip');
      const lastWorkingURL = await AsyncStorage.getItem('@mygate_last_working_url');
      
      console.log('🔍 Cached manual IP:', manualIP);
      console.log('🔍 Cached last working URL:', lastWorkingURL);
      
      // If current network IP exists and is different from cached, clear cache
      if (currentNetworkIP && currentNetworkURL) {
        let shouldClear = false;
        
        if (manualIP && manualIP !== currentNetworkIP) {
          console.log('🧹 Manual IP differs from current network - clearing');
          shouldClear = true;
        }
        
        if (lastWorkingURL && !lastWorkingURL.includes(currentNetworkIP)) {
          console.log('🧹 Last working URL differs from current network - clearing');
          shouldClear = true;
        }
        
        if (shouldClear) {
          await AsyncStorage.removeItem('@mygate_manual_ip');
          await AsyncStorage.removeItem('@mygate_last_working_url');
          console.log('✅ Stale cache cleared');
        }
        
        // Set baseURL to current network immediately
        this.baseURL = currentNetworkURL;
        console.log('✅ Using current network URL:', this.baseURL);
      }
      
      // Now run normal initialization
      await this.initializeBackendURL();
      
    } catch (error) {
      console.log('⚠️ Error in forceClearAndInitialize:', error);
      // Fallback to normal initialization
      await this.initializeBackendURL();
    }
  }

  // Initialize backend URL with smart discovery
  private async initializeBackendURL() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // Priority 1: Auto-detect from current network (Expo Constants)
      console.log('🔍 Auto-detecting backend URL from current network...');
      const autoDetectedURL = await this.getExpoConstantsURL();
      if (autoDetectedURL) {
        console.log('📍 Auto-detected URL from Constants:', autoDetectedURL);
        
        // If baseURL is already set to this URL, skip testing
        if (this.baseURL === autoDetectedURL) {
          console.log('✅ BaseURL already set to auto-detected URL');
          return;
        }
        
        if (await this.testURL(autoDetectedURL)) {
          this.baseURL = autoDetectedURL;
          this.discoveredURL = autoDetectedURL;
          await AsyncStorage.setItem('@mygate_last_working_url', autoDetectedURL);
          console.log('✅ Using auto-detected URL from current network');
          
          // Clear manual IP if auto-detection works (network changed)
          const manualIP = await AsyncStorage.getItem('@mygate_manual_ip');
          if (manualIP) {
            const manualURL = `http://${manualIP}:8080/api`;
            if (manualURL !== autoDetectedURL) {
              console.log('🧹 Clearing stale manual IP (network changed)');
              await AsyncStorage.removeItem('@mygate_manual_ip');
            }
          }
          return;
        }
      }
      
      // Priority 2: Check for manual IP override (only if auto-detection failed)
      const manualIP = await AsyncStorage.getItem('@mygate_manual_ip');
      if (manualIP) {
        const manualURL = `http://${manualIP}:8080/api`;
        console.log('🔧 Testing manual IP:', manualURL);
        if (await this.testURL(manualURL)) {
          this.baseURL = manualURL;
          console.log('✅ Using manual IP');
          return;
        } else {
          console.log('🧹 Clearing stale manual IP (not reachable)');
          await AsyncStorage.removeItem('@mygate_manual_ip');
        }
      }
      
      // Priority 3: Check for last working URL (only if different from auto-detected)
      const lastWorkingURL = await AsyncStorage.getItem('@mygate_last_working_url');
      if (lastWorkingURL && lastWorkingURL !== autoDetectedURL) {
        console.log('🔄 Testing last working URL:', lastWorkingURL);
        if (await this.testURL(lastWorkingURL)) {
          this.baseURL = lastWorkingURL;
          console.log('✅ Last working URL is still valid');
          return;
        } else {
          console.log('🧹 Clearing stale last working URL (not reachable)');
          await AsyncStorage.removeItem('@mygate_last_working_url');
        }
      }
      
      // Priority 4: Full discovery from all possible URLs
      console.log('🔍 Running full backend discovery...');
      const workingURL = await this.discoverBackendURL();
      if (workingURL) {
        this.baseURL = workingURL;
        this.discoveredURL = workingURL;
        await AsyncStorage.setItem('@mygate_last_working_url', workingURL);
        console.log('✅ Discovered working URL:', workingURL);
      } else {
        console.log('⚠️  Could not discover backend, using current:', this.baseURL);
      }
    } catch (error) {
      console.log('⚠️  Error initializing backend URL:', error);
    }
  }

  // Get URL from Expo Constants (current network)
  private async getExpoConstantsURL(): Promise<string | null> {
    try {
      const Constants = require('expo-constants').default;
      if (Constants.expoConfig?.hostUri) {
        const ip = Constants.expoConfig.hostUri.split(':')[0];
        return `http://${ip}:8080/api`;
      }
    } catch (error) {
      // Ignore
    }
    return null;
  }

  // Test if a URL is reachable
  private async testURL(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${url.replace('/api', '')}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Discover backend URL from multiple sources
  private async discoverBackendURL(): Promise<string | null> {
    const possibleURLs: string[] = [];
    
    // Add URL from Expo Constants
    try {
      const Constants = require('expo-constants').default;
      if (Constants.expoConfig?.hostUri) {
        const ip = Constants.expoConfig.hostUri.split(':')[0];
        possibleURLs.push(`http://${ip}:8080/api`);
      }
    } catch (error) {
      // Ignore
    }
    
    // Add URLs from config
    possibleURLs.push(...API_CONFIG.POSSIBLE_URLS);
    
    // Add current baseURL
    if (!possibleURLs.includes(this.baseURL)) {
      possibleURLs.unshift(this.baseURL);
    }
    
    console.log('🔍 Testing URLs:', possibleURLs);
    
    // Test each URL
    for (const url of possibleURLs) {
      console.log('   Testing:', url);
      if (await this.testURL(url)) {
        console.log('   ✅ Found working URL:', url);
        return url;
      }
    }
    
    return null;
  }

  // Set manual IP (call this from UI)
  async setManualIP(ip: string): Promise<boolean> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const newURL = `http://${ip}:8080/api`;
      
      // Test the URL first
      console.log('🧪 Testing manual IP:', newURL);
      if (await this.testURL(newURL)) {
        await AsyncStorage.setItem('@mygate_manual_ip', ip);
        await AsyncStorage.setItem('@mygate_last_working_url', newURL);
        this.baseURL = newURL;
        this.isBackendAvailable = true;
        console.log('✅ Manual IP set and verified:', newURL);
        return true;
      } else {
        console.error('❌ Manual IP is not reachable:', newURL);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to set manual IP:', error);
      return false;
    }
  }

  // Clear manual IP and rediscover
  async clearManualIP(): Promise<boolean> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('@mygate_manual_ip');
      console.log('🔄 Manual IP cleared, rediscovering...');
      await this.initializeBackendURL();
      return true;
    } catch (error) {
      console.error('❌ Failed to clear manual IP:', error);
      return false;
    }
  }

  // Force rediscovery of backend URL
  async rediscoverBackend(): Promise<boolean> {
    console.log('🔄 Force rediscovering backend...');
    const workingURL = await this.discoverBackendURL();
    if (workingURL) {
      this.baseURL = workingURL;
      this.discoveredURL = workingURL;
      this.isBackendAvailable = true;
      
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('@mygate_last_working_url', workingURL);
      } catch (error) {
        // Ignore storage errors
      }
      
      console.log('✅ Rediscovered URL:', workingURL);
      return true;
    }
    
    console.log('❌ Could not rediscover backend');
    return false;
  }

  // Helper function to normalize boolean values from backend
  private normalizeBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
    }
    if (typeof value === 'number') return value === 1;
    return false;
  }

  // Helper function to normalize user data (fix boolean fields)
  private normalizeUserData(user: any): any {
    if (!user) return user;
    
    // Create a copy to avoid mutating original
    const normalized = { ...user };
    
    // Normalize common boolean fields
    if ('isActive' in normalized) {
      normalized.isActive = this.normalizeBoolean(normalized.isActive);
    }
    if ('is_active' in normalized) {
      normalized.is_active = this.normalizeBoolean(normalized.is_active);
    }
    if ('enabled' in normalized) {
      normalized.enabled = this.normalizeBoolean(normalized.enabled);
    }
    
    return normalized;
  }

  // Find working backend URL
  async findWorkingBackend(): Promise<string | null> {
    if (this.healthCheckInProgress) {
      console.log('⏳ Health check already in progress...');
      return null;
    }

    this.healthCheckInProgress = true;
    console.log('🔍 Testing backend connection...');
    console.log('📍 Backend URL:', this.baseURL);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15 seconds

      // Test health endpoint
      const response = await fetch(`${this.baseURL.replace('/api', '')}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend is reachable:', data.message);
        this.isBackendAvailable = true;
        this.healthCheckInProgress = false;
        return this.baseURL;
      } else {
        console.log('❌ Backend returned error status:', response.status);
      }
    } catch (error: any) {
      console.log('❌ Backend connection failed:', error.message);
      console.log('❌ Error name:', error.name);
      console.log('❌ Error stack:', error.stack);
      
      // Provide helpful error messages
      if (error.name === 'AbortError') {
        console.log('⏱️  Connection timeout (15s) - Possible causes:');
        console.log('   1. Backend is down');
        console.log('   2. AP Isolation enabled on router');
        console.log('   3. Firewall blocking connection');
        console.log('   4. Phone and laptop on different networks');
      } else if (error.message.includes('Network request failed')) {
        console.log('🌐 Network error - Possible causes:');
        console.log('   1. WiFi connection unstable');
        console.log('   2. Router blocking device-to-device communication');
        console.log('   3. Backend not listening on 0.0.0.0');
      }
    }

    this.isBackendAvailable = false;
    this.healthCheckInProgress = false;
    return null;
  }

  // Check backend status
  async checkBackendStatus(): Promise<boolean> {
    if (this.isBackendAvailable) return true;
    const workingUrl = await this.findWorkingBackend();
    return workingUrl !== null;
  }

  // Get current backend URL
  getCurrentBackendUrl(): string {
    return this.baseURL;
  }

  // Make HTTP request with improved error handling
  private async makeRequest(url: string, options: RequestInit): Promise<any> {
    // Skip health check for now - browser test shows backend is reachable
    // The issue is with React Native fetch, not the backend
    console.log('🚀 API Request:', options.method || 'GET', url);

    let lastError: Error | null = null;

    // Retry logic with better error handling
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`📡 Attempt ${attempt}/${API_CONFIG.RETRY_ATTEMPTS}: ${url}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);
        
        console.log(`✅ Response received: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ HTTP Error ${response.status}:`, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Request successful');
        return data;

      } catch (error: any) {
        lastError = error;
        
        // Log detailed error information
        console.error(`❌ Request failed (attempt ${attempt}/${API_CONFIG.RETRY_ATTEMPTS})`);
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        
        if (error.name === 'AbortError') {
          console.error(`   ⏱️  Request timeout after ${API_CONFIG.TIMEOUT}ms`);
        } else if (error.message.includes('Network request failed')) {
          console.error('   🌐 Network request failed - possible causes:');
          console.error('      1. React Native networking issue');
          console.error('      2. SSL/TLS certificate issue');
          console.error('      3. Expo network configuration');
        } else if (error.message.includes('Failed to fetch')) {
          console.error('   🔌 Fetch failed - possible causes:');
          console.error('      1. CORS issue (but browser works, so unlikely)');
          console.error('      2. React Native fetch polyfill issue');
          console.error('      3. Network adapter issue');
        }

        // Don't retry on final attempt
        if (attempt < API_CONFIG.RETRY_ATTEMPTS) {
          console.log(`🔄 Retrying in ${API_CONFIG.RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY));
        }
      }
    }

    // All retries failed
    console.error('❌ All retry attempts failed');
    console.error('💡 Browser test worked, so backend is reachable');
    console.error('💡 This is a React Native networking issue');
    throw lastError || new Error('Request failed after multiple attempts');
  }

  // ============================================
  // AUTHENTICATION ENDPOINTS
  // ============================================

  // Send OTP to Student
  async sendStudentOTP(regNo: string): Promise<OTPResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/auth/student/send-otp`, {
        method: 'POST',
        body: JSON.stringify({ regNo }),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
      };
    }
  }

  // Verify Student OTP
  async verifyStudentOTP(regNo: string, otp: string): Promise<LoginResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/auth/student/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ regNo, otp }),
      });
      return {
        success: data.success,
        message: data.message,
        user: this.normalizeUserData(data.student),
        role: 'STUDENT',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to verify OTP',
      };
    }
  }

  // Send OTP to Staff
  async sendStaffOTP(staffCode: string): Promise<OTPResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/auth/staff/send-otp`, {
        method: 'POST',
        body: JSON.stringify({ staffCode }),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
      };
    }
  }

  // Verify Staff OTP
  async verifyStaffOTP(staffCode: string, otp: string): Promise<LoginResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/auth/staff/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ staffCode, otp }),
      });
      return {
        success: data.success,
        message: data.message,
        user: this.normalizeUserData(data.staff),
        role: 'STAFF',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to verify OTP',
      };
    }
  }

  // Send OTP to HOD
  async sendHODOTP(hodCode: string): Promise<OTPResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/auth/hod/send-otp`, {
        method: 'POST',
        body: JSON.stringify({ hodCode }),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
      };
    }
  }

  // Verify HOD OTP
  async verifyHODOTP(hodCode: string, otp: string): Promise<LoginResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/auth/hod/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ hodCode, otp }),
      });
      return {
        success: data.success,
        message: data.message,
        user: this.normalizeUserData(data.hod),
        role: 'HOD',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to verify OTP',
      };
    }
  }

  // Send OTP to HR
  async sendHROTP(hrCode: string): Promise<OTPResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/auth/hr/send-otp`, {
        method: 'POST',
        body: JSON.stringify({ hrCode }),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
      };
    }
  }

  // Verify HR OTP
  async verifyHROTP(hrCode: string, otp: string): Promise<LoginResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/auth/hr/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ hrCode, otp }),
      });
      return {
        success: data.success,
        message: data.message,
        user: this.normalizeUserData(data.hr),
        role: 'HR',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to verify OTP',
      };
    }
  }

  // Send OTP to Security Personnel
  async sendSecurityOTP(securityId: string): Promise<OTPResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/auth/login/security-id`, {
        method: 'POST',
        body: JSON.stringify({ securityId }),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
      };
    }
  }

  // Verify Security OTP
  async verifySecurityOTP(securityId: string, otp: string): Promise<LoginResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/auth/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ securityId, otp }),
      });
      return {
        success: data.success,
        message: data.message,
        user: this.normalizeUserData(data.security),
        role: 'SECURITY',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to verify OTP',
      };
    }
  }

  // ============================================
  // GATE PASS ENDPOINTS
  // ============================================

  // Submit Student Gate Pass Request
  async submitGatePassRequest(requestData: {
    regNo: string;
    purpose: string;
    reason: string;
    requestDate: string;
  }): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/gate-pass/student/submit`, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to submit gate pass request',
      };
    }
  }

  // Submit Staff Gate Pass Request
  async submitStaffGatePassRequest(requestData: {
    staffCode: string;
    purpose: string;
    reason: string;
    requestDate: string;
    attachmentUri?: string;
  }): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/gate-pass/staff/submit`, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to submit gate pass request',
      };
    }
  }

  // Get Student Gate Pass Requests
  async getStudentGatePassRequests(regNo: string): Promise<ApiResponse<GatePassRequest[]>> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/gate-pass/student/${regNo}`, {
        method: 'GET',
      });
      // Backend returns { success, requests: [...] }
      return {
        success: data.success || true,
        message: data.message || 'Requests fetched successfully',
        data: data.requests || [],
      };
    } catch (error: any) {
      console.error('❌ Error fetching student gate pass requests for:', regNo, error);
      return {
        success: false,
        message: error.message || 'Failed to fetch gate pass requests',
        data: [],
      };
    }
  }

  // Get User Entry History
  async getUserEntryHistory(userId: string): Promise<any[]> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/entry-exit/history/${userId}`, {
        method: 'GET',
      });
      // Backend returns { success, data: [...] }
      return data.data || data.history || [];
    } catch (error: any) {
      console.error('❌ Error getting user entry history for:', userId, error);
      return [];
    }
  }

  // Get Staff Pending Requests
  async getStaffPendingRequests(staffCode: string): Promise<ApiResponse<GatePassRequest[]>> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/gate-pass/staff/${staffCode}/pending`, {
        method: 'GET',
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch pending requests',
        data: [],
      };
    }
  }

  // Approve Gate Pass by Staff
  async approveGatePassByStaff(staffCode: string, requestId: number): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/gate-pass/staff/${staffCode}/approve/${requestId}`, {
        method: 'POST',
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to approve gate pass',
      };
    }
  }

  // Reject Gate Pass by Staff
  async rejectGatePassByStaff(staffCode: string, requestId: number, reason: string): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/gate-pass/staff/${staffCode}/reject/${requestId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to reject gate pass',
      };
    }
  }

  // Get Staff Own Gate Pass Requests
  async getStaffOwnGatePassRequests(staffCode: string): Promise<ApiResponse<GatePassRequest[]>> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/gate-pass/staff/${staffCode}/own`, {
        method: 'GET',
      });
      return {
        success: data.success || true,
        message: data.message || 'Requests fetched successfully',
        data: data.requests || [],
      };
    } catch (error: any) {
      console.error('❌ Error fetching staff own gate pass requests for:', staffCode, error);
      return {
        success: false,
        message: error.message || 'Failed to fetch own gate pass requests',
        data: [],
      };
    }
  }

  // Get All Staff Requests (for approval)
  async getAllStaffRequests(staffCode: string): Promise<ApiResponse<GatePassRequest[]>> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/gate-pass/staff/${staffCode}/all`, {
        method: 'GET',
      });
      return {
        success: data.success || true,
        message: data.message || 'Requests fetched successfully',
        data: data.requests || [],
      };
    } catch (error: any) {
      console.error('❌ Error fetching staff requests for:', staffCode, error);
      return {
        success: false,
        message: error.message || 'Failed to fetch staff requests',
        data: [],
      };
    }
  }

  // Get All HOD Requests
  async getAllHODRequests(hodCode: string): Promise<ApiResponse<GatePassRequest[]>> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/gate-pass/hod/${hodCode}/all`, {
        method: 'GET',
      });
      return {
        success: data.success || true,
        message: data.message || 'Requests fetched successfully',
        data: data.requests || [],
      };
    } catch (error: any) {
      console.error('❌ Error fetching HOD requests for:', hodCode, error);
      return {
        success: false,
        message: error.message || 'Failed to fetch HOD requests',
        data: [],
      };
    }
  }

  // Approve Gate Pass by HOD
  async approveGatePassByHOD(hodCode: string, requestId: number): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/gate-pass/hod/${hodCode}/approve/${requestId}`, {
        method: 'POST',
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to approve gate pass',
      };
    }
  }

  // Reject Gate Pass by HOD
  async rejectGatePassByHOD(hodCode: string, requestId: number, reason: string): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/gate-pass/hod/${hodCode}/reject/${requestId}`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to reject gate pass',
      };
    }
  }

  // Get Gate Pass QR Code
  async getGatePassQRCode(requestId: number, userCode: string, isStaff: boolean = false): Promise<ApiResponse> {
    try {
      const endpoint = isStaff 
        ? `${this.baseURL}/gate-pass/staff/${userCode}/qr/${requestId}`
        : `${this.baseURL}/gate-pass/student/qr/${requestId}`;
      
      const data = await this.makeRequest(endpoint, {
        method: 'GET',
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch QR code',
      };
    }
  }

  // ============================================
  // GROUP/BULK PASS ENDPOINTS
  // ============================================

  // Create Bulk Gate Pass
  async createBulkGatePass(requestData: {
    staffCode: string;
    purpose: string;
    reason: string;
    exitDateTime: string;
    returnDateTime: string;
    students: string[];
    includeStaff?: boolean;
  }): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/staff/bulk-gatepass/create`, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create bulk gate pass',
      };
    }
  }

  // Get Students by Staff Department
  async getStudentsByStaffDepartment(staffCode: string): Promise<ApiResponse<Student[]>> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/staff/${staffCode}/students`, {
        method: 'GET',
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch students',
        data: [],
      };
    }
  }

  // ============================================
  // SECURITY SCAN ENDPOINTS
  // ============================================

  // Scan QR Code
  async scanQRCode(qrData: string, scannedBy: string): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/scan-qr`, {
        method: 'POST',
        body: JSON.stringify({ qrData, scannedBy }),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to scan QR code',
      };
    }
  }

  // Scan QR Code for Entry
  async scanQREntry(qrData: string, scannedBy: string): Promise<ApiResponse> {
    try {
      console.log('🚀 [API] scanQREntry called');
      console.log('📦 [API] QR Data:', qrData);
      console.log('👤 [API] Scanned By:', scannedBy);
      console.log('📍 [API] URL:', `${this.baseURL}/security/scan-qr`);
      
      const data = await this.makeRequest(`${this.baseURL}/security/scan-qr`, {
        method: 'POST',
        body: JSON.stringify({ qrData, scannedBy, type: 'ENTRY' }),
      });
      
      console.log('✅ [API] scanQREntry response:', data);
      return data;
    } catch (error: any) {
      console.error('❌ [API] scanQREntry error:', error);
      return {
        success: false,
        message: error.message || 'Failed to scan QR code for entry',
      };
    }
  }

  // Scan QR Code for Exit
  async scanQRExit(qrData: string, scannedBy: string): Promise<ApiResponse> {
    try {
      console.log('🚀 [API] scanQRExit called');
      console.log('📦 [API] QR Data:', qrData);
      console.log('👤 [API] Scanned By:', scannedBy);
      console.log('📍 [API] URL:', `${this.baseURL}/security/scan-qr`);
      
      const data = await this.makeRequest(`${this.baseURL}/security/scan-qr`, {
        method: 'POST',
        body: JSON.stringify({ qrData, scannedBy, type: 'EXIT' }),
      });
      
      console.log('✅ [API] scanQRExit response:', data);
      return data;
    } catch (error: any) {
      console.error('❌ [API] scanQRExit error:', error);
      return {
        success: false,
        message: error.message || 'Failed to scan QR code for exit',
      };
    }
  }

  // Get Scan History
  async getScanHistory(securityId?: string): Promise<ApiResponse> {
    try {
      // Backend endpoint doesn't use securityId parameter
      const data = await this.makeRequest(`${this.baseURL}/security/scan-history`, {
        method: 'GET',
      });
      // Backend returns array directly, wrap it
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
        message: 'Scan history fetched successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch scan history',
        data: [],
      };
    }
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  // Get Notifications
  async getNotifications(userId: string): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/notifications/${userId}`, {
        method: 'GET',
      });
      return {
        success: true,
        message: 'Notifications fetched successfully',
        data: data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch notifications',
        data: [],
      };
    }
  }

  // Mark Notification as Read
  async markNotificationAsRead(notificationId: number): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/notification/${notificationId}/mark-read`, {
        method: 'POST',
      });
      return {
        success: true,
        message: 'Notification marked as read',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to mark notification as read',
      };
    }
  }

  // Mark All Notifications as Read
  async markAllNotificationsAsRead(userId: string): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/notifications/${userId}/mark-all-read`, {
        method: 'POST',
      });
      return {
        success: true,
        message: 'All notifications marked as read',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to mark all notifications as read',
      };
    }
  }

  // Clear All Notifications
  async clearAllNotifications(userId: string): Promise<ApiResponse> {
    try {
      // Note: Backend doesn't have clear-all endpoint, so we'll mark all as read instead
      const data = await this.makeRequest(`${this.baseURL}/security/notifications/${userId}/mark-all-read`, {
        method: 'POST',
      });
      return {
        success: true,
        message: 'All notifications cleared',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to clear all notifications',
      };
    }
  }

  // ============================================
  // ACTIVE PERSONS (Security Dashboard)
  // ============================================

  // Get Active Persons
  async getActivePersons(): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/active-persons`, {
        method: 'GET',
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch active persons',
        data: [],
      };
    }
  }

  // Record Manual Exit
  async recordManualExit(exitData: {
    qrCode: string;
    personName: string;
    personType: string;
    purpose: string;
    status: string;
    scanLocation: string;
    scannedBy: string;
    securityId: string;
  }): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/record-scan`, {
        method: 'POST',
        body: JSON.stringify(exitData),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to record manual exit',
      };
    }
  }

  // ============================================
  // VISITOR REGISTRATION
  // ============================================

  // Register Visitor
  async registerVisitor(visitorData: {
    name: string;
    phone: string;
    email: string;
    department: string;
    personToMeet: string;
    purpose: string;
    numberOfPeople: number;
    vehicleNumber: string | null;
  }): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/visitors`, {
        method: 'POST',
        body: JSON.stringify(visitorData),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to register visitor',
      };
    }
  }

  // Get Departments
  async getDepartments(): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/departments`, {
        method: 'GET',
      });
      // Backend returns array directly, wrap it in success response
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
        message: 'Departments fetched successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch departments',
        data: [],
      };
    }
  }

  // Get Staff by Department
  async getStaffByDepartment(deptCode: string): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/staff-and-hods/department/${deptCode}`, {
        method: 'GET',
      });
      // Backend returns array directly, wrap it in success response
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
        message: 'Staff members fetched successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch staff members',
        data: [],
      };
    }
  }

  // ============================================
  // HOD CONTACTS
  // ============================================

  // Get HOD Contacts
  async getHODContacts(): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/hods`, {
        method: 'GET',
      });
      // Backend returns array directly, wrap it in success response
      return {
        success: true,
        data: Array.isArray(data) ? data : [],
        message: 'HOD contacts fetched successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch HOD contacts',
        data: [],
      };
    }
  }

  // ============================================
  // SCAN HISTORY (Enhanced)
  // ============================================

  // Get Complete Scan History
  async getCompleteScanHistory(): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/scan-history`, {
        method: 'GET',
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch scan history',
        data: [],
      };
    }
  }

  // Clear Scan History
  async clearScanHistory(): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/scan-history`, {
        method: 'DELETE',
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to clear scan history',
      };
    }
  }

  // Delete Scan Record
  async deleteScanRecord(scanId: number): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/scan-history/${scanId}`, {
        method: 'DELETE',
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete scan record',
      };
    }
  }

  // ============================================
  // VEHICLE MANAGEMENT (Enhanced)
  // ============================================

  // Register Vehicle
  async registerVehicle(vehicleData: {
    licensePlate: string;
    ownerName: string;
    ownerPhone: string;
    ownerType: string;
    vehicleType: string;
    vehicleModel: string;
    vehicleColor: string;
    registeredBy: string;
  }): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/vehicles`, {
        method: 'POST',
        body: JSON.stringify(vehicleData),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to register vehicle',
      };
    }
  }

  // Get Vehicle History
  async getVehicleHistory(): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/vehicles`, {
        method: 'GET',
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch vehicle history',
        data: [],
      };
    }
  }

  // Clear Vehicle History
  async clearVehicleHistory(): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/vehicles`, {
        method: 'DELETE',
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to clear vehicle history',
      };
    }
  }

  // Delete Vehicle Record
  async deleteVehicleRecord(vehicleId: number): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/vehicles/${vehicleId}`, {
        method: 'DELETE',
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete vehicle record',
      };
    }
  }

  // ============================================
  // GROUP PASS SCANNING
  // ============================================

  // Scan Group Pass
  async scanGroupPass(qrData: string, scannedBy: string): Promise<ApiResponse> {
    try {
      const data = await this.makeRequest(`${this.baseURL}/security/scan-group-pass`, {
        method: 'POST',
        body: JSON.stringify({ qrData, scannedBy }),
      });
      return data;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to scan group pass',
      };
    }
  }

  // ============================================
  // PROFILE MANAGEMENT
  // ============================================

  // Update Profile Photo (stored locally via AsyncStorage)
  // This is handled in the component, not via API
}

export const apiService = new ApiService();
