import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const AuthLayout = ({ children }) => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-200">
      
      {/* Corner Controls */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60 transition-colors"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Universal File Toolkit
          </span>
        </Link>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Professional grade tools in one privacy-first workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-panel py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-slate-200/50 dark:border-slate-800/50">
          {children}
        </div>
      </div>
      
    </div>
  );
};

export default AuthLayout;
