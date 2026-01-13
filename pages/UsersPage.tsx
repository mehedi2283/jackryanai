import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, AlertCircle, Shield, Users, Loader2, Mail, Calendar, UserCheck } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { supabase } from '../services/supabase';
import { RoutePath } from '../types';

interface Profile {
  id: string;
  username: string;
  role: string;
  created_at: string;
}

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setProfiles(data);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUserRedirect = async () => {
    await supabase.auth.signOut();
    navigate(RoutePath.LOGIN, { state: { mode: 'signup' } });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Operatives</h1>
          <p className="mt-1 text-gray-500">Manage access and authorized personnel.</p>
        </div>
        <div>
          <Button onClick={() => setIsCreateUserModalOpen(true)}>
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
        ) : profiles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Identity
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Clearance Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                            {(profile.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{profile.username}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-0.5">
                            <Mail className="h-3 w-3 mr-1" />
                            {profile.username.includes('@') ? 'Email Verified' : 'System ID'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {profile.role === 'admin' ? (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                           <Shield className="h-3 w-3 mr-1" />
                           Admin
                         </span>
                      ) : (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                           <UserCheck className="h-3 w-3 mr-1" />
                           Operative
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                        {new Date(profile.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <span className="text-emerald-600 flex items-center justify-end">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
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
              The directory is empty. Register a new operative to begin.
            </p>
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