import apiService from './api';

class AuthService {
  constructor() {
    this.TOKEN_KEY = 'exam_system_token';
    this.REFRESH_TOKEN_KEY = 'exam_system_refresh_token';
    this.USER_KEY = 'exam_system_user';
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  // Token Management
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  removeTokens() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // User Management
  getCurrentUser() {
    const userData = localStorage.getItem(this.USER_KEY);
    try {
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }

  setCurrentUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Authentication Status
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    if (!token || !user) {
      return false;
    }

    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        // Token is expired, try to refresh
        this.refreshToken();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  // Login
  async login(credentials) {
    try {
      const response = await apiService.post('/auth/login', credentials);
      
      if (response.success) {
        const { user, accessToken, refreshToken } = response.data;
        
        this.setTokens(accessToken, refreshToken);
        this.setCurrentUser(user);
        
        // Set up automatic token refresh
        this.setupTokenRefresh();
        
        return {
          success: true,
          user,
          message: 'Login realizado com sucesso!'
        };
      }
      
      return {
        success: false,
        message: response.message || 'Credenciais inválidas'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao fazer login'
      };
    }
  }

  // Register
  async register(userData) {
    try {
      const response = await apiService.post('/auth/register', userData);
      
      if (response.success) {
        return {
          success: true,
          message: 'Conta criada com sucesso! Faça login para continuar.'
        };
      }
      
      return {
        success: false,
        message: response.message || 'Erro ao criar conta'
      };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao criar conta'
      };
    }
  }

  // Logout
  async logout() {
    try {
      const refreshToken = this.getRefreshToken();
      
      if (refreshToken) {
        await apiService.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.removeTokens();
      this.clearTokenRefresh();
      
      // Redirect to login page
      window.location.href = '/login';
    }
  }

  // Refresh Token
  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.logout();
      return false;
    }

    if (this.isRefreshing) {
      // If already refreshing, wait for it to complete
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    this.isRefreshing = true;

    try {
      const response = await apiService.post('/auth/refresh', {
        refreshToken
      });

      if (response.success) {
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        this.setTokens(accessToken, newRefreshToken);
        this.isRefreshing = false;
        
        // Notify all waiting requests
        this.refreshSubscribers.forEach(callback => callback(accessToken));
        this.refreshSubscribers = [];
        
        return accessToken;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      this.isRefreshing = false;
      this.refreshSubscribers = [];
      this.logout();
      return false;
    }
  }

  // Forgot Password
  async forgotPassword(email) {
    try {
      const response = await apiService.post('/auth/forgot-password', { email });
      
      return {
        success: response.success,
        message: response.message || 'Instruções enviadas para seu email'
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao enviar email de recuperação'
      };
    }
  }

  // Reset Password
  async resetPassword(token, password) {
    try {
      const response = await apiService.post('/auth/reset-password', {
        token,
        password
      });
      
      return {
        success: response.success,
        message: response.message || 'Senha redefinida com sucesso'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao redefinir senha'
      };
    }
  }

  // Change Password
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiService.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      return {
        success: response.success,
        message: response.message || 'Senha alterada com sucesso'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao alterar senha'
      };
    }
  }

  // Update Profile
  async updateProfile(profileData) {
    try {
      const response = await apiService.put('/auth/profile', profileData);
      
      if (response.success) {
        const updatedUser = response.data.user;
        this.setCurrentUser(updatedUser);
        
        return {
          success: true,
          user: updatedUser,
          message: 'Perfil atualizado com sucesso'
        };
      }
      
      return {
        success: false,
        message: response.message || 'Erro ao atualizar perfil'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao atualizar perfil'
      };
    }
  }

  // Setup automatic token refresh
  setupTokenRefresh() {
    const token = this.getToken();
    
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime;
      
      // Refresh token 5 minutes before it expires
      const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 60000);
      
      if (refreshTime > 0) {
        this.refreshTimeout = setTimeout(() => {
          this.refreshToken().then(() => {
            this.setupTokenRefresh(); // Setup next refresh
          });
        }, refreshTime);
      }
    } catch (error) {
      console.error('Error setting up token refresh:', error);
    }
  }

  // Clear token refresh timeout
  clearTokenRefresh() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  // Verify Email
  async verifyEmail(token) {
    try {
      const response = await apiService.post('/auth/verify-email', { token });
      
      return {
        success: response.success,
        message: response.message || 'Email verificado com sucesso'
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao verificar email'
      };
    }
  }

  // Resend Verification Email
  async resendVerificationEmail() {
    try {
      const response = await apiService.post('/auth/resend-verification');
      
      return {
        success: response.success,
        message: response.message || 'Email de verificação reenviado'
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        message: error.message || 'Erro ao reenviar email de verificação'
      };
    }
  }

  // Check if user has specific role
  hasRole(role) {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    const user = this.getCurrentUser();
    return user && roles.includes(user.role);
  }

  // Check if user has specific permission
  hasPermission(permission) {
    const user = this.getCurrentUser();
    return user && user.permissions && user.permissions.includes(permission);
  }

  // Get user permissions
  getUserPermissions() {
    const user = this.getCurrentUser();
    return user?.permissions || [];
  }

  // Session management
  extendSession() {
    const token = this.getToken();
    if (token) {
      this.setupTokenRefresh();
    }
  }

  // Initialize auth service
  init() {
    // Setup token refresh if user is already logged in
    if (this.isAuthenticated()) {
      this.setupTokenRefresh();
    }

    // Listen for storage changes (logout from other tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === this.TOKEN_KEY && !e.newValue) {
        // Token was removed in another tab
        this.removeTokens();
        window.location.reload();
      }
    });

    // Extend session on user activity
    const activities = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    let activityTimer;

    const resetActivityTimer = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(() => {
        if (this.isAuthenticated()) {
          this.extendSession();
        }
      }, 30000); // Extend session every 30 seconds of activity
    };

    activities.forEach(activity => {
      document.addEventListener(activity, resetActivityTimer, true);
    });
  }
}

const authService = new AuthService();

// Initialize on import
authService.init();

export default authService;