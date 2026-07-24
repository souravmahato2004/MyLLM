import apiClient from './client';
import type { 
  RegisterPayload, 
  LoginPayload, 
  LoginResponse, 
  GoogleAuthPayload, 
  ResetPasswordPayload, 
  ResetPasswordResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse
} from '../types'; 

export async function sendResetLink(email: string): Promise<ForgotPasswordResponse> {
  // Simulates reset password email request
  console.log(`Simulating reset password email link request for ${email}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ message: 'Reset link sent successfully.' });
    }, 1200);
  });
}

export async function resetPasswordSubmit(code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  // Simulates reset password API call
  console.log(`Simulating reset password with code: ${code} and password length: ${newPassword.length}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Password reset successfully' });
    }, 1500);
  });
}

export const authService = {
  // 1. Sign Up
  async register(payload: RegisterPayload): Promise<{ message: string }> {
    const response = await apiClient.post('/api/auth/register', payload);
    return response.data;
  },

  // 2. Verify Email
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.get(`/api/auth/verify-email?code=${token}`);
    return response.data;
  },

  // 3. Sign In
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await apiClient.post('/api/auth/signin', payload);
    
    // Save token to localStorage on success
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('name', response.data.name);
      localStorage.setItem('email', response.data.email);
    }
    return response.data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    const res = await resetPasswordSubmit(payload.code, payload.newPassword);
    return { message: res.message };
  },

  async sendResetLink(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
    return sendResetLink(payload.email);
  },

  // 4. Google Sign In
  async googleAuth(payload: GoogleAuthPayload): Promise<LoginResponse> {
    const response = await apiClient.post('/api/auth/google', payload);
    if (response.data.token) {
      localStorage.setItem('access_token', response.data.token);
    }
    return response.data;
  },

  // Logout helper
  logout(): void {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }
};