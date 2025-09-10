import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, auth } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on app load
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await handleUserSession(session);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        if (event === 'SIGNED_IN' && session && !user) {
          await handleUserSession(session);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = async (session: Session) => {
    try {
      const supabaseUser = session.user;
      console.log('Handling user session:', supabaseUser.email);
      
      // Load user profile from database - query specific user with timeout
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', supabaseUser.id)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      );
      
      const { data: userProfile, error: usersError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;
      
      if (!usersError && userProfile) {
        console.log('✅ User profile found in database:', userProfile);
        
        // Create user from database profile
        const user: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          firstName: userProfile.first_name || '',
          lastName: userProfile.last_name || '',
          city: userProfile.city || '',
          evu: userProfile.evu || '',
          role: userProfile.role as 'user' | 'editor' | 'admin',
          level: 1,
          xp: 0,
          streak: 0,
          privacySettings: {
            showOnLeaderboard: true,
            allowAnalytics: true,
          },
          createdAt: supabaseUser.created_at,
          updatedAt: userProfile.updated_at || supabaseUser.created_at,
        };
        
        setUser(user);
        console.log('User profile loaded from database successfully:', user);
        return;
      }
      
      console.log('No profile found in database or timeout, using fallback');
      
      // Fallback: Set user with basic data
      const user: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        firstName: supabaseUser.user_metadata?.first_name || '',
        lastName: supabaseUser.user_metadata?.last_name || '',
        city: supabaseUser.user_metadata?.city || '',
        evu: supabaseUser.user_metadata?.evu || '',
        role: supabaseUser.email === 'pw@patrikwalde.com' ? 'admin' : 'user',
        level: 1,
        xp: 0,
        streak: 0,
        privacySettings: {
          showOnLeaderboard: true,
          allowAnalytics: true,
        },
        createdAt: supabaseUser.created_at,
        updatedAt: supabaseUser.updated_at || supabaseUser.created_at,
      };
      
      setUser(user);
      console.log('Fallback user set successfully:', user);
    } catch (error) {
      console.error('Error handling user session:', error);
      // Even on error, set a basic user to prevent infinite loading
      const fallbackUser: User = {
        id: session.user.id,
        email: session.user.email || '',
        firstName: '',
        lastName: '',
        city: '',
        evu: '',
        role: session.user.email === 'pw@patrikwalde.com' ? 'admin' : 'user',
        level: 1,
        xp: 0,
        streak: 0,
        privacySettings: {
          showOnLeaderboard: true,
          allowAnalytics: true,
        },
        createdAt: session.user.created_at,
        updatedAt: session.user.created_at,
      };
      setUser(fallbackUser);
      setIsLoading(false);
      console.log('Emergency fallback user set:', fallbackUser);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await auth.signIn(email, password);
      
      if (error) {
        throw new Error(error.message || 'Login failed');
      }
      
      if (data.user) {
        console.log('Login successful:', data.user.email);
        // The session will be handled by onAuthStateChange
        // Don't set isLoading to false here - let onAuthStateChange handle it
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false); // Only set to false on error
      throw error;
    }
    // Remove finally block - let onAuthStateChange handle loading state
  };

  const register = async (email: string, password: string, userData?: { firstName: string; lastName: string; city: string; evu?: string }) => {
    setIsLoading(true);
    try {
      const { data, error } = await auth.signUp(email, password);
      
      if (error) {
        throw new Error(error.message || 'Registration failed');
      }
      
      if (data.user && userData) {
        console.log('Registration successful:', data.user.email);
        
        // Create user profile in database (EXACT same as admin uses)
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            auth_user_id: data.user.id,
            first_name: userData.firstName,
            last_name: userData.lastName,
            city: userData.city,
            evu: userData.evu || '',
            role: 'user'
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't throw here, user is still created in auth
        } else {
          console.log('User profile created in database (same as admin)');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      try {
        // Update user profile in database (same as admin uses)
        const { error } = await supabase
          .from('user_profiles')
          .update({
            first_name: userData.firstName || user.firstName,
            last_name: userData.lastName || user.lastName,
            city: userData.city || user.city,
            evu: userData.evu || user.evu,
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', user.id);

        if (error) {
          console.error('Error updating user profile:', error);
          throw error;
        }

        // Update local state
        setUser({ ...user, ...userData });
        console.log('User profile updated in database (same as admin)');
      } catch (error) {
        console.error('Error updating user:', error);
        // Fallback: update local state only
        setUser({ ...user, ...userData });
        console.log('User data updated locally (fallback)');
      }
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.role === 'admin',
    loading: isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
