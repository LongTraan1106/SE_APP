import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@study_helper_access_token',
  REFRESH_TOKEN: '@study_helper_refresh_token',
  USER_DATA: '@study_helper_user_data',
};

class StorageService {
  /**
   * Lưu access token
   */
  async saveAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Error saving access token:', error);
      throw error;
    }
  }

  /**
   * Lấy access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Lưu refresh token
   */
  async saveRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Error saving refresh token:', error);
      throw error;
    }
  }

  /**
   * Lấy refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Lưu user data
   */
  async saveUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  /**
   * Lấy user data
   */
  async getUserData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Xóa tất cả auth data (logout)
   */
  async clearAuthData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả auth data
   */
  async getAllAuthData(): Promise<{
    accessToken: string | null;
    refreshToken: string | null;
    userData: any | null;
  }> {
    try {
      const [accessToken, refreshToken, userData] = await AsyncStorage.multiGet([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);

      return {
        accessToken: accessToken[1],
        refreshToken: refreshToken[1],
        userData: userData[1] ? JSON.parse(userData[1]) : null,
      };
    } catch (error) {
      console.error('Error getting all auth data:', error);
      return {
        accessToken: null,
        refreshToken: null,
        userData: null,
      };
    }
  }
}

export const storageService = new StorageService();
