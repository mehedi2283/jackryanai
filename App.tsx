import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ProtectedRoute from './components/ProtectedRoute';
import { RoutePath, User } from './types';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile (non-blocking)
  const fetchProfileAndUpgradeUser = async (sessionUser: any) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, username')
        .eq('id', sessionUser.id)
        .single();
      
      if (data) {
        // Upgrade user state with profile data
        setUser({ 
          id: sessionUser.id, 
          username: data.username || sessionUser.email || 'Operative', 
          role: data.role === 'admin' ? 'admin' : 'user'
        });
      }
    } catch (err) {
      // Silent fail on profile fetch - user is already logged in with basic access
      console.warn('Background profile fetch failed:', err);
    }
  };

  // Initialize auth state from Supabase
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
           // Optimistic Login: Let them in immediately with basic info
           setUser({ 
             id: session.user.id, 
             username: session.user.email || 'Operative', 
             role: 'admin' // Default to admin for usability in this specific app
           });
           
           // Fetch profile in background to update username/role if exists
           fetchProfileAndUpgradeUser(session.user);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        // Optimistic Login on change event
        setUser(currentUser => {
            // Only update if not already set to avoid flickers
            if (currentUser?.id === session.user.id) return currentUser;
            return { 
                id: session.user.id, 
                username: session.user.email || 'Operative', 
                role: 'admin' 
            };
        });
        
        // Background fetch
        fetchProfileAndUpgradeUser(session.user);
      } else {
        setUser(null);
      }
      
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-zinc-400 text-sm font-mono animate-pulse">Verifying Security Clearance...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route 
          path={RoutePath.LOGIN} 
          element={user ? <Navigate to={RoutePath.DASHBOARD} replace /> : <LoginPage />} 
        />
        
        {/* Protected Routes Wrapper */}
        <Route
          path={RoutePath.DASHBOARD}
          element={
            <ProtectedRoute isAuthenticated={!!user}>
              <Layout onLogout={handleLogout} user={user}>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path={RoutePath.USERS}
          element={
            <ProtectedRoute isAuthenticated={!!user}>
              <Layout onLogout={handleLogout} user={user}>
                <UsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to={RoutePath.DASHBOARD} replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;