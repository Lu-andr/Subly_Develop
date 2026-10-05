// TrialGuard — Auth Hook
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { handleAuthLink } from '../lib/authLinks';
import { cancelAllTrialNotifications } from '../services/notificationService';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { analytics } from '../services/analyticsService';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  isPasswordRecovery: boolean;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  completePasswordRecovery: () => void;
}

function useAuthState(): AuthState & AuthActions {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setPasswordRecovery] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeUserId = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!profileError && data && activeUserId.current === userId) {
        setProfile(data as Profile);
        analytics.identify(userId);
      }
    } catch (e) {
      console.warn('Failed to fetch profile:', e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const applySession = (s: Session | null) => {
      if (!mounted) return;
      if (activeUserId.current !== (s?.user.id ?? null)) setProfile(null);
      activeUserId.current = s?.user.id ?? null;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        // Run outside Supabase's synchronous auth callback lock.
        setTimeout(() => { if (mounted) void fetchProfile(s.user.id); }, 0);
      } else {
        setProfile(null);
        setPasswordRecovery(false);
        analytics.reset();
      }
    };
    supabase.auth.getSession().then(({ data, error }) => {
      if (error && mounted) setError('Unable to restore your session. Please sign in again.');
      applySession(data.session);
    }).catch(() => { if (mounted) setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      applySession(s);
    });
    const handleUrl = (url: string) => {
      handleAuthLink(url).then((recovery) => { if (recovery && mounted) setPasswordRecovery(true); })
        .catch(() => Alert.alert('Sign-in link', 'This link is invalid or expired. Request a new link.'));
    };
    const links = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    void Linking.getInitialURL().then((url) => { if (url && mounted) handleUrl(url); });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
    if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
    return () => { mounted = false; activeUserId.current = null; subscription.unsubscribe(); links.remove(); appState.remove(); supabase.auth.stopAutoRefresh(); };
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError) throw signInError;
    } catch (e: any) {
      setError(e.message ?? 'Sign in failed. Please try again.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: 'subly://auth/callback',
        },
      });
      if (signUpError) throw signUpError;
    } catch (e: any) {
      setError(e.message ?? 'Sign up failed. Please try again.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
    await cancelAllTrialNotifications();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: 'subly://reset-password' }
    );
    if (resetError) throw new Error(resetError.message);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'subly://auth/callback',
          skipBrowserRedirect: true,
        },
      });
      if (oauthError) throw oauthError;
      if (!data.url) throw new Error('Missing Google sign-in URL');
      const response = await WebBrowser.openAuthSessionAsync(data.url, 'subly://auth/callback');
      if (response.type === 'success') await handleAuthLink(response.url);
    } catch (e: any) {
      setError(e.message ?? 'Google sign in failed.');
      throw e;
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user?.id) throw new Error('No authenticated user');
    setLoading(true);
    try {
      // The server validates the caller and deletes auth.users; database cascades remove records.
      const { data, error: deletionError } = await supabase.functions.invoke('delete-account', { body: {} });
      if (deletionError || !data?.deleted) throw new Error('Account deletion failed. Please try again or contact support.');
      await cancelAllTrialNotifications();
      const { error: logoutError } = await supabase.auth.signOut({ scope: 'local' });
      if (logoutError) console.warn('Local session cleanup failed after account deletion.');
      activeUserId.current = null;
      setSession(null);
      setUser(null);
      setProfile(null);
      analytics.track('account_deleted');
    } catch (e: any) {
      setError(e.message ?? 'Failed to delete account.');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const clearError = useCallback(() => setError(null), []);

  return {
    isPasswordRecovery,
    completePasswordRecovery: () => setPasswordRecovery(false),
    session,
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    deleteAccount,
    refreshProfile,
    clearError,
  };
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();
  return React.createElement(AuthContext.Provider, { value: auth }, children);
}
export function useAuth(): AuthState & AuthActions {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used within AuthProvider');
  return auth;
}
