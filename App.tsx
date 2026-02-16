import React, { useState, useEffect } from 'react';
import { User, AuthState, Reminder, Priority, Category } from './types';
import { storage } from './services/storage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { LayoutDashboard, LogOut, Bell, Settings, User as UserIcon, Sun, Moon } from 'lucide-react';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: storage.getCurrentAuth(),
    isAuthenticated: !!storage.getCurrentAuth()
  });

  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    storage.setAuth(null);
    setAuthState({ user: null, isAuthenticated: false });
    setView('dashboard');
  };

  const handleLogin = (user: User) => {
    storage.setAuth(user);
    setAuthState({ user, isAuthenticated: true });
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  if (!authState.isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col shadow-sm z-20">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Mindful</span>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            My Reminders
          </button>
          {authState.user?.role === 'admin' && (
            <button 
              onClick={() => setView('admin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${view === 'admin' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'}`}
            >
              <Settings className="w-5 h-5" />
              Admin Panel
            </button>
          )}
        </nav>

        <div className="p-4 mt-auto border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <div className="bg-gray-100 dark:bg-slate-800 p-2 rounded-full">
              <UserIcon className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{authState.user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-slate-500 capitalize">{authState.user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {view === 'dashboard' ? (
          <Dashboard user={authState.user!} />
        ) : (
          <AdminPanel />
        )}
      </main>
    </div>
  );
};

export default App;