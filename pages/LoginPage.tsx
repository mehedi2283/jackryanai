import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, Lock, Fingerprint, ChevronRight, AlertTriangle, UserPlus, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import { supabase } from '../services/supabase';
import { RoutePath } from '../types';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if redirected from Dashboard for creation
    if (location.state?.mode === 'signup') {
      setIsSignUp(true);
    }
  }, [location]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Handle User Creation
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          setSuccessMessage('Identity established. You may now log in with your credentials.');
          setIsSignUp(false);
          setEmail('');
          setPassword('');
        }
      } else {
        // Handle Login
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (!data.session) {
          throw new Error('Authentication failed. Please try again.');
        }

        // Explicitly navigate to ensure the user isn't stuck on "Processing..."
        // while the App component updates its state.
        navigate(RoutePath.DASHBOARD);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
      // Only sign out if we are in sign up mode to clean slate, otherwise stay to let user retry
      if (isSignUp) await supabase.auth.signOut();
    } finally {
      // If we navigated away, this might run on unmount, which is fine
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex relative overflow-hidden font-sans">
      {/* Abstract Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-zinc-950 to-zinc-950 z-0"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 -left-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl"></div>

      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:w-1/2 xl:w-5/12 z-10 relative">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">JackRyanAI</span>
            </div>
            <h2 className="text-4xl font-extrabold text-white tracking-tight mb-3">
              {isSignUp ? 'New Operative' : 'Restricted Access'}
            </h2>
            <p className="text-zinc-400">
              {isSignUp ? 'Initialize a new secure identity.' : 'Authorized personnel only. All access attempts are monitored.'}
            </p>
          </div>

          <div className="mt-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              <form className="space-y-6" onSubmit={handleAuth}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    {isSignUp ? 'New Email Identity' : 'Operative ID (Email)'}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="agent@jackryan.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-zinc-800/80 border-zinc-700 !text-white placeholder-zinc-500 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-zinc-800"
                  />
                </div>

                <div>
                   <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Passcode
                  </label>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-zinc-800/80 border-zinc-700 !text-white placeholder-zinc-500 focus:ring-indigo-500/50 focus:border-indigo-500 focus:bg-zinc-800"
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-zinc-400 hover:text-white focus:outline-none transition-colors p-1"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start">
                    <AlertTriangle className="h-5 w-5 text-rose-400 mt-0.5 flex-shrink-0" />
                    <p className="ml-2 text-sm text-rose-300 font-medium">{error}</p>
                  </div>
                )}

                {successMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="ml-2 text-sm text-emerald-300 font-medium">{successMessage}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {!isSignUp && (
                      <>
                        <input
                          id="remember-me"
                          name="remember-me"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-500 focus:ring-indigo-500 border-zinc-700 rounded bg-zinc-800"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-400">
                          Keep active
                        </label>
                      </>
                    )}
                  </div>
                  
                  {!isSignUp && (
                    <div className="text-sm">
                      <a href="#" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                        Recover Access
                      </a>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full py-3.5 text-base shadow-indigo-500/25 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500"
                  isLoading={isLoading}
                >
                  {isLoading 
                    ? 'Processing...' 
                    : (isSignUp ? 'Establish Identity' : 'Secure Login')}
                  {!isLoading && <ChevronRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-6 text-center pt-4 border-t border-white/5">
                <button 
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMessage(''); }}
                  className="text-sm text-zinc-400 hover:text-white transition-colors font-medium flex items-center justify-center w-full"
                >
                  {isSignUp ? (
                    'Already credentialed? Return to Login'
                  ) : (
                     <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Initialize New Identity
                     </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-zinc-600 text-xs uppercase tracking-widest font-semibold">
              <Fingerprint className="h-4 w-4" />
              <span>Level 5 Security Protocol Active</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side Visual */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 h-full w-full bg-zinc-900">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
           <div className="absolute inset-0 bg-gradient-to-l from-zinc-950 via-zinc-950/80 to-transparent"></div>
           
           <div className="absolute bottom-0 left-0 p-12 text-white z-20">
             <blockquote className="space-y-2 border-l-2 border-indigo-500 pl-6">
               <p className="text-lg font-light italic text-zinc-300">
                 "Without data, you're just another person with an opinion. Without security, you're just another target."
               </p>
               <footer className="text-sm font-semibold text-indigo-400">
                 — Jack Ryan
               </footer>
             </blockquote>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;