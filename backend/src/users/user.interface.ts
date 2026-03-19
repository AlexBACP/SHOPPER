// src/users/user.interface.ts
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  refresh_token_hash?: string | null;
  created_at: Date;
}