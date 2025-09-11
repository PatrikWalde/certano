import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUserStats } from '../services/quizService';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load real user stats from Supabase
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('HomePage: Loading user stats...');
        const stats = await getUserStats();
        console.log('HomePage: User stats loaded:', stats);
        setUserStats(stats);
      } catch (error) {
        console.error('HomePage: Error loading user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserStats();
  }, [user?.id]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Lernen, das sich nach
              <span className="block text-yellow-300">Fortschritt anfühlt</span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Certano ist die Lern-App für Lokführer:innen. Quiz, Prüfungsvorbereitung 
              und Gamification für effektives Lernen in kurzen Pausen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/quiz"
                className="bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Quiz starten
              </Link>
              {!user && (
                <Link
                  to="/login"
                  className="border-2 border-white dark:border-gray-300 text-white dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  Kostenlos registrieren
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white dark:text-white mb-4">
              Weniger Klicks, mehr Aha-Momente
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 dark:text-gray-300 max-w-2xl mx-auto">
              Minimalistisch, schnell und fokussiert auf das Wesentliche
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Schnell-Quiz</h3>
              <p className="text-gray-600 dark:text-gray-300">
                5-10 Fragen für kurze Pausen mit sofortigem Feedback. 
                Perfekt für die Zugwende oder Pause im Depot.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Gamification</h3>
              <p className="text-gray-600 dark:text-gray-300">
                XP, Level, Streaks und Fortschrittsringe motivieren zum 
                kontinuierlichen Lernen und machen Fortschritt sichtbar.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Offline-fähig</h3>
              <p className="text-gray-600 dark:text-gray-300">
                PWA-Technologie ermöglicht Lernen auch bei schlechter 
                Netzabdeckung. Quizsets werden gecacht und später synchronisiert.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {user && (
        <section className="py-16 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading text-gray-900 dark:text-white mb-4">
                Dein Fortschritt
              </h2>
            </div>

            {/* Modern Progress Card */}
            <div className="max-w-md mx-auto mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-gray-500 dark:text-gray-400">Lade Fortschritt...</div>
                  </div>
                ) : (
                  <>
                    {/* Level Progress Ring */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg
                    width={128}
                    height={128}
                    className="transform -rotate-90"
                  >
                    {/* Background circle */}
                    <circle
                      cx={64}
                      cy={64}
                      r={56}
                      stroke="#e5e7eb"
                      strokeWidth={8}
                      fill="transparent"
                      className="opacity-30"
                    />
                    {/* Progress circle */}
                    <circle
                      cx={64}
                      cy={64}
                      r={56}
                      stroke="#3b82f6"
                      strokeWidth={8}
                      fill="transparent"
                      strokeDasharray={351.9}
                      strokeDashoffset={351.9 - (Math.min(((userStats?.total_xp || 0) % 1000) / 1000, 1) * 351.9)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-2xl font-display text-gray-900 dark:text-white mb-1">
                      {userStats?.current_level || 1}
                    </div>
                    <div className="text-xs font-heading text-gray-500 dark:text-gray-400">
                      Level
                    </div>
                  </div>
                </div>

                {/* Level Info */}
                <h3 className="text-xl font-heading text-gray-900 dark:text-white mb-2">
                  Level {userStats?.current_level || 1}
                </h3>
                <p className="text-sm font-body text-gray-600 dark:text-gray-300 mb-4">
                  {(userStats?.total_xp || 0).toLocaleString()} XP gesammelt
                </p>

                {/* XP Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${Math.min(((userStats?.total_xp || 0) % 1000) / 1000, 1) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs font-body text-gray-500 dark:text-gray-400 mb-6">
                  {1000 - ((userStats?.total_xp || 0) % 1000)} XP bis Level {(userStats?.current_level || 1) + 1}
                </p>

                {/* Streak */}
                <div className="flex items-center justify-center space-x-2 text-orange-600 dark:text-orange-400">
                  <span className="text-xl">🔥</span>
                  <span className="text-sm font-heading">
                    {userStats?.current_streak || 0} Tage Streak
                  </span>
                </div>
                  </>
                )}
              </div>
            </div>

            {/* Ultra-Modern Quiz Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Schnell-Quiz Card */}
              <Link
                to="/quiz"
                className="group relative overflow-hidden bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-2xl p-8 rounded-3xl border border-white/30 dark:border-gray-700/30 hover:border-blue-400/60 dark:hover:border-blue-400/60 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2"
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/5 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />
                
                {/* Floating Elements */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500" />
                <div className="absolute top-8 right-8 w-1 h-1 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500 delay-200" />
                
                {/* Modern Icon Container */}
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl shadow-blue-500/30 group-hover:shadow-blue-500/50">
                    <div className="relative">
                      <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {/* Icon glow effect */}
                      <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  </div>
                  {/* Energy particles */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-500 delay-100" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500 delay-300" />
                </div>
                
                {/* Ultra-Modern Typography */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-500 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-blue-800 dark:group-hover:from-blue-400 dark:group-hover:to-blue-600">
                      Schnell-Quiz
                    </h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500" />
                      <div className="w-1 h-1 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500 delay-100" />
                    </div>
                  </div>
                  <p className="text-base font-semibold text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 mb-4">
                    10 zufällige Fragen für kurze Pausen
                  </p>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200 group-hover:scale-105">
                      <span className="text-yellow-600 dark:text-yellow-400">⚡</span>
                      <span className="text-yellow-700 dark:text-yellow-300">Blitzschnell</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-300 group-hover:scale-105">
                      <span className="text-blue-600 dark:text-blue-400">🎯</span>
                      <span className="text-blue-700 dark:text-blue-300">Fokussiert</span>
                    </div>
                  </div>
                </div>
                
                {/* Modern Arrow Indicator */}
                <div className="absolute bottom-6 right-6 w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-2 group-hover:scale-110">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>

              {/* Kapitel-Quiz Card */}
              <Link
                to="/chapters"
                className="group relative overflow-hidden bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-2xl p-8 rounded-3xl border border-white/30 dark:border-gray-700/30 hover:border-green-400/60 dark:hover:border-green-400/60 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-2"
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-green-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />
                
                {/* Floating Elements */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500" />
                <div className="absolute top-8 right-8 w-1 h-1 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500 delay-200" />
                
                {/* Modern Icon Container */}
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 via-green-600 to-emerald-500 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl shadow-green-500/30 group-hover:shadow-green-500/50">
                    <div className="relative">
                      <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {/* Icon glow effect */}
                      <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  </div>
                  {/* Knowledge particles */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-500 delay-100" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500 delay-300" />
                </div>
                
                {/* Ultra-Modern Typography */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-all duration-500 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-green-600 group-hover:to-green-800 dark:group-hover:from-green-400 dark:group-hover:to-green-600">
                      Kapitel-Quiz
                    </h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500" />
                      <div className="w-1 h-1 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500 delay-100" />
                    </div>
                  </div>
                  <p className="text-base font-semibold text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 mb-4">
                    Nach Themen und Kapiteln lernen
                  </p>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200 group-hover:scale-105">
                      <span className="text-green-600 dark:text-green-400">📚</span>
                      <span className="text-green-700 dark:text-green-300">Strukturiert</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-300 group-hover:scale-105">
                      <span className="text-emerald-600 dark:text-emerald-400">🎓</span>
                      <span className="text-emerald-700 dark:text-emerald-300">Vertieft</span>
                    </div>
                  </div>
                </div>
                
                {/* Modern Arrow Indicator */}
                <div className="absolute bottom-6 right-6 w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-2 group-hover:scale-110">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>

              {/* Fehlerwiederholung Card */}
              <Link
                to="/errors"
                className="group relative overflow-hidden bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-2xl p-8 rounded-3xl border border-white/30 dark:border-gray-700/30 hover:border-orange-400/60 dark:hover:border-orange-400/60 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2"
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-orange-500/5 to-red-500/10 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />
                
                {/* Floating Elements */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500" />
                <div className="absolute top-8 right-8 w-1 h-1 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500 delay-200" />
                
                {/* Modern Icon Container */}
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl shadow-orange-500/30 group-hover:shadow-orange-500/50">
                    <div className="relative">
                      <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {/* Icon glow effect */}
                      <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  </div>
                  {/* Learning particles */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-500 delay-100" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500 delay-300" />
                </div>
                
                {/* Ultra-Modern Typography */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-all duration-500 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-orange-600 group-hover:to-red-600 dark:group-hover:from-orange-400 dark:group-hover:to-red-400">
                      Fehlerwiederholung
                    </h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500" />
                      <div className="w-1 h-1 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500 delay-100" />
                    </div>
                  </div>
                  <p className="text-base font-semibold text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 mb-4">
                    Lerne aus deinen Fehlern
                  </p>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200 group-hover:scale-105">
                      <span className="text-orange-600 dark:text-orange-400">🔄</span>
                      <span className="text-orange-700 dark:text-orange-300">Wiederholung</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-300 group-hover:scale-105">
                      <span className="text-red-600 dark:text-red-400">💡</span>
                      <span className="text-red-700 dark:text-red-300">Verbesserung</span>
                    </div>
                  </div>
                </div>
                
                {/* Modern Arrow Indicator */}
                <div className="absolute bottom-6 right-6 w-10 h-10 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-2 group-hover:scale-110">
                  <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>

              {/* Alle Kapitel Card */}
              <Link
                to="/dashboard"
                className="group relative overflow-hidden bg-gradient-to-br from-white/90 to-white/70 dark:from-gray-800/90 dark:to-gray-800/70 backdrop-blur-2xl p-8 rounded-3xl border border-white/30 dark:border-gray-700/30 hover:border-purple-400/60 dark:hover:border-purple-400/60 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2"
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-500/5 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100" />
                
                {/* Floating Elements */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500" />
                <div className="absolute top-8 right-8 w-1 h-1 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500 delay-200" />
                
                {/* Modern Icon Container */}
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-500 rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl shadow-purple-500/30 group-hover:shadow-purple-500/50">
                    <div className="relative">
                      <svg className="w-10 h-10 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      {/* Icon glow effect */}
                      <div className="absolute inset-0 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                  </div>
                  {/* Analytics particles */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce transition-all duration-500 delay-100" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500 delay-300" />
                </div>
                
                {/* Ultra-Modern Typography */}
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-all duration-500 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent group-hover:from-purple-600 group-hover:to-indigo-600 dark:group-hover:from-purple-400 dark:group-hover:to-indigo-400">
                      Alle Kapitel
                    </h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500" />
                      <div className="w-1 h-1 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500 delay-100" />
                    </div>
                  </div>
                  <p className="text-base font-semibold text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300 mb-4">
                    Übersicht und Statistiken
                  </p>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200 group-hover:scale-105">
                      <span className="text-purple-600 dark:text-purple-400">📊</span>
                      <span className="text-purple-700 dark:text-purple-300">Analytics</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-300 group-hover:scale-105">
                      <span className="text-indigo-600 dark:text-indigo-400">🎯</span>
                      <span className="text-indigo-700 dark:text-indigo-300">Übersicht</span>
                    </div>
                  </div>
                </div>
                
                {/* Modern Arrow Indicator */}
                <div className="absolute bottom-6 right-6 w-10 h-10 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-2 group-hover:scale-110">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!user && (
        <section className="py-20 bg-primary-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Bereit für den Start?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Registriere dich kostenlos und beginne noch heute mit dem Lernen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Kostenlos registrieren
              </Link>
              <Link
                to="/login"
                className="border-2 border-white dark:border-gray-300 text-white dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Bereits registriert?
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
