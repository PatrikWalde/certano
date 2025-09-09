import React, { useState, useEffect } from 'react';
import { getQuizSessions } from '../services/quizService';

interface QuizSession {
  id: string;
  user_id?: string;
  questions_answered?: number;
  correct_answers: number;
  accuracy_rate: number;
  xp_earned: number;
  chapters?: string[];
  time_spent?: number;
  total_time_seconds?: number;
  created_at: string;
  questions?: any[];
  // Legacy fields for compatibility
  session_type?: string;
  chapter_name?: string;
  total_questions?: number;
  completed_at?: string;
}

const QuizHistory: React.FC = () => {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizSessions();
  }, []);

  const loadQuizSessions = async () => {
    try {
      const data = await getQuizSessions(5); // Letzte 5 Sessions
      console.log('QuizHistory - Loaded sessions:', data);
      setSessions(data || []);
    } catch (error: any) {
      console.error('Fehler beim Laden der Quiz-Historie:', error);
      // Wenn die Tabelle noch nicht existiert, zeige leere Liste
      if (error.code === 'PGRST205') {
        console.log('Quiz-Sessions Tabelle noch nicht erstellt. Zeige leere Historie.');
        setSessions([]);
      } else {
        setSessions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    // Handle NaN, undefined, or invalid values
    if (!seconds || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Heute';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Gestern';
    } else {
      return date.toLocaleDateString('de-DE', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'quick_quiz':
        return 'Schnell-Quiz';
      case 'chapter_quiz':
        return 'Kapitel-Quiz';
      case 'error_review':
        return 'Fehlerwiederholung';
      default:
        return type;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-700 dark:text-green-300';
    if (accuracy >= 60) return 'text-orange-700 dark:text-orange-300';
    return 'text-red-700 dark:text-red-300';
  };

  const getAccuracyStrokeColor = (accuracy: number) => {
    if (accuracy >= 80) return '#8fb89e';
    if (accuracy >= 60) return '#f59e0b';
    return '#c65656';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quiz-Historie</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quiz-Historie</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <p className="text-gray-600 dark:text-gray-300">Noch keine Quiz-Ergebnisse</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Starte dein erstes Quiz, um deine Fortschritte zu sehen!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quiz-Historie</h2>
      <div className="space-y-4">
        {sessions.map((session) => (
          <div key={session.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {getSessionTypeLabel(session.session_type || 'quiz')}
                </span>
                {session.chapter_name && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {session.chapter_name}
                    </span>
                  </>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(session.completed_at || session.created_at)}
              </div>
            </div>
            
            {/* Stats with Progress Rings */}
            <div className="flex items-center justify-center space-x-8">
              {/* Correct Answers Ring */}
              <div className="flex flex-col items-center">
                <div className="relative w-16 h-16 mb-2">
                  <svg
                    width={64}
                    height={64}
                    className="transform -rotate-90"
                  >
                    {/* Background circle */}
                    <circle
                      cx={32}
                      cy={32}
                      r={28}
                      stroke="#e5e7eb"
                      strokeWidth={6}
                      fill="transparent"
                      className="opacity-30"
                    />
                    {/* Progress circle */}
                    <circle
                      cx={32}
                      cy={32}
                      r={28}
                      stroke={getAccuracyStrokeColor((session.correct_answers / (session.total_questions || session.questions_answered || 1)) * 100)}
                      strokeWidth={6}
                      fill="transparent"
                      strokeDasharray={175.9}
                      strokeDashoffset={175.9 - (session.correct_answers / (session.total_questions || session.questions_answered || 1)) * 175.9}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-in-out"
                    />
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-sm font-display text-gray-900 dark:text-white">
                      {session.correct_answers}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  von {session.total_questions || session.questions_answered || 0}<br />richtig
                </div>
              </div>

              {/* Accuracy Ring */}
              <div className="flex flex-col items-center">
                <div className="relative w-16 h-16 mb-2">
                  <svg
                    width={64}
                    height={64}
                    className="transform -rotate-90"
                  >
                    {/* Background circle */}
                    <circle
                      cx={32}
                      cy={32}
                      r={28}
                      stroke="#e5e7eb"
                      strokeWidth={6}
                      fill="transparent"
                      className="opacity-30"
                    />
                    {/* Progress circle */}
                    <circle
                      cx={32}
                      cy={32}
                      r={28}
                      stroke={session.accuracy_rate >= 80 ? '#8fb89e' : session.accuracy_rate >= 60 ? '#f59e0b' : '#c65656'}
                      strokeWidth={6}
                      fill="transparent"
                      strokeDasharray={175.9}
                      strokeDashoffset={175.9 - (session.accuracy_rate / 100) * 175.9}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-in-out"
                    />
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`text-sm font-display ${getAccuracyColor(session.accuracy_rate)}`}>
                      {session.accuracy_rate.toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Genauigkeit
                </div>
              </div>
            </div>
            
            {/* Bottom row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                ⏱️ {formatTime(session.total_time_seconds || session.time_spent || 0)}
              </div>
              <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                +{session.xp_earned} XP
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizHistory;
