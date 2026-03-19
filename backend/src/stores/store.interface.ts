// src/stores/store.interface.ts
export interface Store {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  theme?: Record<string, any>;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}