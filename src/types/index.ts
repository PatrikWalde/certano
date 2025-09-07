// User & Authentication
export interface User {
  id: string;
  email: string;
  emailVerifiedAt?: string;
  firstName: string;
  lastName: string;
  city: string;
  evu?: string; // EVU (optional)
  role: 'user' | 'editor' | 'admin';
  level: number;
  xp: number;
  streak: number;
  privacySettings: PrivacySettings;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrivacySettings {
  showOnLeaderboard: boolean;
  allowAnalytics: boolean;
}

// Topics (übergeordnete Kategorien)
export interface Topic {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Chapters
export interface ChapterData {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  topicId?: string; // Verknüpfung zum Thema
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Subscription & Plans
export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'trial' | 'active' | 'past_due' | 'canceled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
  stripeSubscriptionId: string;
}

export interface Plan {
  id: string;
  name: 'free' | 'pro_monthly' | 'pro_yearly';
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

export interface Entitlement {
  userId: string;
  featureKey: string;
  value: boolean | number | string;
}

export interface QuotaUsage {
  userId: string;
  window: string; // ISO week
  answeredQuestionsCount: number;
}

// Questions & Quiz
export interface Question {
  id: string;
  questionNumber?: string; // Artikel-/Fragenummer
  chapter: string;
  type: QuestionType;
  prompt: string;
  media?: string; // URL to image/video

  isOpenQuestion?: boolean; // For image questions that are open-ended
  options: QuestionOption[];
  matchingPairs?: MatchingPair[]; // For matching questions
  fillBlankOptions?: FillBlankOption[]; // For fill_blank questions
  blankCount?: number; // Number of blanks in the text
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 
  | 'multiple_choice' 
  | 'true_false' 
  | 'matching' 
  | 'image_question' 
  | 'open_ended' 
  | 'fill_blank';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface MatchingPair {
  id: string;
  leftText: string;
  rightText: string;
  isCorrect: boolean;
}

export interface FillBlankOption {
  id: string;
  text: string;
  correctAnswer: string;
  wrongAnswers?: WrongAnswer[];
}

export interface WrongAnswer {
  id: string;
  text: string;
}

// Quiz Attempts & Progress
export interface Attempt {
  id: string;
  userId: string;
  questionId: string;
  isCorrect: boolean;
  timeSpent: number; // in seconds
  selectedOptions?: string[];
  userAnswer?: string; // for open-ended questions
  createdAt: string;
  countedForQuota: boolean;
}

export interface Progress {
  userId: string;
  chapter: string;
  ringPercent: number; // 0-100
  lastActivity: string;
  totalQuestions: number;
  correctAnswers: number;
}

// Gamification
export interface Quest {
  id: string;
  title: string;
  description: string;
  criteria: QuestCriteria;
  reward: QuestReward;
  progress: number;
  maxProgress: number;
  unlockedAt?: string;
  completedAt?: string;
}

export interface QuestCriteria {
  type: 'questions_answered' | 'streak_days' | 'chapters_completed' | 'accuracy_rate';
  target: number;
  chapter?: string;
  timeFrame?: 'daily' | 'weekly' | 'monthly';
}

export interface QuestReward {
  xp: number;
  badge?: string;
  title?: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'chapter' | 'streak' | 'accuracy' | 'special';
  unlockedAt?: string;
}

// Quiz Session
export interface QuizSession {
  id: string;
  userId: string;
  type: 'quick' | 'chapter' | 'exam' | 'review';
  chapter?: string;
  questions: Question[];
  currentQuestionIndex: number;
  answers: SessionAnswer[];
  startTime: string;
  endTime?: string;
  isCompleted: boolean;
  score?: number;
}

export interface SessionAnswer {
  questionId: string;
  selectedOptions?: string[];
  userAnswer?: string;
  fillBlankAnswers?: string[]; // For fill_blank questions: array of selected option IDs
  isCorrect: boolean;
  timeSpent: number;
  answeredAt: string;
}

// Statistics & Analytics
export interface UserStats {
  totalQuestionsAnswered: number;
  correctAnswers: number;
  accuracyRate: number;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  chaptersProgress: ChapterProgress[];
  weeklyActivity: WeeklyActivity[];
  recentActivity: RecentActivity[];
}

export interface ChapterProgress {
  chapter: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyRate: number;
  ringPercent: number;
  lastActivity: string;
}

export interface WeeklyActivity {
  week: string;
  questionsAnswered: number;
  accuracyRate: number;
  xpEarned: number;
}

export interface RecentActivity {
  date: string;
  questionsAnswered: number;
  accuracyRate: number;
  xpEarned: number;
  chapters: string[];
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error Types
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

// Quiz Configuration
export interface QuizConfig {
  questionCount: number;
  timeLimit?: number; // in seconds
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanations: boolean;
  allowSkip: boolean;
  chapter?: string;
}

// App State
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  theme: 'light' | 'dark';
}

// Navigation
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  requiresAuth?: boolean;
  requiresPremium?: boolean;
}
