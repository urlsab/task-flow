export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  token: string;
}

export interface AdminUser {
  id: number;
  username: string;
  fullName: string;
  createdAt: string;
}

export interface AdminCreateUserRequest {
  username: string;
  password: string;
  fullName: string;
}
