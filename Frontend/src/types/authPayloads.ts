// Register
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
}

// Verify
export interface VerifyPayload {
  code: string;
}

export interface VerifyResponse {
  message: string;
}

// Signin / Login
export interface SigninPayload {
  email: string;
  password: string;
}

export type LoginPayload = SigninPayload;

export interface SigninResponse {
  token: string;
}

export type LoginResponse = SigninResponse;

export interface GoogleAuthPayload {
  access_token: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  code: string;
  newPassword: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}