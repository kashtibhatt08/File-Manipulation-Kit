import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Menu, X, Sun, Moon, LogOut, LayoutDashboard, FileText, 
  Image as ImageIcon, Music, FolderArchive, User, LogIn, ChevronRight
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'PDF Tools', path: '/pdf', icon: FileText },
    { name: 'Image Tools', path: '/image', icon: ImageIcon },
    { name: 'Audio Tools', path: '/audio', icon: Music },
    { name: 'ZIP Tools', path: '/zip', icon: FolderArchive },
    ...(user ? [{ name: 'Profile & History', path: '/profile', icon: User }] : [])
  ];

  const activeClass = (path) => {
    const isDashboard = path === '/' && location.pathname === '/';
    const isSubPath = path !== '/' && location.pathname.startsWith(path);
    return isDashboard || isSubPath
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-200/50 dark:border-slate-800/50 z-20">
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-850/50 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              UniFile Toolkit
            </span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${activeClass(item.path)}`}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
              {location.pathname === item.path && (
                <ChevronRight size={14} className="ml-auto" />
              )}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="p-4 border-t border-slate-200/50 dark:border-slate-850/50">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-850 z-40 md:hidden transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-850 flex items-center justify-between">
          <span className="text-xl font-bold text-white bg-gradient-to-r from-indigo-400 to-pink-500 bg-clip-text text-transparent">
            UniFile Toolkit
          </span>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <nav className="p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${location.pathname === item.path ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        {user && (
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-950/20 transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header/Navbar */}
        <header className="sticky top-0 z-10 w-full glass-panel border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="h-16 px-4 md:px-8 flex items-center justify-between">
            
            {/* Sidebar toggle button (Mobile) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
            >
              <Menu size={20} />
            </button>

            {/* Title / Logo (Mobile only) */}
            <Link to="/" className="md:hidden flex items-center">
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
                UniFile
              </span>
            </Link>

            {/* Spacer / Tool Name */}
            <div className="hidden md:block">
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                Workspace
              </span>
            </div>

            {/* Actions: Theme toggle, Auth, User profile */}
            <div className="flex items-center gap-3">
              
              {/* Light/Dark mode switcher */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60 transition-colors"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* User Section */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800/60 transition-all"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                  </button>

                  {userDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 rounded-xl glass-panel shadow-xl border border-slate-200/50 dark:border-slate-800/50 z-20 py-1 overflow-hidden">
                        <Link
                          to="/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                        >
                          <User size={14} />
                          <span>My Profile</span>
                        </Link>
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            handleLogout();
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-medium text-sm transition-all shadow-md shadow-indigo-500/20"
                >
                  <LogIn size={16} />
                  <span>Sign In</span>
                </Link>
              )}

            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;
