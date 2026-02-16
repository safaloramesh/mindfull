
import React, { useState, useEffect } from 'react';
import { Reminder, User, Priority, Category } from '../types';
import { storage } from '../services/storage';
import { aiAssistant } from '../services/gemini';
import ReminderCard from './ReminderCard';
import { Plus, Search, Sparkles, Loader2, X, Bell, AlertCircle } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'task-' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [category, setCategory] = useState<Category>(Category.PERSONAL);

  useEffect(() => {
    if (user?.id) loadReminders();
  }, [user?.id]);

  const loadReminders = async () => {
    try {
      const data = await storage.getReminders(user.id);
      setReminders(data.sort((a, b) => b.createdAt - a.createdAt));
    } catch (e) {
      console.error("Failed to load reminders", e);
    }
  };

  const handleToggle = async (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
    const r = reminders.find(x => x.id === id);
    if (r) {
      try {
        await storage.updateReminder({ ...r, completed: !r.completed });
        await loadReminders();
      } catch (e) {
        console.error("Toggle failed", e);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const original = [...reminders];
    setReminders(prev => prev.filter(r => r.id !== id));
    try {
      await storage.deleteReminder(id);
    } catch (e) {
      setReminders(original);
      console.error("Delete failed", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setSubmitError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const newReminder: Reminder = {
      id: generateId(),
      userId: user.id,
      title: cleanTitle,
      description: description.trim(),
      dueDate: dueDate || new Date().toISOString(),
      priority,
      category,
      completed: false,
      createdAt: Date.now()
    };

    // OPTIMISTIC UPDATE: Add to local state immediately
    setReminders(prev => [newReminder, ...prev]);

    try {
      await storage.addReminder(newReminder);
      setIsModalOpen(false);
      resetForm();
      // Reload to ensure everything is in sync with server IDs/etc
      await loadReminders();
    } catch (err: any) {
      console.error("Submission error:", err.message);
      // Keep it in the list since it's saved in LocalStorage fallback
      setSubmitError('Saved locally only. Server connection issue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority(Priority.MEDIUM);
    setCategory(Category.PERSONAL);
    setSubmitError('');
  };

  const handleAiOptimize = async () => {
    if (!title) return;
    setIsAiLoading(true);
    try {
      const suggestion = await aiAssistant.optimizeReminder(title, description);
      if (suggestion) {
        setTitle(suggestion.suggestedTitle || title);
        setDescription(suggestion.suggestedDescription || description);
        const p = (suggestion.suggestedPriority || '').toUpperCase();
        if (Object.values(Priority).includes(p as Priority)) setPriority(p as Priority);
        const foundCat = Object.values(Category).find(c => c.toLowerCase() === (suggestion.category || '').toLowerCase());
        if (foundCat) setCategory(foundCat);
      }
    } catch (e) {
      console.error("AI failed", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredReminders = reminders.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Hello, {user.username}!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your day with intention.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-6 h-6" />
          Add Reminder
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
        {[
          { label: 'Total', value: reminders.length },
          { label: 'Done', value: reminders.filter(r => r.completed).length },
          { label: 'Pending', value: reminders.filter(r => !r.completed).length },
          { label: 'Urgent', value: reminders.filter(r => !r.completed && r.priority === Priority.URGENT).length }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text"
          placeholder="Search your tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-slate-900 dark:text-white font-medium shadow-sm"
        />
      </div>

      {filteredReminders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReminders.map(reminder => (
            <ReminderCard 
              key={reminder.id} 
              reminder={reminder} 
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Nothing here yet</h3>
          <p className="text-slate-500 mt-2 font-medium">Click "Add Reminder" to create your first task.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-white/10">
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">New Task</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-500">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {submitError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border border-red-100">
                  <AlertCircle className="w-5 h-5" />
                  {submitError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                  <div className="relative">
                    <input required autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's the plan?" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-900 dark:text-white" />
                    <button type="button" onClick={handleAiOptimize} disabled={!title || isAiLoading} className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 disabled:opacity-30 rounded-xl">
                      {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Details</label>
                  <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add some context..." className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-900 dark:text-white font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Due Date</label>
                    <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-slate-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold text-slate-900 dark:text-white">
                      {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Priority</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.values(Priority).map(p => (
                      <button key={p} type="button" onClick={() => setPriority(p)} className={`py-3 text-[10px] font-black rounded-xl border transition-all uppercase tracking-widest ${priority === p ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 px-6 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 px-6 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
