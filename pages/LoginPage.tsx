import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  ArrowRight, 
  ScanLine, 
  AlertCircle, 
  Loader2, 
  Fingerprint, 
  Eye, 
  EyeOff,
  UserPlus
} from 'lucide-react';
import { supabase } from '../services/supabase';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Mouse movement effect state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const location = useLocation();

  useEffect(() => {
    // Handle mouse movement for background parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20, 
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const storedIntent = localStorage.getItem('jackryan_auth_intent');
    if (storedIntent === 'signup' || location.state?.mode === 'signup') {
      setIsSignUp(true);
      if (storedIntent) localStorage.removeItem('jackryan_auth_intent');
    }
  }, [location]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          setSuccessMessage('Credentials created. Please log in.');
          setIsSignUp(false);
          setPassword('');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f0f0] relative overflow-hidden font-sans selection:bg-black selection:text-white px-6">
        
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        {/* Floating Orb */}
        <motion.div 
            animate={{ x: mousePosition.x * -2, y: mousePosition.y * -2 }}
            transition={{ type: 'spring', damping: 50, stiffness: 400 }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-gray-200 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none"
        />

        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[400px] relative z-10 flex flex-col items-center"
        >

            {/* Circular Portal Icon */}
            <div className="relative mb-12 group">
                {/* Rotating Ring */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-[-12px] border border-dashed border-gray-300 rounded-full"
                />
                
                {/* Active Ring */}
                <motion.div 
                    animate={{ rotate: isLoading || isFocused ? 360 : 0, scale: isLoading ? 1.1 : 1 }}
                    transition={{ duration: isLoading ? 1 : 0.5, ease: isLoading ? "linear" : "backOut", repeat: isLoading ? Infinity : 0 }}
                    className={`absolute inset-[-4px] border-2 border-t-black border-r-transparent border-b-black border-l-transparent rounded-full ${isLoading || isFocused ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
                />

                {/* Main Circle */}
                <div className="w-24 h-24 bg-white rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] flex items-center justify-center relative z-10 overflow-hidden">
                    <AnimatePresence mode="wait">
                         {isLoading ? (
                             <motion.div 
                                key="scanning"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                             >
                                 <ScanLine className="text-black animate-pulse" size={32} strokeWidth={1.5} />
                             </motion.div>
                         ) : (
                             <motion.div 
                                key="locked"
                                className="relative"
                                whileHover={{ scale: 1.1 }}
                             >
                                <Lock className="text-black transition-transform duration-500" size={32} strokeWidth={1.5} />
                             </motion.div>
                         )}
                    </AnimatePresence>
                </div>

                {/* Status Dot */}
                <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#f0f0f0] z-20 transition-colors duration-500 ${error ? 'bg-red-500' : isLoading ? 'bg-blue-500' : 'bg-emerald-500'}`} />
            </div>

            <div className="text-center mb-10">
                <h1 className="text-2xl font-medium text-gray-900 tracking-tight">
                    {isSignUp ? 'New Identity' : 'System Access'}
                </h1>
                <p className="text-xs text-gray-400 mt-2 uppercase tracking-[0.2em] font-medium">
                    {isSignUp ? 'Registration Protocol' : 'Verify Credentials'}
                </p>
            </div>

            {/* Form Card */}
            <div className="w-full bg-white/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white">
                <AnimatePresence mode="wait">
                    {(error || successMessage) && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            className={`flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg ${error ? 'text-rose-500 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}
                        >
                            {error ? <AlertCircle size={14} /> : <Fingerprint size={14} />}
                            {error || successMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-1">
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="w-full bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-transparent focus:border-gray-200 rounded-xl px-4 py-4 text-center text-gray-900 placeholder-gray-400 outline-none transition-all duration-300 font-medium text-sm"
                            placeholder="admin@access.portal"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <div className="space-y-1 relative group">
                        <input 
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="w-full bg-gray-50/50 hover:bg-gray-50 focus:bg-white border border-transparent focus:border-gray-200 rounded-xl px-4 py-4 text-center text-gray-900 placeholder-gray-400 outline-none transition-all duration-300 font-medium tracking-widest text-sm"
                            placeholder="••••••••"
                            disabled={isLoading}
                            required
                        />
                         <button
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors focus:outline-none"
                        >
                           {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="group relative w-full h-14 bg-black text-white rounded-xl overflow-hidden shadow-lg shadow-gray-200/50 hover:shadow-gray-300 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                         {/* White Fill Effect on Hover */}
                        <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.86,0,0.07,1)]" />
                        
                        {/* Content Container */}
                        <div className="relative z-10 flex items-center justify-center h-full">
                            {isLoading ? (
                                <div className="flex items-center gap-2 text-gray-400">
                                     <Loader2 size={18} className="animate-spin" />
                                     <span className="text-sm font-medium">Processing...</span>
                                </div>
                            ) : (
                                <div className="relative overflow-hidden h-5 flex flex-col justify-start text-sm font-medium w-full">
                                     {/* Original Text */}
                                     <span className="absolute inset-0 flex items-center justify-center gap-2 group-hover:-translate-y-[150%] transition-transform duration-500 ease-[cubic-bezier(0.86,0,0.07,1)]">
                                        {isSignUp ? 'Generate Credentials' : 'Unlock Dashboard'} <ArrowRight size={16} />
                                     </span>
                                     
                                     {/* Hover Text (Black) */}
                                     <span className="absolute inset-0 flex items-center justify-center gap-2 text-black translate-y-[150%] group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.86,0,0.07,1)]">
                                        {isSignUp ? 'Create Identity' : 'Access System'} <ScanLine size={16} />
                                     </span>
                                </div>
                            )}
                        </div>
                    </button>
                </form>

                 <div className="mt-6 text-center">
                    <button 
                        onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccessMessage(''); }}
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                    >
                        {isSignUp ? (
                            'Back to Login'
                        ) : (
                            <>
                                <UserPlus size={12} />
                                Register New User
                            </>
                        )}
                    </button>
                 </div>
            </div>
            
            <div className="mt-8 flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest opacity-50">
                <Fingerprint size={12} />
                <span>Biometric Secured</span>
            </div>

        </motion.div>
    </div>
  );
};

export default LoginPage;