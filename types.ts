
export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum Category {
  WORK = 'Work',
  PERSONAL = 'Personal',
  HEALTH = 'Health',
  FINANCE = 'Finance',
  OTHERS = 'Others'
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  category: Category;
  completed: boolean;
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  role: 'user' | 'admin';
  createdAt: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
