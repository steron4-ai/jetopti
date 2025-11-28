// src/lib/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  // Check active session on mount
  useEffect(() => {
    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if user is logged in
  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadProfile(user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load user profile from database
  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null); // wichtig, damit keine alten Daten hängen bleiben
    }
  };

  // Sign up new user
  const signUp = async (email, password, userData = {}) => {
    try {
      // Rolle normalisieren
      const role =
        userData.role === 'charter_company' ? 'charter_company' : 'customer';

      // Charterfirma muss erst freigeschaltet werden, Kunde ist direkt aktiv
      const isApproved = role === 'charter_company' ? false : true;

      // 1) Supabase Auth: User anlegen + Metadaten
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
          data: {
            ...userData,
            role,
            is_approved: isApproved,
          },
        },
      });

      if (error) throw error;

      // 2) Profil in unserer "profiles"-Tabelle anlegen
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              role,
              company_name: userData.company_name || null,
              phone: userData.phone || null,
              is_approved: isApproved,
              first_name: userData.first_name || null,
              last_name: userData.last_name || null,
            },
          ]);

        if (profileError) throw profileError;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { data: null, error };
    }
  };

  // Sign in existing user
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      return { error: null };
    } catch (error) {
      console.error('Logout error:', error);
      return { error };
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAuthenticated: !!user,

    // praktische Flags für UI
    isCharterCompany: profile?.role === 'charter_company',
    isApprovedCompany:
      profile?.role === 'charter_company' && profile?.is_approved === true,
    isCustomer: profile?.role === 'customer',
    isAdmin: profile?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
