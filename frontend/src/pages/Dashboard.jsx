import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FileUploader from '../components/FileUploader';
import { 
  FileText, Image as ImageIcon, Music, FolderArchive, 
  Star, ArrowRight, ShieldCheck, Sparkles, Clock
} from 'lucide-react';

const ALL_TOOLS = [
  { id: 'pdf-merge', name: 'Merge PDF', category: 'pdf', desc: 'Combine multiple PDF files into one.', icon: FileText, route: '/pdf?tool=merge' },
  { id: 'pdf-split', name: 'Split PDF', category: 'pdf', desc: 'Extract specific pages or page ranges.', icon: FileText, route: '/pdf?tool=split' },
  { id: 'pdf-compress', name: 'Compress PDF', category: 'pdf', desc: 'Reduce the file size of PDF documents.', icon: FileText, route: '/pdf?tool=compress' },
  { id: 'pdf-rotate', name: 'Rotate PDF', category: 'pdf', desc: 'Rotate PDF pages in 90 degree increments.', icon: FileText, route: '/pdf?tool=rotate' },
  { id: 'pdf-to-img', name: 'PDF to Image', category: 'pdf', desc: 'Convert PDF document pages to PNG images.', icon: FileText, route: '/pdf?tool=pdfToImage' },
  { id: 'img-to-pdf', name: 'Image to PDF', category: 'pdf', desc: 'Convert PNG/JPG images into a PDF file.', icon: FileText, route: '/pdf?tool=imageToPDF' },

  { id: 'img-compress', name: 'Compress Image', category: 'image', desc: 'Shrink image sizes without quality loss.', icon: ImageIcon, route: '/image?tool=compress' },
  { id: 'img-resize', name: 'Resize Image', category: 'image', desc: 'Change width and height dimensions.', icon: ImageIcon, route: '/image?tool=resize' },
  { id: 'img-crop', name: 'Crop Image', category: 'image', desc: 'Extract a specific portion of the image.', icon: ImageIcon, route: '/image?tool=crop' },
  { id: 'img-convert', name: 'Convert Format', category: 'image', desc: 'Convert between PNG, JPG, and WEBP.', icon: ImageIcon, route: '/image?tool=convert' },
  { id: 'img-watermark', name: 'Watermark', category: 'image', desc: 'Add overlay text for brand protection.', icon: ImageIcon, route: '/image?tool=watermark' },
  { id: 'img-bg-removal', name: 'Background Removal', category: 'image', desc: 'Extract subject with alpha transparency.', icon: ImageIcon, route: '/image?tool=removeBackground' },

  { id: 'audio-trim', name: 'Trim Audio', category: 'audio', desc: 'Extract segments using start and duration.', icon: Music, route: '/audio?tool=trim' },
  { id: 'audio-merge', name: 'Merge Audio', category: 'audio', desc: 'Join audio tracks into a unified MP3.', icon: Music, route: '/audio?tool=merge' },
  { id: 'audio-convert', name: 'Convert Audio', category: 'audio', desc: 'Convert between MP3 and WAV formats.', icon: Music, route: '/audio?tool=convert' },

  { id: 'zip-create', name: 'Zip Files', category: 'zip', desc: 'Pack multiple files into an archive.', icon: FolderArchive, route: '/zip?tool=zip' },
  { id: 'zip-extract', name: 'Unzip Archive', category: 'zip', desc: 'Decompress files from a ZIP archive.', icon: FolderArchive, route: '/zip?tool=unzip' }
];

const Dashboard = () => {
  const { user, updateFavorites } = useAuth();
  const navigate = useNavigate();
  const [editingFavorites, setEditingFavorites] = useState(false);

  // Set default favorites if user has none configured
  const favoriteIds = user?.favouriteTools?.length > 0
    ? user.favouriteTools
    : ['pdf-merge', 'img-compress', 'audio-trim', 'zip-create'];

  const favorites = ALL_TOOLS.filter(t => favoriteIds.includes(t.id));

  // Magic Quick Upload handler - Routes based on extension
  const handleQuickUpload = (files) => {
    if (files.length === 0) return;
    const file = files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    if (['pdf'].includes(ext)) {
      navigate('/pdf', { state: { initialFiles: files } });
    } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      navigate('/image', { state: { initialFiles: files } });
    } else if (['mp3', 'wav'].includes(ext)) {
      navigate('/audio', { state: { initialFiles: files } });
    } else if (['zip'].includes(ext)) {
      navigate('/zip', { state: { initialFiles: files } });
    } else {
      // Default fallback
      navigate('/zip', { state: { initialFiles: files } });
    }
  };

  const handleFavoriteToggle = async (toolId) => {
    if (!user) return;
    
    let updated;
    if (favoriteIds.includes(toolId)) {
      updated = favoriteIds.filter(id => id !== toolId);
    } else {
      updated = [...favoriteIds, toolId];
    }
    await updateFavorites(updated);
  };

  return (
    <div className="space-y-10">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-pink-900/20 border border-slate-200/50 dark:border-slate-800/40 p-8 sm:p-10">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles size={120} className="text-white" />
        </div>
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Hello, {user ? user.name : 'Guest'}
          </h1>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
            Welcome to the Universal File Toolkit. All tools run on-the-fly and auto-destroy outputs after download or 15 minutes, preserving your visual and data privacy.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800">
              <Clock size={14} className="text-indigo-500" />
              <span>15 Min Auto-Expiry</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Temporary Disk Cache</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Quick Upload & Favorite Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Quick Upload Box */}
        <div className="lg:col-span-5 space-y-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Quick Upload</h2>
            <p className="text-xs text-slate-400">Drop any file here, we will redirect you to the right editor dashboard.</p>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <FileUploader 
              accept={{
                'application/pdf': ['.pdf'],
                'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
                'audio/*': ['.mp3', '.wav'],
                'application/zip': ['.zip']
              }}
              multiple={true}
              onFilesSelected={handleQuickUpload}
            />
          </div>
        </div>

        {/* Shortcuts / Favorite Tools */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight">Favorite Shortcuts</h2>
              <p className="text-xs text-slate-400">Quick links to your most used utilities.</p>
            </div>
            {user && (
              <button
                onClick={() => setEditingFavorites(!editingFavorites)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {editingFavorites ? 'Save Shortcuts' : 'Customize'}
              </button>
            )}
          </div>

          {editingFavorites ? (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 max-h-[300px] overflow-y-auto grid grid-cols-2 gap-3">
              {ALL_TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => handleFavoriteToggle(tool.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                    favoriteIds.includes(tool.id)
                      ? 'border-indigo-500 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/30'
                  }`}
                >
                  <span>{tool.name}</span>
                  <Star size={14} fill={favoriteIds.includes(tool.id) ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favorites.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => navigate(tool.route)}
                  className="group relative glass-panel p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 hover:border-indigo-500/60 dark:hover:border-indigo-500/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                      <tool.icon size={20} />
                    </div>
                    <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-sm font-bold mt-4 mb-1">{tool.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{tool.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Tool Categories Selection */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Explore Categories</h2>
          <p className="text-xs text-slate-400">Browse and process files using categories grouped by extension types.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'PDF Tools', count: '6 Utilities', desc: 'Merge, split, rotate, convert, and compress PDF documents.', icon: FileText, color: 'from-orange-500/20 to-red-500/10', text: 'text-orange-500', border: 'hover:border-orange-500/30', route: '/pdf' },
            { name: 'Image Tools', count: '6 Utilities', desc: 'Crop, resize, compress, overlay text watermarks, and change formats.', icon: ImageIcon, color: 'from-blue-500/20 to-cyan-500/10', text: 'text-blue-500', border: 'hover:border-blue-500/30', route: '/image' },
            { name: 'Audio Tools', count: '3 Utilities', desc: 'Trim audio timeline, merge tracks, and switch audio codecs.', icon: Music, color: 'from-emerald-500/20 to-teal-500/10', text: 'text-emerald-500', border: 'hover:border-emerald-500/30', route: '/audio' },
            { name: 'ZIP Tools', count: '2 Utilities', desc: 'Decompress existing archives or pack multiples into structured zips.', icon: FolderArchive, color: 'from-purple-500/20 to-pink-500/10', text: 'text-purple-500', border: 'hover:border-purple-500/30', route: '/zip' },
          ].map((cat) => (
            <div
              key={cat.name}
              onClick={() => navigate(cat.route)}
              className={`group flex flex-col p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 bg-gradient-to-br ${cat.color} ${cat.border} cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="flex justify-between items-center">
                <div className={`p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 ${cat.text}`}>
                  <cat.icon size={22} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">
                  {cat.count}
                </span>
              </div>
              <h3 className="text-base font-extrabold mt-6 mb-2">{cat.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed flex-1">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
