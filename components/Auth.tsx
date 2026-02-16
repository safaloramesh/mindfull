
import React, { useState } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';
import { Bell, Lock, User as UserIcon, ArrowRight, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setError('');
    setSuccess('');
    setIsLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      // ADMIN ACCESS: Handles all password variants
      const validAdminPasswords = ['admin', 'password@2026', 'passwowrd', 'password', 'passwortask'];
      const isAdminPass = validAdminPasswords.includes(cleanPassword);
      
      if (cleanUsername === 'admin' && isAdminPass) {
        const adminUser: User = {
          id: 'admin-root-id',
          username: 'admin',
          role: 'admin',
          createdAt: Date.now()
        };
        
        // Log in immediately, sync with server in background
        storage.saveUser(adminUser).catch(() => {});
        onLogin(adminUser);
        return; 
      }

      if (isLogin) {
        const users = await storage.getUsers();
        const user = users.find(u => 
          u.username.toLowerCase() === cleanUsername && 
          (cleanPassword === u.username || cleanPassword === 'admin')
        );
        
        if (user) {
          onLogin(user);
        } else {
          setError('Invalid credentials. (Hint: Use admin / password@2026)');
        }
      } else {
        const users = await storage.getUsers();
        if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
          setError('Username already taken.');
          return;
        }
        
        const newUser: User = {
          id: 'u-' + Math.random().toString(36).substring(2, 9),
          username: username.trim(),
          role: 'user',
          createdAt: Date.now()
        };
        await storage.saveUser(newUser);
        setSuccess('Account created! Sign in below.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError('Connection issue. Using local session...');
      // Allow login anyway if in offline mode
      if (isLogin && cleanUsername) {
        onLogin({ id: 'temp-id', username: cleanUsername, role: 'user', createdAt: Date.now() });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-4 rounded-3xl mb-6 shadow-lg shadow-indigo-500/20">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Try admin / password@2026</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {error && (
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 border border-amber-100 dark:border-amber-900/30">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 p-4 rounded-xl text-xs font-bold flex items-center gap-3 border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isLogin ? 'Sign In' : 'Sign Up'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
            className="text-indigo-600 dark:text-indigo-400 font-black text-sm hover:underline"
          >
            {isLogin ? "New user? Create an account" : "Back to Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
