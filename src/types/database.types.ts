
/**
 * This file contains TypeScript definitions for our database schema.
 * These types would correspond to the tables in Supabase and help
 * with type safety when interacting with the database.
 */

export interface User {
  id: string;
  email: string;
  created_at: string;
  full_name: string;
  avatar_url?: string;
  phone_number?: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface Receipt {
  id: string;
  user_id: string;
  vendor: string;
  amount: number;
  date: string;
  due_date?: string;
  category: string;
  payment_status: 'paid' | 'pending' | 'overdue';
  notes?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  receipt_id: string;
  type: 'email' | 'sms' | 'push';
  notify_date: string;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  phone_number?: string;
  notify_days_before: number;
  notify_by: string[];
  push_token?: string;
}

// Database schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      receipts: {
        Row: Receipt;
        Insert: Omit<Receipt, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Receipt, 'id' | 'created_at' | 'updated_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: UserPreferences;
        Update: Partial<UserPreferences>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          id: string;
          name: string;
          public: boolean;
        };
        Insert: {
          id: string;
          name: string;
          public: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          public?: boolean;
        };
      };
      objects: {
        Row: {
          id: string;
          bucket_id: string;
          name: string;
          owner: string | null;
          created_at: string;
          updated_at: string | null;
          last_accessed_at: string | null;
          metadata: any | null;
        };
        Insert: {
          id?: string;
          bucket_id: string;
          name: string;
          owner?: string | null;
          created_at?: string;
          updated_at?: string | null;
          last_accessed_at?: string | null;
          metadata?: any | null;
        };
        Update: {
          id?: string;
          bucket_id?: string;
          name?: string;
          owner?: string | null;
          created_at?: string;
          updated_at?: string | null;
          last_accessed_at?: string | null;
          metadata?: any | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
