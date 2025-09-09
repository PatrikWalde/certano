import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuizStatsStore } from '../store/quizStatsStore';
import { useChapterStore } from '../store/chapterStore';
import { useSupabase } from '../hooks/useSupabase';
import { getUserStats, getChapterStats, getQuizSessions } from '../services/quizService';
import ProgressRing from '../components/ProgressRing';
import StatsCard from '../components/StatsCard';
// import MetricCard from '../components/MetricCard';
import RecentActivity from '../components/RecentActivity';
import ErrorReviewSection from '../components/ErrorReviewSection';
import QuestsSection from '../components/QuestsSection';
import CompetenceRadar from '../components/CompetenceRadar';
import BadgesSection from '../components/BadgesSection';
import ChapterProgress from '../components/ChapterProgress';
import QuizHistory from '../components/QuizHistory';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { userStats } = useQuizStatsStore();
  const { chapters } = useChapterStore();
  const { getChapters, getQuestions } = useSupabase();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isQuickQuizLoading, setIsQuickQuizLoading] = useState(false);
  const [realChapterStats, setRealChapterStats] = useState<any[]>([]);
  const [quizSessions, setQuizSessions] = useState<any[]>([]);

  // Load dashboard data from Supabase
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Load chapters, user stats, chapter stats, and quiz sessions
        console.log('Loading dashboard data...');
        
        // Load quiz sessions separately to handle errors gracefully
        let realQuizSessions = [];
        try {
          realQuizSessions = await getQuizSessions(5);
        } catch (error) {
          console.error('Error loading quiz sessions:', error);
          realQuizSessions = [];
        }
        
        const [chaptersData, realUserStats, realChapterStats] = await Promise.all([
          getChapters(),
          getUserStats(),
          getChapterStats()
        ]);
        
        console.log('Chapters loaded successfully:', chaptersData);
        console.log('User stats loaded successfully:', realUserStats);
        console.log('Chapter stats loaded successfully:', realChapterStats);
        console.log('Quiz sessions loaded successfully:', realQuizSessions);
        
        setDashboardData({
          userStats: realUserStats || {},
          chapters: chaptersData || []
        });
        setRealChapterStats(realChapterStats || []);
        setQuizSessions(realQuizSessions || []);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user?.id]); // Removed getChapters from dependencies to prevent infinite loop

  // Get real data or fallback to defaults
  const stats = {
    totalQuestionsAnswered: dashboardData?.userStats?.total_questions_answered || userStats.totalQuestionsAnswered || 0,
    correctAnswers: dashboardData?.userStats?.total_correct_answers || userStats.totalCorrectAnswers || 0,
    accuracyRate: dashboardData?.userStats?.total_questions_answered > 0 
      ? Math.round((dashboardData.userStats.total_correct_answers / dashboardData.userStats.total_questions_answered) * 100)
      : userStats.accuracyRate || 0,
    totalXp: dashboardData?.userStats?.total_xp || userStats.totalXp || 0,
    currentLevel: dashboardData?.userStats?.current_level || userStats.currentLevel || 1,
    currentStreak: dashboardData?.userStats?.current_streak || userStats.currentStreak || 0,
    longestStreak: dashboardData?.userStats?.longest_streak || userStats.longestStreak || 0,
    daysActive: dashboardData?.userStats?.days_active || 7, // Fallback auf 7 Tage
  };
  

  // Get chapter progress from real data or create defaults
  const getChapterProgress = () => {
    
    if (dashboardData?.chapters && dashboardData.chapters.length > 0) {
      return dashboardData.chapters.map((chapter: any) => {
        // Finde die Statistiken für dieses Kapitel
        const stats = realChapterStats.find(stat => stat.chapter === chapter.name);
        const progress = stats?.progress || 0;
        const totalQuestions = stats?.total_questions || 0;
        const correctAnswers = stats?.correct_answers || 0;
        
        
        return {
          name: chapter.name,
          progress: progress,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
        };
      });
    }
    
    // Fallback: show active chapters with 0 progress
    return chapters
      .filter(chapter => chapter.isActive)
      .map(chapter => {
        const stats = realChapterStats.find(stat => stat.chapter === chapter.name);
        const progress = stats?.progress || 0;
        const totalQuestions = stats?.total_questions || 0;
        const correctAnswers = stats?.correct_answers || 0;
        
        
        return {
          name: chapter.name,
          progress: progress,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
        };
      });
  };

  // Memoize chapter progress to prevent multiple calculations
  const chapterProgress = React.useMemo(() => {
    return getChapterProgress();
  }, [dashboardData, realChapterStats, chapters]);

  // Memoize recent activity to prevent multiple calculations
  const recentActivity = React.useMemo(() => {
    if (quizSessions.length === 0) {
      return [
        { date: 'Noch keine Quiz-Sessions', questionsAnswered: 0, accuracyRate: 0, xpEarned: 0 },
      ];
    }
    
    const activities = quizSessions.slice(0, 3).map(session => {
      
      const sessionDate = new Date(session.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateLabel = '';
      if (sessionDate.toDateString() === today.toDateString()) {
        dateLabel = 'Heute';
      } else if (sessionDate.toDateString() === yesterday.toDateString()) {
        dateLabel = 'Gestern';
      } else {
        dateLabel = sessionDate.toLocaleDateString('de-DE', { 
          day: '2-digit', 
          month: '2-digit' 
        });
      }
      
      const activity = {
        date: dateLabel,
        questionsAnswered: session.questions_answered || 0,
        accuracyRate: session.accuracy_rate ? Math.round(session.accuracy_rate) : 0,
        xpEarned: session.xp_earned || 0,
      };
      
      return activity;
    });
    
    return activities;
  }, [quizSessions]);

  // Schnell-Quiz Funktion
  const handleQuickQuiz = async () => {
    try {
      setIsQuickQuizLoading(true);
      
      // Lade alle Fragen
      const allQuestions = await getQuestions();
      
      if (!allQuestions || allQuestions.length === 0) {
        alert('Keine Fragen verfügbar. Bitte fügen Sie zuerst Fragen hinzu.');
        return;
      }
      
      // Mische die Fragen und nimm die ersten 10
      const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5);
      const quickQuizQuestions = shuffledQuestions.slice(0, 10);
      
      // Erstelle Quiz-Konfiguration für Schnell-Quiz
      const quizConfig = {
        questions: quickQuizQuestions,
        shuffleQuestions: true,
        shuffleOptions: true,
        showExplanations: true,
        allowSkip: true,
        selectedChapters: ['all'], // Alle Kapitel für zufällige Auswahl
        isQuickQuiz: true
      };
      
      // Navigiere zur Quiz-Seite mit der Konfiguration
      navigate('/quiz', { 
        state: { 
          config: quizConfig,
          isQuickQuiz: true 
        } 
      });
      
    } catch (error) {
      console.error('Fehler beim Laden des Schnell-Quiz:', error);
      alert('Fehler beim Laden des Schnell-Quiz. Bitte versuchen Sie es erneut.');
    } finally {
      setIsQuickQuizLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Willkommen zurück, {user?.firstName || user?.email?.split('@')[0] || 'Benutzer'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Hier ist dein Lernfortschritt und deine Statistiken.
          </p>
        </div>

        {/* Ultra-Modern Quiz Selection Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Wähle dein Lernformat
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Bestenliste Card */}
            <Link
              to="/leaderboard"
              className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 transform hover:scale-102 hover:-translate-y-1"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Floating Particles */}
              <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300 delay-100"></div>
              <div className="absolute top-6 right-6 w-1 h-1 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300 delay-200"></div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-lg mb-3 group-hover:scale-105 transition-transform duration-300 mx-auto">
                  <span className="text-2xl">🏆</span>
                </div>
                
                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-all duration-300">
                  Bestenliste
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">
                  Vergleiche dich mit anderen Lernenden
                </p>
              </div>
            </Link>
            
            {/* Schnell-Quiz Card */}
            <button
              onClick={handleQuickQuiz}
              disabled={isQuickQuizLoading}
              className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 transform hover:scale-102 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Floating Particles */}
              <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300 delay-100"></div>
              <div className="absolute top-6 right-6 w-1 h-1 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300 delay-200"></div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg mb-3 group-hover:scale-105 transition-transform duration-300 mx-auto">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                
                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300">
                  Schnell-Quiz
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">
                  {isQuickQuizLoading ? 'Lädt...' : '10 zufällige Fragen für schnelles Lernen'}
                </p>
              </div>
            </button>

            {/* Kapitel-Quiz Card */}
            <Link
              to="/quiz"
              className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 transform hover:scale-102 hover:-translate-y-1"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Floating Particles */}
              <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-300 delay-100"></div>
              <div className="absolute top-6 right-6 w-1 h-1 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300 delay-200"></div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg mb-3 group-hover:scale-105 transition-transform duration-300 mx-auto">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                
                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-all duration-300">
                  Kapitel-Quiz
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">
                  Lerne nach Themen und Kapiteln strukturiert
                </p>
              </div>
            </Link>

            {/* Fehlerwiederholung Card */}
            <Link
              to="/errors"
              className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 transform hover:scale-102 hover:-translate-y-1"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-pink-50 to-rose-50 dark:from-red-900/20 dark:via-pink-900/20 dark:to-rose-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              {/* Floating Particles */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-700 delay-100"></div>
              <div className="absolute top-8 right-8 w-1 h-1 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700 delay-200"></div>
              <div className="absolute top-12 right-6 w-1.5 h-1.5 bg-rose-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-700 delay-300"></div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-lg mb-3 group-hover:scale-105 transition-transform duration-300 mx-auto">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                
                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-all duration-300">
                  Fehler-Quiz
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">
                  Lerne aus deinen Fehlern und verbessere dich
                </p>
              </div>
            </Link>

            {/* Alle Kapitel Card */}
            <Link
              to="/chapters"
              className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 transform hover:scale-102 hover:-translate-y-1"
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              {/* Floating Particles */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-700 delay-100"></div>
              <div className="absolute top-8 right-8 w-1 h-1 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700 delay-200"></div>
              <div className="absolute top-12 right-6 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-700 delay-300"></div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg mb-3 group-hover:scale-105 transition-transform duration-300 mx-auto">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                
                <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-300">
                  Alle Kapitel
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">
                  Entdecke alle verfügbaren Lernkapitel
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Fragen beantwortet"
            value={stats.totalQuestionsAnswered || 0}
            icon="📝"
            color="success"
            showProgress={true}
            progress={stats.totalQuestionsAnswered || 0}
            max={100}
          />
          <StatsCard
            title="Richtig beantwortet"
            value={stats.correctAnswers || 0}
            icon="✅"
            color="success"
            showProgress={true}
            progress={stats.correctAnswers || 0}
            max={stats.totalQuestionsAnswered || 1}
          />
          <StatsCard
            title="Genauigkeit"
            value={`${stats.accuracyRate || 0}%`}
            icon="🎯"
            color={stats.accuracyRate >= 80 ? 'success' : stats.accuracyRate >= 60 ? 'warning' : 'danger'}
            showProgress={true}
            progress={stats.accuracyRate || 0}
            max={100}
          />
          <StatsCard
            title="Gesamt-XP"
            value={stats.totalXp || 0}
            icon="⭐"
            color="warning"
            showProgress={true}
            progress={stats.totalXp || 0}
            max={1000}
          />
        </div>

        {/* Detailed Metrics with Progress Rings */}
        <div className="mb-8">
          <h2 className="text-xl font-heading text-gray-900 dark:text-white mb-6">Lern-Metriken</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Accuracy Metric */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-heading text-gray-600 dark:text-gray-400">
                    Durchschnittliche Genauigkeit
                  </span>
                </div>
                <div className={`w-3 h-3 rounded-full ${stats.accuracyRate >= 80 ? 'bg-green-500' : stats.accuracyRate >= 60 ? 'bg-orange-500' : 'bg-red-500'}`}></div>
              </div>
              
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-20 h-20">
                  <svg
                    width={80}
                    height={80}
                    className="transform -rotate-90"
                  >
                    {/* Background circle */}
                    <circle
                      cx={40}
                      cy={40}
                      r={35}
                      stroke="#e5e7eb"
                      strokeWidth={6}
                      fill="transparent"
                      className="opacity-30"
                    />
                    {/* Progress circle */}
                    <circle
                      cx={40}
                      cy={40}
                      r={35}
                      stroke={stats.accuracyRate >= 80 ? '#8fb89e' : stats.accuracyRate >= 60 ? '#f59e0b' : '#c65656'}
                      strokeWidth={6}
                      fill="transparent"
                      strokeDasharray={219.9}
                      strokeDashoffset={219.9 - (Math.min((stats.accuracyRate || 0) / 100, 1) * 219.9)}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-in-out"
                    />
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-lg font-display text-gray-900 dark:text-white">
                      {(stats.accuracyRate || 0).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <span className={`text-sm font-heading ${stats.accuracyRate >= 80 ? 'text-green-700 dark:text-green-300' : stats.accuracyRate >= 60 ? 'text-orange-700 dark:text-orange-300' : 'text-red-700 dark:text-red-300'}`}>
                  {stats.accuracyRate >= 80 ? 'Sehr gut' : stats.accuracyRate >= 60 ? 'Gut' : 'Üben'}
                </span>
              </div>
            </div>

            {/* Questions per Day Metric */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-heading text-gray-600 dark:text-gray-400">
                    Fragen pro Tag
                  </span>
                </div>
                <div className={`w-3 h-3 rounded-full ${((stats.totalQuestionsAnswered || 0) / Math.max(stats.daysActive || 1, 1)) >= 10 ? 'bg-green-500' : ((stats.totalQuestionsAnswered || 0) / Math.max(stats.daysActive || 1, 1)) >= 5 ? 'bg-orange-500' : 'bg-red-500'}`}></div>
              </div>
              
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-20 h-20">
                  <svg
                    width={80}
                    height={80}
                    className="transform -rotate-90"
                  >
                    {/* Background circle */}
                    <circle
                      cx={40}
                      cy={40}
                      r={35}
                      stroke="#e5e7eb"
                      strokeWidth={6}
                      fill="transparent"
                      className="opacity-30"
                    />
                    {/* Progress circle */}
                    <circle
                      cx={40}
                      cy={40}
                      r={35}
                      stroke={((stats.totalQuestionsAnswered || 0) / Math.max(stats.daysActive || 1, 1)) >= 10 ? '#8fb89e' : ((stats.totalQuestionsAnswered || 0) / Math.max(stats.daysActive || 1, 1)) >= 5 ? '#f59e0b' : '#c65656'}
                      strokeWidth={6}
                      fill="transparent"
                      strokeDasharray={219.9}
                      strokeDashoffset={219.9 - (Math.min(((stats.totalQuestionsAnswered || 0) / Math.max(stats.daysActive || 1, 1)) / 10, 1) * 219.9)}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-in-out"
                    />
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-lg font-display text-gray-900 dark:text-white">
                      {((stats.totalQuestionsAnswered || 0) / Math.max(stats.daysActive || 1, 1)).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <span className={`text-sm font-heading ${((stats.totalQuestionsAnswered || 0) / Math.max(stats.daysActive || 1, 1)) >= 10 ? 'text-green-700 dark:text-green-300' : ((stats.totalQuestionsAnswered || 0) / Math.max(stats.daysActive || 1, 1)) >= 5 ? 'text-orange-700 dark:text-orange-300' : 'text-red-700 dark:text-red-300'}`}>
                  {((stats.totalQuestionsAnswered || 0) / Math.max(stats.daysActive || 1, 1)) >= 10 ? 'Sehr gut' : ((stats.totalQuestionsAnswered || 0) / Math.max(stats.daysActive || 1, 1)) >= 5 ? 'Gut' : 'Üben'}
                </span>
              </div>
            </div>

            {/* Current Streak Metric */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                  </div>
                  <span className="text-sm font-heading text-gray-600 dark:text-gray-400">
                    Aktuelle Streak
                  </span>
                </div>
                <div className={`w-3 h-3 rounded-full ${stats.currentStreak >= 7 ? 'bg-green-500' : stats.currentStreak >= 3 ? 'bg-orange-500' : 'bg-red-500'}`}></div>
              </div>
              
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-20 h-20">
                  <svg
                    width={80}
                    height={80}
                    className="transform -rotate-90"
                  >
                    {/* Background circle */}
                    <circle
                      cx={40}
                      cy={40}
                      r={35}
                      stroke="#e5e7eb"
                      strokeWidth={6}
                      fill="transparent"
                      className="opacity-30"
                    />
                    {/* Progress circle */}
                    <circle
                      cx={40}
                      cy={40}
                      r={35}
                      stroke={stats.currentStreak >= 7 ? '#8fb89e' : stats.currentStreak >= 3 ? '#f59e0b' : '#c65656'}
                      strokeWidth={6}
                      fill="transparent"
                      strokeDasharray={219.9}
                      strokeDashoffset={219.9 - (Math.min((stats.currentStreak || 0) / 7, 1) * 219.9)}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-in-out"
                    />
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-lg font-display text-gray-900 dark:text-white">
                      {stats.currentStreak || 0}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <span className={`text-sm font-heading ${stats.currentStreak >= 7 ? 'text-green-700 dark:text-green-300' : stats.currentStreak >= 3 ? 'text-orange-700 dark:text-orange-300' : 'text-red-700 dark:text-red-300'}`}>
                  {stats.currentStreak >= 7 ? 'Sehr gut' : stats.currentStreak >= 3 ? 'Gut' : 'Üben'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progress Ring */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Dein Fortschritt</h2>
              <div className="flex justify-center">
                <ProgressRing
                  value={stats.currentLevel}
                  max={10}
                  size={120}
                  strokeWidth={12}
                  color={stats.currentLevel >= 7 ? '#8fb89e' : stats.currentLevel >= 3 ? '#f59e0b' : '#c65656'}
                  label="Level"
                />
              </div>
              <div className="text-center mt-4 space-y-2">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Level {stats.currentLevel}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{stats.totalXp} XP</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">🔥 {stats.currentStreak} Tage Streak</p>
              </div>
            </div>

            {/* Chapter Progress */}
            <ChapterProgress chapters={chapterProgress} />

            {/* Recent Activity */}
            <RecentActivity activities={recentActivity} />
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Quiz History */}
            <QuizHistory />

            {/* Error Review Section */}
            <ErrorReviewSection />

            {/* Quests Section */}
            <QuestsSection />

            {/* Badges Section */}
            <BadgesSection />
          </div>
        </div>

        {/* Competence Radar - Full Width */}
        <div className="mt-8">
          <CompetenceRadar chapterStats={realChapterStats} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
