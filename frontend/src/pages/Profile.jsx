import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  User, Mail, Calendar, History, 
  Trash2, Download, Shield, RefreshCw, AlertCircle
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchHistory = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/api/files/history');
      setHistory(res.data.data);
    } catch (err) {
      setErrorMsg('Failed to load processing history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const formatSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getRemainingTime = (createdAtString, isDownloaded) => {
    if (isDownloaded) return 'Downloaded (Purged)';
    
    const createdAt = new Date(createdAtString).getTime();
    const expiryTime = createdAt + 15 * 60 * 1000;
    const now = Date.now();
    const remainingMs = expiryTime - now;

    if (remainingMs <= 0) return 'Expired (Purged)';
    
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    return `Expires in ${minutes}m ${seconds}s`;
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account & Processing History</h1>
        <p className="text-xs text-slate-400">View profile information and tracking logs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* User Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-lg font-bold mt-4">{user.name}</h2>
              <span className="text-xs text-slate-400">Toolkit Member</span>
            </div>

            <div className="border-t border-slate-250/20 dark:border-slate-800/50 pt-4 space-y-4">
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-350">
                <Mail size={16} className="text-indigo-500 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-350">
                <Calendar size={16} className="text-indigo-500 shrink-0" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-350">
                <Shield size={16} className="text-indigo-500 shrink-0" />
                <span>Standard Data Policy Enforced</span>
              </div>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <History size={18} className="text-indigo-500" />
              <span>Operation History</span>
            </h2>
            <button
              onClick={fetchHistory}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors"
            >
              <RefreshCw size={14} className="text-slate-400 hover:text-slate-800" />
            </button>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <RefreshCw size={24} className="text-indigo-500 animate-spin" />
              </div>
            ) : errorMsg ? (
              <div className="flex items-center gap-2 p-6 justify-center text-xs text-red-500">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            ) : history.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400">
                No recent files processed. Operations run via dashboard will log here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-slate-850/50 bg-slate-100/50 dark:bg-slate-900/30 text-slate-500 font-semibold">
                      <th className="px-6 py-4">Original File</th>
                      <th className="px-6 py-4">Tool Used</th>
                      <th className="px-6 py-4">Size</th>
                      <th className="px-6 py-4">Privacy TTL</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-850/50">
                    {history.map((item) => {
                      const timeStr = getRemainingTime(item.createdAt, item.isDownloaded);
                      const isExpired = timeStr.includes('Expired') || timeStr.includes('Downloaded');

                      return (
                        <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-900/10">
                          <td className="px-6 py-4 font-medium max-w-[200px] truncate">{item.originalName}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium">
                              {item.toolUsed}
                            </span>
                          </td>
                          <td className="px-6 py-4">{formatSize(item.fileSize)}</td>
                          <td className="px-6 py-4">
                            <span className={`font-semibold ${isExpired ? 'text-slate-400 dark:text-slate-600' : 'text-amber-500'}`}>
                              {timeStr}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isExpired ? (
                              <a
                                href={`/api/files/download/${item.downloadToken}`}
                                download
                                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                              >
                                <Download size={12} />
                                <span>Get</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600 italic">Purged</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Profile;
