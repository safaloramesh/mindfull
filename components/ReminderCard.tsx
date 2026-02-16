import React from 'react';
import { Reminder, Priority, Category } from '../types';
import { Calendar, Tag, Trash2, CheckCircle, Circle } from 'lucide-react';

interface ReminderCardProps {
  reminder: Reminder;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case Priority.URGENT: return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case Priority.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
    case Priority.MEDIUM: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case Priority.LOW: return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    default: return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  }
};

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onToggle, onDelete }) => {
  return (
    <div className={`group relative bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all duration-300 hover:shadow-xl ${reminder.completed ? 'opacity-60 border-gray-100 dark:border-slate-800' : 'border-gray-200 dark:border-slate-800 hover:-translate-y-1 hover:border-indigo-200 dark:hover:border-indigo-900'}`}>
      <div className="flex items-start justify-between gap-4">
        <button 
          onClick={() => onToggle(reminder.id)}
          className="mt-1 transition-transform active:scale-90"
        >
          {reminder.completed ? (
            <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400 fill-indigo-50 dark:fill-indigo-900/20" />
          ) : (
            <Circle className="w-6 h-6 text-gray-300 dark:text-slate-700 hover:text-indigo-400" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className={`text-lg font-bold truncate ${reminder.completed ? 'line-through text-gray-400 dark:text-slate-600' : 'text-gray-900 dark:text-white'}`}>
            {reminder.title}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400 line-clamp-2">
            {reminder.description}
          </p>
          
          <div className="mt-4 flex flex-wrap gap-2 items-center text-[10px] md:text-xs">
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full border bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700">
              <Calendar className="w-3 h-3" />
              {new Date(reminder.dueDate).toLocaleDateString()}
            </span>
            <span className={`px-2 py-1 rounded-full border ${getPriorityColor(reminder.priority)} font-bold`}>
              {reminder.priority}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full border bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30 uppercase font-bold tracking-wider">
              {reminder.category}
            </span>
          </div>
        </div>

        <button 
          onClick={() => onDelete(reminder.id)}
          className="md:opacity-0 group-hover:opacity-100 p-2 text-gray-400 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ReminderCard;