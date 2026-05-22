export interface User {
  id:                  string;
  name:                string;
  email:               string;
  password_hash?:      string | null;  // null para cuentas OAuth puras
  role:                string;
  refresh_token_hash?: string | null;
  oauth_provider?:     string | null;
  oauth_id?:           string | null;
  created_at:          Date;
  updated_at?:         Date;
}
