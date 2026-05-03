// API Configuration
const API_URL = 'https://api.mealsretrieval.site';

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface SignUpResponse {
  success: boolean;
  message: string;
  data?: UserResponse;
}

export interface SignInResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserResponse;
    tokens: TokenResponse;
  };
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data?: TokenResponse;
}

class AuthService {
  /**
   * Sign Up - Tạo tài khoản mới
   * Constraints:
   * - username: 3-20 chars, only a-z, A-Z, 0-9, _
   * - email: must be @gmail.com
   * - password: min 6 chars, must have 1 uppercase + 1 number
   */
  async signUp(request: SignUpRequest): Promise<SignUpResponse> {
    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: request.username,
          email: request.email,
          password: request.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Sign up failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sign In - Đăng nhập
   * Note: Sign In uses EMAIL, not username
   */
  async signIn(request: SignInRequest): Promise<SignInResponse> {
    try {
      const response = await fetch(`${API_URL}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: request.email,
          password: request.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Sign in failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh Token - Cấp access token mới
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Token refresh failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Health Check - Kiểm tra API availability
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const authService = new AuthService();
