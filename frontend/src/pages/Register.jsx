import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';

const Register = () => {
  const { register, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setIsSubmitting(true);

    if (!name || !email || !password) {
      setLocalError('Please fill in all fields');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      setIsSubmitting(false);
      return;
    }

    const res = await register(name, email, password);
    setIsSubmitting(false);
    if (res.success) {
      navigate('/');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create Account
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Get started with premium temporary file editing today.
        </p>
      </div>

      {(localError || error) && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30 text-sm">
          <AlertCircle size={16} />
          <span>{localError || error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User size={16} />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-900/60 dark:border-slate-800 dark:text-white dark:focus:ring-indigo-600 dark:focus:border-indigo-600 text-sm transition-all"
              placeholder="Alex Johnson"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Mail size={16} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-900/60 dark:border-slate-800 dark:text-white dark:focus:ring-indigo-600 dark:focus:border-indigo-600 text-sm transition-all"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock size={16} />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-900/60 dark:border-slate-800 dark:text-white dark:focus:ring-indigo-600 dark:focus:border-indigo-600 text-sm transition-all"
              placeholder="Min. 6 characters"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Sign Up</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="text-center text-sm">
        <span className="text-slate-500 dark:text-slate-400">Already have an account? </span>
        <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default Register;
