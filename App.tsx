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
        // Map database role to application role type
        let userRole: User['role'] = 'user';
        if (data.role === 'grand_admin') userRole = 'grand_admin';
        else if (data.role === 'admin') userRole = 'admin';

        // Upgrade user state with profile data
        setUser({ 
          id: sessionUser.id, 
          username: data.username || sessionUser.email || 'Operative', 
          role: userRole
        });
      } else {
         // Default fallback if profile missing or table doesn't exist yet
         setUser({ 
            id: sessionUser.id, 
            username: sessionUser.email || 'Operative', 
            role: 'user' 
          });
      }
    } catch (err) {
      console.warn('Background profile fetch failed (likely missing table):', err);
      // Ensure user is still set even if profile fetch fails
      setUser((prev) => prev || { 
        id: sessionUser.id, 
        username: sessionUser.email || 'Operative', 
        role: 'user' 
      });
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
           // Optimistic Login: Default to user first
           setUser({ 
             id: session.user.id, 
             username: session.user.email || 'Operative', 
             role: 'user' 
           });
           
           // Fetch profile in background to update username/role
           await fetchProfileAndUpgradeUser(session.user);
        }
      } catch (error) {
        console.error('Error checking auth session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        // Fetch profile immediately to ensure correct role
        await fetchProfileAndUpgradeUser(session.user);
      } else {
        setUser(null);
      }
      
      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      // Always clear local state to ensure UI updates even if network fails
      setUser(null);
    }
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

  const isAuthorizedAdmin = user?.role === 'admin' || user?.role === 'grand_admin';

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
                <DashboardPage user={user} />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path={RoutePath.USERS}
          element={
            <ProtectedRoute isAuthenticated={!!user}>
              {isAuthorizedAdmin ? (
                <Layout onLogout={handleLogout} user={user}>
                  <UsersPage />
                </Layout>
              ) : (
                <Navigate to={RoutePath.DASHBOARD} replace />
              )}
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