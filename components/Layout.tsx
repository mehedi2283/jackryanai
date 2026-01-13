import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, LogOut, Menu, X, Users } from 'lucide-react';
import { RoutePath } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  user: { username: string } | null;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navItems = [
    { name: 'Dashboard', path: RoutePath.DASHBOARD, icon: LayoutDashboard },
    { name: 'Users', path: RoutePath.USERS, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-900/80 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:inset-auto md:flex md:flex-col border-r border-zinc-800`}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-zinc-800/50 bg-zinc-950">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600/20 p-2 rounded-lg">
               <Shield className="h-6 w-6 text-indigo-400" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">JackRyanAI</span>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-zinc-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-between overflow-y-auto py-6">
          <nav className="px-4 space-y-2">
            <p className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Core Modules</p>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-300 shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <div className="flex items-center">
                    <item.icon className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    {item.name}
                  </div>
                  {isActive && <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>}
                </NavLink>
              );
            })}
          </nav>

          <div className="px-4">
            <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                  <p className="text-xs text-emerald-400 flex items-center mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
                    Secure
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center px-4 py-2 border border-zinc-700 text-xs font-medium rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                End Session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 lg:hidden sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
               <Shield className="h-6 w-6 text-indigo-600" />
               <span className="text-lg font-bold text-gray-900">JackRyanAI</span>
            </div>
            <div className="w-6" />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;