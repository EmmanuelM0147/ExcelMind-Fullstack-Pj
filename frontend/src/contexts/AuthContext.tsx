import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../api/client';
import type { User } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'lecturer' | 'admin';
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for development
const DEMO_USERS = [
  {
    email: 'admin@university.edu',
    password: 'password123',
    user: {
      id: 'admin-demo-id',
      email: 'admin@university.edu',
      name: 'Admin User',
      role: 'admin' as const
    }
  },
  {
    email: 'dr.smith@university.edu',
    password: 'password123',
    user: {
      id: 'lecturer-demo-id',
      email: 'dr.smith@university.edu',
      name: 'Dr. John Smith',
      role: 'lecturer' as const
    }
  },
  {
    email: 'student1@university.edu',
    password: 'password123',
    user: {
      id: 'student-demo-id',
      email: 'student1@university.edu',
      name: 'Student One',
      role: 'student' as const
    }
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        // First check for demo user in localStorage
        const demoUser = localStorage.getItem('demoUser');
        if (demoUser) {
          setUser(JSON.parse(demoUser));
          setIsLoading(false);
          return;
        }

        // Then check Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Get user profile from Supabase
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role
            });
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          localStorage.removeItem('demoUser');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // First try demo users
      const demoUser = DEMO_USERS.find(
        u => u.email === email && u.password === password
      );

      if (demoUser) {
        setUser(demoUser.user);
        localStorage.setItem('demoUser', JSON.stringify(demoUser.user));
        localStorage.setItem('token', 'demo-token-' + demoUser.user.role);
        return { success: true };
      }

      // If not a demo user, try Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          const authUser = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role
          };
          setUser(authUser);
          localStorage.setItem('token', data.session.access_token);
        }
      }

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('demoUser');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}