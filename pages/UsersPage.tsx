import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, Shield, Users, Loader2, Mail, Calendar, UserCheck, Lock, Crown, Search, X } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { supabase } from '../services/supabase';
import { RoutePath, User } from '../types';

interface Profile {
  id: string;
  username: string;
  role: 'grand_admin' | 'admin' | 'user';
  created_at: string;
}

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchProfiles();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) setCurrentUserEmail(user.email);
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*'); 
      
      if (error) throw error;
      
      if (data) {
        // Map any string from DB to our strict type
        const mappedProfiles: Profile[] = data.map((p: any) => ({
          ...p,
          role: (p.role === 'grand_admin' || p.role === 'admin') ? p.role : 'user'
        }));

        // Sort: Grand Admin > Admin > User, then by creation date descending
        // This sort only happens on initial load
        mappedProfiles.sort((a, b) => {
          const rolePriority = { 'grand_admin': 0, 'admin': 1, 'user': 2 };
          const priorityDiff = rolePriority[a.role] - rolePriority[b.role];
          
          if (priorityDiff !== 0) {
            return priorityDiff;
          }
          
          // Secondary sort: Newest first
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setProfiles(mappedProfiles);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setToast({ message: "Failed to load operative profiles", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUserRedirect = async () => {
    // We set a flag in localStorage because the signout process will trigger 
    // ProtectedRoute to redirect us to /login (losing react-router state).
    localStorage.setItem('jackryan_auth_intent', 'signup');
    await supabase.auth.signOut();
    // No need to navigate manually; App.tsx's auth listener will clear user state, 
    // causing ProtectedRoute to redirect to /login automatically.
  };

  const handleRoleChange = async (profile: Profile, newRole: 'admin' | 'user') => {
    if (profile.role === newRole) return;
    
    if (profile.role === 'grand_admin') {
      setToast({ message: "Security Alert: Grand Administrator privileges cannot be modified.", type: 'error' });
      return;
    }

    if (profile.username === currentUserEmail && newRole === 'user') {
       const confirmDemotion = window.confirm("Warning: You are about to revoke your own administrative privileges. You will lose access to this page immediately. Are you sure?");
       if (!confirmDemotion) return;
    }

    // Optimistic Update - NOTE: We do NOT re-sort here.
    // This ensures the row stays in the same position while the role updates visually.
    setProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, role: newRole } : p));
    
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
      if (error) throw error;
      
      setToast({ 
        message: `Operative ${profile.username} assigned to ${newRole === 'admin' ? 'Administrator' : 'Level 1 Operative'}`, 
        type: 'success' 
      });

      if (profile.username === currentUserEmail && newRole === 'user') {
        navigate(RoutePath.DASHBOARD);
      }

    } catch (err) {
       console.error("Failed to update role", err);
       fetchProfiles(); // Revert by refetching which effectively undoes the optimistic update
       setToast({ message: "Failed to update user privileges.", type: 'error' });
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const query = searchQuery.toLowerCase();
    return (
      profile.username.toLowerCase().includes(query) ||
      profile.role.replace('_', ' ').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Operatives</h1>
          <p className="mt-1 text-gray-500">Manage access and authorized personnel.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
             </div>
             <input 
                type="text" 
                placeholder="Search operatives..." 
                className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 w-full sm:w-64 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
             {searchQuery && (
               <button 
                 onClick={() => setSearchQuery('')}
                 className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
               >
                 <X className="h-3 w-3" />
               </button>
             )}
          </div>
          <Button onClick={() => setIsCreateUserModalOpen(true)} className="whitespace-nowrap">
            <UserPlus className="h-5 w-5 mr-2" />
            Register New Operative
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Retrieving personnel records...</p>
          </div>
        ) : filteredProfiles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Identity
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role & Access
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProfiles.map((profile) => {
                  const isGrandAdmin = profile.role === 'grand_admin';
                  const isCurrentUser = profile.username === currentUserEmail;
                  const isAdmin = profile.role === 'admin';

                  return (
                    <tr key={profile.id} className={`hover:bg-gray-50/50 transition-colors group ${isCurrentUser ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm transition-colors ${isGrandAdmin ? 'bg-gradient-to-br from-amber-400 to-orange-600' : isAdmin ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gray-400'}`}>
                              {isGrandAdmin ? <Crown className="h-5 w-5 text-white" /> : (profile.username || 'U').charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {profile.username}
                              {isCurrentUser && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold border border-indigo-200">YOU</span>}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center mt-0.5">
                              <Mail className="h-3 w-3 mr-1" />
                              {(isGrandAdmin || isAdmin) 
                                ? (profile.username.includes('@') ? 'Email Verified' : 'System ID') 
                                : 'Operative Identity'
                              }
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isGrandAdmin ? (
                           <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 shadow-sm transition-all duration-300">
                             <Crown className="h-3 w-3 mr-1" />
                             Grand Administrator
                           </span>
                        ) : (
                           <div
                             className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-medium border shadow-sm transition-all duration-500 ease-out whitespace-nowrap overflow-hidden ${
                                isAdmin 
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                  : 'bg-white text-gray-600 border-gray-200'
                             }`}
                             style={{ width: isAdmin ? '128px' : '105px' }}
                           >
                             {isAdmin ? <Shield className="h-3 w-3 mr-1.5 flex-shrink-0" /> : <UserCheck className="h-3 w-3 mr-1.5 flex-shrink-0" />}
                             <span className="relative top-[0.5px] transition-all duration-300">
                                {isAdmin ? 'Administrator' : 'Operative'}
                             </span>
                           </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                          {new Date(profile.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         {isGrandAdmin ? (
                            <div className="flex items-center justify-end text-gray-300 cursor-not-allowed group/lock" title="Grand Administrator privileges cannot be revoked">
                              <span className="text-xs font-semibold mr-2 uppercase tracking-wide opacity-0 group-hover/lock:opacity-100 transition-opacity text-amber-600/50">
                                Protected
                              </span>
                              <Lock className="h-5 w-5 text-amber-200/50" />
                            </div>
                         ) : (
                           <div className="flex justify-end">
                             <div 
                                onClick={() => handleRoleChange(profile, isAdmin ? 'user' : 'admin')}
                                className="relative flex items-center w-72 h-12 p-[3px] rounded-2xl cursor-pointer bg-zinc-100/80 hover:bg-zinc-200/50 transition-colors border border-zinc-200/50 select-none group/switch shadow-sm"
                              >
                                {/* Sliding Pill with Dynamic Width Animation */}
                                <div 
                                  className="absolute top-[3px] bottom-[3px] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/5 transition-all duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)"
                                  style={{
                                    left: isAdmin ? 'calc(45% + 2px)' : '3px',
                                    width: isAdmin ? 'calc(55% - 5px)' : 'calc(45% - 5px)'
                                  }}
                                ></div>

                                {/* Operative Option (Left) */}
                                <div className={`relative z-10 w-[45%] flex items-center justify-center gap-2.5 transition-colors duration-300 ${!isAdmin ? 'text-zinc-800' : 'text-zinc-400 group-hover/switch:text-zinc-500'}`}>
                                  <UserCheck className={`h-4 w-4 ${!isAdmin ? 'stroke-[2.5px]' : ''}`} />
                                  <span className="text-[11px] font-bold uppercase tracking-wider">Operative</span>
                                </div>

                                {/* Administrator Option (Right) */}
                                <div className={`relative z-10 w-[55%] flex items-center justify-center gap-2.5 transition-colors duration-300 ${isAdmin ? 'text-indigo-700' : 'text-zinc-400 group-hover/switch:text-zinc-500'}`}>
                                  <Shield className={`h-4 w-4 ${isAdmin ? 'stroke-[2.5px]' : ''}`} />
                                  <span className="text-[11px] font-bold uppercase tracking-wider">Administrator</span>
                                </div>
                              </div>
                           </div>
                         )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No Operatives Found</h3>
            <p className="text-gray-500 max-w-sm mt-2">
              {searchQuery ? `No matches for "${searchQuery}".` : "The directory is empty. Register a new operative to begin."}
            </p>
            {searchQuery && (
              <Button variant="secondary" onClick={() => setSearchQuery('')} className="mt-4">
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={isCreateUserModalOpen} onClose={() => setIsCreateUserModalOpen(false)} title="Register New Operative">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
             <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
             <div className="ml-3 text-sm text-amber-800">
               <p className="font-semibold mb-1">Session Termination Required</p>
               <p>To ensure cryptographic integrity, creating a new identity requires the current active session to be terminated.</p>
             </div>
          </div>
          <p className="text-gray-600 text-sm">You will be signed out and redirected to the secure registration portal.</p>
          <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100 mt-2">
            <Button variant="secondary" onClick={() => setIsCreateUserModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateUserRedirect}>Proceed to Registration</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;