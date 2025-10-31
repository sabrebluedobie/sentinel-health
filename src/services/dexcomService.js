// src/services/dexcomService.js v2.0.0
import axios from 'axios';
import { db } from '@/db';

const DEXCOM_CLIENT_ID = import.meta.env.VITE_DEXCOM_CLIENT_ID;
const DEXCOM_CLIENT_SECRET = import.meta.env.VITE_DEXCOM_CLIENT_SECRET;
const REDIRECT_URI = `${window.location.origin}/auth/dexcom/callback`;

// Use sandbox for development, production for live
const DEXCOM_BASE_URL = import.meta.env.VITE_DEXCOM_ENV === 'production'
  ? 'https://api.dexcom.com'
  : 'https://sandbox-api.dexcom.com';

class DexcomService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.loadTokens();
  }

  // Load tokens from localStorage
  loadTokens() {
    try {
      const tokens = localStorage.getItem('dexcom_tokens');
      if (tokens) {
        const parsed = JSON.parse(tokens);
        this.accessToken = parsed.accessToken;
        this.refreshToken = parsed.refreshToken;
        this.tokenExpiry = new Date(parsed.tokenExpiry);
      }
    } catch (error) {
      console.error('Error loading Dexcom tokens:', error);
    }
  }

  // Save tokens to localStorage
  saveTokens(accessToken, refreshToken, expiresIn) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    localStorage.setItem('dexcom_tokens', JSON.stringify({
      accessToken,
      refreshToken,
      tokenExpiry: this.tokenExpiry.toISOString()
    }));
  }

  // Clear tokens
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem('dexcom_tokens');
  }

  // Initiate OAuth flow
  async initiateAuth() {
    const state = this.generateRandomString(32);
    sessionStorage.setItem('dexcom_oauth_state', state);

    const params = new URLSearchParams({
      client_id: DEXCOM_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'offline_access',
      state: state
    });

    window.location.href = `${DEXCOM_BASE_URL}/v2/oauth2/login?${params.toString()}`;
  }

  // Handle OAuth callback
  async handleCallback(code, state) {
    // Verify state
    const savedState = sessionStorage.getItem('dexcom_oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }
    sessionStorage.removeItem('dexcom_oauth_state');

    // Exchange code for tokens
    const response = await axios.post(
      `${DEXCOM_BASE_URL}/v2/oauth2/token`,
      new URLSearchParams({
        client_id: DEXCOM_CLIENT_ID,
        client_secret: DEXCOM_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        }
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    this.saveTokens(access_token, refresh_token, expires_in);

    // Save connection status to database
    await db.settings.put({
      key: 'dexcom_connected',
      value: true,
      updatedAt: new Date()
    });

    await db.settings.put({
      key: 'dexcom_last_sync',
      value: new Date().toISOString(),
      updatedAt: new Date()
    });

    return true;
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(
        `${DEXCOM_BASE_URL}/v2/oauth2/token`,
        new URLSearchParams({
          client_id: DEXCOM_CLIENT_ID,
          client_secret: DEXCOM_CLIENT_SECRET,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
          redirect_uri: REDIRECT_URI
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          }
        }
      );

      const { access_token, refresh_token, expires_in } = response.data;
      this.saveTokens(access_token, refresh_token, expires_in);

      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokens();
      throw error;
    }
  }

  // Ensure we have a valid access token
  async ensureValidToken() {
    if (!this.accessToken) {
      throw new Error('Not connected to Dexcom');
    }

    // Check if token is expired or will expire in the next 5 minutes
    if (this.tokenExpiry && this.tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000) {
      await this.refreshAccessToken();
    }
  }

  // Fetch glucose data from Dexcom
  async fetchGlucoseData(startDate, endDate) {
    await this.ensureValidToken();

    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });

    const response = await axios.get(
      `${DEXCOM_BASE_URL}/v2/users/self/egvs?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    );

    return response.data.egvs || [];
  }

  // Sync glucose data to local database
  async syncGlucoseData() {
    try {
      await this.ensureValidToken();

      // Get last sync time
      const lastSyncSetting = await db.settings.get('dexcom_last_sync');
      const lastSync = lastSyncSetting?.value 
        ? new Date(lastSyncSetting.value)
        : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago

      const endDate = new Date();
      
      // Fetch data from Dexcom
      const glucoseData = await this.fetchGlucoseData(lastSync, endDate);

      let recordsAdded = 0;

      // Store in database
      for (const reading of glucoseData) {
        const timestamp = new Date(reading.systemTime);
        
        await db.glucoseReadings.put({
          timestamp: timestamp,
          value: reading.value,
          unit: 'mg/dL',
          trend: reading.trend,
          source: 'dexcom',
          rawData: reading,
          syncedAt: new Date()
        });

        recordsAdded++;
      }

      // Update last sync time
      await db.settings.put({
        key: 'dexcom_last_sync',
        value: endDate.toISOString(),
        updatedAt: new Date()
      });

      return {
        success: true,
        recordsAdded,
        lastSync: endDate
      };
    } catch (error) {
      console.error('Error syncing glucose data:', error);
      throw error;
    }
  }

  // Check connection status
  async checkConnection() {
    const connected = await db.settings.get('dexcom_connected');
    const lastSyncSetting = await db.settings.get('dexcom_last_sync');

    return {
      connected: connected?.value === true && !!this.accessToken,
      lastSync: lastSyncSetting?.value ? new Date(lastSyncSetting.value) : null
    };
  }

  // Disconnect
  async disconnect() {
    this.clearTokens();
    
    await db.settings.put({
      key: 'dexcom_connected',
      value: false,
      updatedAt: new Date()
    });

    return true;
  }

  // Utility: Generate random string
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const dexcomService = new DexcomService();