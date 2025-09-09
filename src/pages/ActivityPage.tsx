import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuizStatsStore } from '../store/quizStatsStore';
import { getQuizSessions, getUserStats } from '../services/quizService';

const ActivityPage: React.FC = () => {
  const { attempts, userStats } = useQuizStatsStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month'>('all');
  const [realQuizSessions, setRealQuizSessions] = useState<any[]>([]);
  const [realUserStats, setRealUserStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load real data from database
  useEffect(() => {
    const loadActivityData = async () => {
      try {
        setIsLoading(true);
        console.log('Loading activity data...');
        
        const [quizSessions, userStats] = await Promise.all([
          getQuizSessions(50), // Load more sessions for activity page
          getUserStats()
        ]);
        
        console.log('Activity data loaded successfully:', { quizSessions, userStats });
        console.log('Quiz sessions count:', quizSessions?.length || 0);
        console.log('First quiz session:', quizSessions?.[0]);
        
        setRealQuizSessions(quizSessions || []);
        setRealUserStats(userStats || {});
      } catch (error) {
        console.error('Error loading activity data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivityData();
  }, []);

  const getFilteredAttempts = () => {
    // Use real quiz sessions instead of mock attempts
    const sessionsToFilter = realQuizSessions.length > 0 ? realQuizSessions : attempts;
    
    if (selectedPeriod === 'all') return sessionsToFilter;
    
    const now = new Date();
    const filterDate = new Date();
    
    if (selectedPeriod === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    }
    
    return sessionsToFilter.filter(session => {
      const sessionDate = new Date(session.completed_at || session.created_at || session.date);
      return sessionDate >= filterDate;
    });
  };

  const filteredAttempts = getFilteredAttempts();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get stats from real data or fallback to mock data
  const displayStats = {
    totalAttempts: realQuizSessions.length > 0 ? realQuizSessions.length : attempts.length,
    totalQuestions: realUserStats?.total_questions_answered || userStats.totalQuestionsAnswered || 0,
    totalXp: realUserStats?.total_xp || userStats.totalXp || 0,
    totalTime: realUserStats?.total_time_spent || userStats.totalTimeSpent || 0
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/20';
    if (accuracy >= 60) return 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/20';
    return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20';
  };

  const getXpColor = (xp: number) => {
    if (xp >= 80) return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/20';
    if (xp >= 50) return 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/20';
    return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Lade Aktivitäten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Alle Aktivitäten
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Hier findest du alle deine Quiz-Versuche und Lernfortschritte
              </p>
            </div>
            <Link
              to="/dashboard"
              className="btn-secondary"
            >
              ← Zurück zum Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {displayStats.totalAttempts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Quiz-Versuche</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-success-600 dark:text-success-400 mb-2">
              {displayStats.totalQuestions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Fragen beantwortet</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-warning-600 dark:text-warning-400 mb-2">
              {displayStats.totalXp}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">XP verdient</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {Math.round(displayStats.totalTime / 60)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Minuten gelernt</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Aktivitäten filtern
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedPeriod('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === 'all'
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Alle
              </button>
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === 'week'
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Letzte Woche
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === 'month'
                    ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Letzter Monat
              </button>
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Quiz-Versuche ({filteredAttempts.length})
          </h2>

          {filteredAttempts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Noch keine Aktivitäten
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Starte dein erstes Quiz, um hier deine Fortschritte zu sehen!
              </p>
              <Link to="/quiz" className="btn-primary">
                Quiz starten
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAttempts.map((attempt) => {
                // Handle both real quiz sessions and mock attempts
                const isRealSession = attempt.created_at || attempt.completed_at;
                const sessionDate = isRealSession ? (attempt.created_at || attempt.completed_at) : attempt.date;
                const questionsAnswered = isRealSession ? (attempt.questions_answered || attempt.total_questions) : attempt.questionsAnswered;
                const correctAnswers = isRealSession ? attempt.correct_answers : attempt.correctAnswers;
                const accuracyRate = isRealSession ? attempt.accuracy_rate : attempt.accuracyRate;
                const xpEarned = isRealSession ? attempt.xp_earned : attempt.xpEarned;
                const timeSpent = isRealSession ? (attempt.time_spent || attempt.total_time_seconds) : attempt.timeSpent;
                const chapterName = isRealSession ? (attempt.chapter_name || (attempt.chapters && attempt.chapters[0])) : attempt.chapter;
                
                return (
                  <div
                    key={attempt.id}
                    className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🎯</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Quiz vom {formatDate(sessionDate)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {questionsAnswered} Fragen beantwortet
                            {chapterName && ` • ${chapterName}`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getXpColor(xpEarned)}`}>
                          +{xpEarned} XP
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {questionsAnswered}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">Fragen</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {correctAnswers}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Richtig</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getAccuracyColor(accuracyRate)}`}>
                        {Math.round(accuracyRate)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Richtig Beantwortet</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatTime(timeSpent)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">Zeit</div>
                    </div>
                  </div>

                  {chapterName && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Kapitel:</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                          {chapterName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
