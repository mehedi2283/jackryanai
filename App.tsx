import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ChatPage from './pages/ChatPage';
import DeadDropPage from './pages/DeadDropPage';
import ProtectedRoute from './components/ProtectedRoute';
import { RoutePath, User } from './types';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch profile role in background
  const fetchUserRole = async (uid: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role, username')
        .eq('id', uid)
        .single();
      
      if (data) {
        // Update user with specific role if profile exists
        setUser(prev => prev ? { 
          ...prev, 
          username: data.username || prev.username, 
          role: (data.role as User['role']) || 'user' 
        } : null);
      }
    } catch (error) {
      // If table doesn't exist or error, stay as basic user
      console.warn("Profile fetch skipped");
    }
  };

  useEffect(() => {
    // 1. Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          username: session.user.email || 'Operative',
          role: 'user' // Default to user, upgrade later
        });
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes (Login, Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          username: session.user.email || 'Operative',
          role: 'user'
        });
        fetchUserRole(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
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
          path={RoutePath.CHAT}
          element={
            <ProtectedRoute isAuthenticated={!!user}>
              <Layout onLogout={handleLogout} user={user}>
                <ChatPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path={RoutePath.DEAD_DROP + "/*"}
          element={
            <ProtectedRoute isAuthenticated={!!user}>
              <Layout onLogout={handleLogout} user={user}>
                <DeadDropPage />
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

        <Route path="*" element={<Navigate to={RoutePath.DASHBOARD} replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;