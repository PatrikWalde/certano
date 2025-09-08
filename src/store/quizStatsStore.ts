import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QuizAttempt {
  id: string;
  date: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracyRate: number;
  xpEarned: number;
  chapters: string[];
  timeSpent: number; // in seconds
}

export interface QuestionError {
  questionId: string;
  chapter: string;
  errorCount: number;
  lastErrorDate: string;
  lastCorrectDate?: string;
  totalAttempts: number;
  successRate: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'achievement';
  category: 'questions' | 'streak' | 'accuracy' | 'chapters' | 'xp';
  target: number;
  currentProgress: number;
  reward: {
    xp: number;
    badge?: string;
  };
  isCompleted: boolean;
  completedAt?: string;
  expiresAt?: string;
  isRepeatable: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'level' | 'streak' | 'accuracy' | 'chapters' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

export interface ChapterStats {
  name: string;
  totalQuestions: number;
  correctAnswers: number;
  progress: number;
  lastPracticed: string;
}

export interface UserStats {
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  accuracyRate: number;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalTimeSpent: number; // in minutes
  weeklyGoal: number;
  weeklyProgress: number;
}

interface QuizStatsStore {
  attempts: QuizAttempt[];
  chapterStats: ChapterStats[];
  userStats: UserStats;
  questionErrors: QuestionError[];
  quests: Quest[];
  badges: Badge[];
  
  // Actions
  addAttempt: (attempt: Omit<QuizAttempt, 'id'>) => Promise<void>;
  updateChapterStats: (chapterName: string, correct: boolean) => void;
  updateUserStats: (correct: boolean, xpEarned: number, timeSpent: number) => void;
  trackQuestionError: (questionId: string, chapter: string, isCorrect: boolean) => void;
  updateQuestProgress: (questId: string, progress: number) => void;
  completeQuest: (questId: string) => void;
  unlockBadge: (badgeId: string) => void;
  generateDailyQuests: () => void;
  generateWeeklyQuests: () => void;
  initializeBadges: () => void;
  resetStats: () => void;
  getWeeklyStats: () => QuizAttempt[];
  getChapterProgress: (chapterName: string) => ChapterStats | undefined;
  getErrorQuestions: (chapter?: string, limit?: number) => QuestionError[];
  getErrorQuestionsForQuiz: (chapter?: string, questionCount?: number) => string[];
  getActiveQuests: () => Quest[];
  getCompletedQuests: () => Quest[];
  getUnlockedBadges: () => Badge[];
}

// Calculate level based on XP
const calculateLevel = (xp: number): number => {
  // Simple level calculation: every 100 XP = 1 level
  return Math.floor(xp / 100) + 1;
};

// Calculate streak
const calculateStreak = (attempts: QuizAttempt[]): { current: number; longest: number } => {
  if (attempts.length === 0) return { current: 0, longest: 0 };
  
  const sortedAttempts = [...attempts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  for (let i = 0; i < sortedAttempts.length; i++) {
    const attemptDate = new Date(sortedAttempts[i].date);
    const isToday = attemptDate.toDateString() === today.toDateString();
    const isYesterday = attemptDate.toDateString() === yesterday.toDateString();
    
    if (isToday || isYesterday) {
      tempStreak++;
      currentStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
  }
  
  return { current: currentStreak, longest: longestStreak };
};

// Calculate weekly progress
const calculateWeeklyProgress = (attempts: QuizAttempt[], weeklyGoal: number): number => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of current week
  
  const weeklyAttempts = attempts.filter(attempt => {
    const attemptDate = new Date(attempt.date);
    return attemptDate >= weekStart;
  });
  
  const weeklyQuestions = weeklyAttempts.reduce((sum, attempt) => sum + attempt.questionsAnswered, 0);
  return Math.min((weeklyQuestions / weeklyGoal) * 100, 100);
};

const useQuizStatsStore = create<QuizStatsStore>()(
  persist(
    (set, get) => ({
      attempts: [],
      chapterStats: [],
      questionErrors: [],
      quests: [],
      badges: [],
      userStats: {
        totalQuestionsAnswered: 0,
        totalCorrectAnswers: 0,
        accuracyRate: 0,
        totalXp: 0,
        currentLevel: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalTimeSpent: 0,
        weeklyGoal: 50, // Default weekly goal
        weeklyProgress: 0,
      },
      
      addAttempt: async (attemptData) => {
        const newAttempt: QuizAttempt = {
          ...attemptData,
          id: Date.now().toString(),
        };
        
        // Save to database
        try {
          const { supabase } = await import('../lib/supabase');
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Save quiz attempt to database
            await supabase.from('quiz_attempts').insert({
              user_id: user.id,
              questions_answered: newAttempt.questionsAnswered,
              correct_answers: newAttempt.correctAnswers,
              accuracy_rate: newAttempt.accuracyRate,
              xp_earned: newAttempt.xpEarned,
              chapters: newAttempt.chapters,
              time_spent: Math.round(newAttempt.timeSpent),
              questions: [], // Could store question details here
              completed_at: new Date().toISOString()
            });
            
            // Update user stats in database
            const { data: existingStats } = await supabase
              .from('user_stats')
              .select('*')
              .eq('user_id', user.id)
              .single();
            
            if (existingStats) {
              // Update existing stats
              await supabase
                .from('user_stats')
                .update({
                  total_questions_answered: existingStats.total_questions_answered + newAttempt.questionsAnswered,
                  total_correct_answers: existingStats.total_correct_answers + newAttempt.correctAnswers,
                  total_xp: existingStats.total_xp + newAttempt.xpEarned,
                  total_time_spent: existingStats.total_time_spent + Math.round(newAttempt.timeSpent),
                  current_level: calculateLevel(existingStats.total_xp + newAttempt.xpEarned),
                  updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);
            } else {
              // Create new stats
              await supabase.from('user_stats').insert({
                user_id: user.id,
                total_questions_answered: newAttempt.questionsAnswered,
                total_correct_answers: newAttempt.correctAnswers,
                total_xp: newAttempt.xpEarned,
                total_time_spent: Math.round(newAttempt.timeSpent),
                current_level: calculateLevel(newAttempt.xpEarned)
              });
            }
          }
        } catch (error) {
          console.error('Error saving quiz attempt to database:', error);
        }
        
        set((state) => {
          const newAttempts = [newAttempt, ...state.attempts];
          const newUserStats = { ...state.userStats };
          
          // Update user stats
          newUserStats.totalQuestionsAnswered += newAttempt.questionsAnswered;
          newUserStats.totalCorrectAnswers += newAttempt.correctAnswers;
          newUserStats.totalXp += newAttempt.xpEarned;
          newUserStats.totalTimeSpent += newAttempt.timeSpent / 60; // Convert to minutes
          newUserStats.accuracyRate = Math.round((newUserStats.totalCorrectAnswers / newUserStats.totalQuestionsAnswered) * 100);
          newUserStats.currentLevel = calculateLevel(newUserStats.totalXp);
          
          // Calculate streaks
          const streaks = calculateStreak(newAttempts);
          newUserStats.currentStreak = streaks.current;
          newUserStats.longestStreak = Math.max(newUserStats.longestStreak, streaks.longest);
          
          // Calculate weekly progress
          newUserStats.weeklyProgress = calculateWeeklyProgress(newAttempts, newUserStats.weeklyGoal);
          
          // Check for streak badge unlocks
          let newBadges = [...state.badges];
          
          if (streaks.current >= 3) {
            const streak3Badge = newBadges.find(b => b.id === 'streak-3');
            if (streak3Badge && !streak3Badge.unlockedAt) {
              newBadges = newBadges.map(b => 
                b.id === 'streak-3' 
                  ? { ...b, unlockedAt: new Date().toISOString() }
                  : b
              );
            }
          }
          
          if (streaks.current >= 7) {
            const streak7Badge = newBadges.find(b => b.id === 'streak-7');
            if (streak7Badge && !streak7Badge.unlockedAt) {
              newBadges = newBadges.map(b => 
                b.id === 'streak-7' 
                  ? { ...b, unlockedAt: new Date().toISOString() }
                  : b
              );
            }
          }
          
          if (streaks.current >= 30) {
            const streak30Badge = newBadges.find(b => b.id === 'streak-30');
            if (streak30Badge && !streak30Badge.unlockedAt) {
              newBadges = newBadges.map(b => 
                b.id === 'streak-30' 
                  ? { ...b, unlockedAt: new Date().toISOString() }
                  : b
              );
            }
          }
          
          return {
            attempts: newAttempts,
            userStats: newUserStats,
            badges: newBadges,
          };
        });
      },
      
      updateChapterStats: (chapterName, correct) => {
        set((state) => {
          const existingChapter = state.chapterStats.find(c => c.name === chapterName);
          
          if (existingChapter) {
            const updatedChapter = {
              ...existingChapter,
              totalQuestions: existingChapter.totalQuestions + 1,
              correctAnswers: existingChapter.correctAnswers + (correct ? 1 : 0),
              lastPracticed: new Date().toISOString(),
            };
            updatedChapter.progress = Math.round((updatedChapter.correctAnswers / updatedChapter.totalQuestions) * 100);
            
            return {
              chapterStats: state.chapterStats.map(c => 
                c.name === chapterName ? updatedChapter : c
              ),
            };
          } else {
            const newChapter: ChapterStats = {
              name: chapterName,
              totalQuestions: 1,
              correctAnswers: correct ? 1 : 0,
              progress: correct ? 100 : 0,
              lastPracticed: new Date().toISOString(),
            };
            
            return {
              chapterStats: [...state.chapterStats, newChapter],
            };
          }
        });
      },
      
      updateUserStats: (correct, xpEarned, timeSpent) => {
        set((state) => {
          const newUserStats = { ...state.userStats };
          newUserStats.totalQuestionsAnswered += 1;
          newUserStats.totalCorrectAnswers += correct ? 1 : 0;
          newUserStats.totalXp += xpEarned;
          newUserStats.totalTimeSpent += timeSpent / 60; // Convert to minutes
          newUserStats.accuracyRate = Math.round((newUserStats.totalCorrectAnswers / newUserStats.totalQuestionsAnswered) * 100);
          newUserStats.currentLevel = calculateLevel(newUserStats.totalXp);
          
          // Check for badge unlocks
          let newBadges = [...state.badges];
          
          // First quiz badge
          if (newUserStats.totalQuestionsAnswered === 1) {
            const firstQuizBadge = newBadges.find(b => b.id === 'first-quiz');
            if (firstQuizBadge && !firstQuizBadge.unlockedAt) {
              newBadges = newBadges.map(b => 
                b.id === 'first-quiz' 
                  ? { ...b, unlockedAt: new Date().toISOString() }
                  : b
              );
            }
          }
          
          // Level badges
          if (newUserStats.currentLevel >= 5) {
            const level5Badge = newBadges.find(b => b.id === 'level-5');
            if (level5Badge && !level5Badge.unlockedAt) {
              newBadges = newBadges.map(b => 
                b.id === 'level-5' 
                  ? { ...b, unlockedAt: new Date().toISOString() }
                  : b
              );
            }
          }
          
          if (newUserStats.currentLevel >= 10) {
            const level10Badge = newBadges.find(b => b.id === 'level-10');
            if (level10Badge && !level10Badge.unlockedAt) {
              newBadges = newBadges.map(b => 
                b.id === 'level-10' 
                  ? { ...b, unlockedAt: new Date().toISOString() }
                  : b
              );
            }
          }
          
          // Accuracy badge
          if (newUserStats.accuracyRate >= 100) {
            const accuracyBadge = newBadges.find(b => b.id === 'accuracy-100');
            if (accuracyBadge && !accuracyBadge.unlockedAt) {
              newBadges = newBadges.map(b => 
                b.id === 'accuracy-100' 
                  ? { ...b, unlockedAt: new Date().toISOString() }
                  : b
              );
            }
          }
          
          return { 
            userStats: newUserStats,
            badges: newBadges,
          };
        });
      },
      
      resetStats: () => {
        set({
          attempts: [],
          chapterStats: [],
          questionErrors: [],
          quests: [],
          badges: [],
          userStats: {
            totalQuestionsAnswered: 0,
            totalCorrectAnswers: 0,
            accuracyRate: 0,
            totalXp: 0,
            currentLevel: 1,
            currentStreak: 0,
            longestStreak: 0,
            totalTimeSpent: 0,
            weeklyGoal: 50,
            weeklyProgress: 0,
          },
        });
      },
      
      getWeeklyStats: () => {
        const state = get();
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Start of current week
        
        return state.attempts.filter(attempt => {
          const attemptDate = new Date(attempt.date);
          return attemptDate >= weekStart;
        });
      },
      
      getChapterProgress: (chapterName) => {
        const state = get();
        return state.chapterStats.find(c => c.name === chapterName);
      },
      
      trackQuestionError: (questionId, chapter, isCorrect) => {
        set((state) => {
          const existingError = state.questionErrors.find(e => e.questionId === questionId);
          
          if (existingError) {
            const updatedError = {
              ...existingError,
              errorCount: existingError.errorCount + (isCorrect ? 0 : 1),
              lastErrorDate: isCorrect ? existingError.lastErrorDate : new Date().toISOString(),
              lastCorrectDate: isCorrect ? new Date().toISOString() : existingError.lastCorrectDate,
              totalAttempts: existingError.totalAttempts + 1,
            };
            updatedError.successRate = Math.round(((updatedError.totalAttempts - updatedError.errorCount) / updatedError.totalAttempts) * 100);
            
            return {
              questionErrors: state.questionErrors.map(e => 
                e.questionId === questionId ? updatedError : e
              ),
            };
          } else {
            const newError: QuestionError = {
              questionId,
              chapter,
              errorCount: isCorrect ? 0 : 1,
              lastErrorDate: isCorrect ? new Date().toISOString() : new Date().toISOString(),
              lastCorrectDate: isCorrect ? new Date().toISOString() : undefined,
              totalAttempts: 1,
              successRate: isCorrect ? 100 : 0,
            };
            
            return {
              questionErrors: [...state.questionErrors, newError],
            };
          }
        });
      },
      
      getErrorQuestions: (chapter, limit) => {
        const state = get();
        let errors = state.questionErrors;
        
        if (chapter) {
          errors = errors.filter(e => e.chapter === chapter);
        }
        
        // Sort by error count (highest first) and then by last error date
        errors.sort((a, b) => {
          if (b.errorCount !== a.errorCount) {
            return b.errorCount - a.errorCount;
          }
          return new Date(b.lastErrorDate).getTime() - new Date(a.lastErrorDate).getTime();
        });
        
        if (limit) {
          errors = errors.slice(0, limit);
        }
        
        return errors;
      },
      
      getErrorQuestionsForQuiz: (chapter, questionCount = 10) => {
        const state = get();
        const errorQuestions = state.getErrorQuestions(chapter);
        
        // Get question IDs for quiz
        const questionIds = errorQuestions.map(e => e.questionId);
        
        // If we don't have enough error questions, we could mix in some random questions
        // For now, just return what we have
        return questionIds.slice(0, questionCount);
      },
      
      updateQuestProgress: (questId, progress) => {
        set((state) => {
          const quest = state.quests.find(q => q.id === questId);
          if (!quest) return state;
          
          const updatedQuest = { ...quest, currentProgress: progress };
          if (progress >= quest.target && !quest.isCompleted) {
            updatedQuest.isCompleted = true;
            updatedQuest.completedAt = new Date().toISOString();
          }
          
          return {
            quests: state.quests.map(q => q.id === questId ? updatedQuest : q),
          };
        });
      },
      
      completeQuest: (questId) => {
        set((state) => {
          const quest = state.quests.find(q => q.id === questId);
          if (!quest || quest.isCompleted) return state;
          
          // Give XP reward
          const newUserStats = { ...state.userStats };
          newUserStats.totalXp += quest.reward.xp;
          newUserStats.currentLevel = calculateLevel(newUserStats.totalXp);
          
          // Unlock badge if reward includes one
          let newBadges = [...state.badges];
          if (quest.reward.badge) {
            const badge = state.badges.find(b => b.id === quest.reward.badge);
            if (badge && !badge.unlockedAt) {
              newBadges = newBadges.map(b => 
                b.id === quest.reward.badge 
                  ? { ...b, unlockedAt: new Date().toISOString() }
                  : b
              );
            }
          }
          
          return {
            userStats: newUserStats,
            badges: newBadges,
          };
        });
      },
      
      unlockBadge: (badgeId) => {
        set((state) => {
          const badge = state.badges.find(b => b.id === badgeId);
          if (!badge || badge.unlockedAt) return state;
          
          return {
            badges: state.badges.map(b => 
              b.id === badgeId 
                ? { ...b, unlockedAt: new Date().toISOString() }
                : b
            ),
          };
        });
      },
      
      generateDailyQuests: () => {
        const dailyQuests: Quest[] = [
          {
            id: 'daily-questions',
            title: 'Fragen-Meister',
            description: 'Beantworte 10 Fragen heute',
            type: 'daily',
            category: 'questions',
            target: 10,
            currentProgress: 0,
            reward: { xp: 50, badge: undefined },
            isCompleted: false,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            isRepeatable: true,
          },
          {
            id: 'daily-streak',
            title: 'Streak-Halter',
            description: 'Lerne heute für deinen Streak',
            type: 'daily',
            category: 'streak',
            target: 1,
            currentProgress: 0,
            reward: { xp: 30, badge: undefined },
            isCompleted: false,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            isRepeatable: true,
          },
          {
            id: 'daily-accuracy',
            title: 'Präzision',
            description: 'Erreiche 80% Genauigkeit in einem Quiz',
            type: 'daily',
            category: 'accuracy',
            target: 80,
            currentProgress: 0,
            reward: { xp: 40, badge: undefined },
            isCompleted: false,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            isRepeatable: true,
          },
        ];
        
        set((state) => ({
          quests: [...state.quests.filter(q => q.type !== 'daily'), ...dailyQuests],
        }));
      },
      
      generateWeeklyQuests: () => {
        const weeklyQuests: Quest[] = [
          {
            id: 'weekly-questions',
            title: 'Wochen-Champion',
            description: 'Beantworte 50 Fragen diese Woche',
            type: 'weekly',
            category: 'questions',
            target: 50,
            currentProgress: 0,
            reward: { xp: 200, badge: 'weekly-champion' },
            isCompleted: false,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isRepeatable: true,
          },
          {
            id: 'weekly-streak',
            title: 'Streak-Meister',
            description: 'Halte einen 7-Tage-Streak',
            type: 'weekly',
            category: 'streak',
            target: 7,
            currentProgress: 0,
            reward: { xp: 150, badge: 'streak-master' },
            isCompleted: false,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isRepeatable: true,
          },
        ];
        
        set((state) => ({
          quests: [...state.quests.filter(q => q.type !== 'weekly'), ...weeklyQuests],
        }));
      },
      
      getActiveQuests: () => {
        const state = get();
        const now = new Date();
        return state.quests.filter(q => 
          !q.isCompleted && 
          (!q.expiresAt || new Date(q.expiresAt) > now)
        );
      },
      
      getCompletedQuests: () => {
        const state = get();
        return state.quests.filter(q => q.isCompleted);
      },
      
      getUnlockedBadges: () => {
        const state = get();
        return state.badges.filter(b => b.unlockedAt);
      },
      
      initializeBadges: () => {
        const initialBadges: Badge[] = [
          {
            id: 'first-quiz',
            name: 'Erste Schritte',
            description: 'Absolviere dein erstes Quiz',
            icon: '🎯',
            category: 'special',
            rarity: 'common',
          },
          {
            id: 'streak-3',
            name: 'Streak-Anfänger',
            description: '3 Tage in Folge lernen',
            icon: '🔥',
            category: 'streak',
            rarity: 'common',
          },
          {
            id: 'streak-7',
            name: 'Streak-Meister',
            description: '7 Tage in Folge lernen',
            icon: '🔥🔥',
            category: 'streak',
            rarity: 'rare',
          },
          {
            id: 'streak-30',
            name: 'Streak-Legende',
            description: '30 Tage in Folge lernen',
            icon: '🔥🔥🔥',
            category: 'streak',
            rarity: 'epic',
          },
          {
            id: 'accuracy-100',
            name: 'Perfektionist',
            description: 'Erreiche 100% Genauigkeit',
            icon: '💯',
            category: 'accuracy',
            rarity: 'rare',
          },
          {
            id: 'level-5',
            name: 'Erfahrener Lerner',
            description: 'Erreiche Level 5',
            icon: '⭐',
            category: 'level',
            rarity: 'common',
          },
          {
            id: 'level-10',
            name: 'Lern-Experte',
            description: 'Erreiche Level 10',
            icon: '⭐⭐',
            category: 'level',
            rarity: 'rare',
          },
          {
            id: 'weekly-champion',
            name: 'Wochen-Champion',
            description: 'Absolviere wöchentliche Quest',
            icon: '🏆',
            category: 'special',
            rarity: 'rare',
          },
          {
            id: 'streak-master',
            name: 'Streak-Meister',
            description: 'Halte einen 7-Tage-Streak',
            icon: '👑',
            category: 'streak',
            rarity: 'epic',
          },
        ];
        
        set((_state) => ({
          badges: initialBadges,
        }));
      },
    }),
    {
      name: 'quiz-stats-storage',
    }
  )
);

export { useQuizStatsStore };
