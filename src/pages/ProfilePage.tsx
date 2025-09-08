import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
// import { useSupabase } from '../hooks/useSupabase';
import { getUserStats, getChapterStats, getQuizSessions } from '../services/quizService';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  // const { supabase } = useSupabase();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState<any>(null);
  const [chapterStats, setChapterStats] = useState<any[]>([]);
  const [quizSessions, setQuizSessions] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    city: user?.city || '',
    evu: user?.evu || '',
    showOnLeaderboard: user?.privacySettings.showOnLeaderboard || true,
    allowAnalytics: user?.privacySettings.allowAnalytics || true,
  });

  // Load user statistics and data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        console.log('Loading user profile data...');
        
        // Load user statistics, chapter stats, and recent quiz sessions
        const [userStatsData, chapterStatsData, quizSessionsData] = await Promise.all([
          getUserStats(),
          getChapterStats(),
          getQuizSessions(10) // Letzte 10 Sessions
        ]);
        
        console.log('User stats loaded:', userStatsData);
        console.log('Chapter stats loaded:', chapterStatsData);
        console.log('Quiz sessions loaded:', quizSessionsData);
        
        setUserStats(userStatsData || {});
        setChapterStats(chapterStatsData || []);
        setQuizSessions(quizSessionsData || []);
        
        // If user is admin, also load additional admin data
        if (user.role === 'admin') {
          console.log('Admin user detected, loading additional admin data...');
          await loadAdminUserData();
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // const loadAdminUserData = async () => {
    //   try {
    //     // Load all users from admin database (same as AdminPage does)
    //     const { data: usersData, error: usersError } = await supabase
    //       .from('user_profiles')
    //       .select('*')
    //       .order('created_at', { ascending: false });

    //     if (!usersError && usersData) {
    //       console.log('Admin: Loaded users from database:', usersData.length);
    //       // We could store this data in state if needed for admin features
    //     }
    //   } catch (error) {
    //     console.error('Error loading admin user data:', error);
    //   }
    // };

    loadUserData();
  }, [user?.id, user?.role]);

  // Update formData when user data changes
  React.useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        city: user.city || '',
        evu: user.evu || '',
        showOnLeaderboard: user.privacySettings.showOnLeaderboard || true,
        allowAnalytics: user.privacySettings.allowAnalytics || true,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (user) {
      try {
        await updateUser({
          firstName: formData.firstName,
          lastName: formData.lastName,
          city: formData.city,
          evu: formData.evu,
          privacySettings: {
            showOnLeaderboard: formData.showOnLeaderboard,
            allowAnalytics: formData.allowAnalytics,
          },
        });
        setIsEditing(false);
        console.log('Profil erfolgreich aktualisiert');
      } catch (error) {
        console.error('Fehler beim Aktualisieren des Profils:', error);
        setIsEditing(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      city: user?.city || '',
      evu: user?.evu || '',
      showOnLeaderboard: user?.privacySettings.showOnLeaderboard || true,
      allowAnalytics: user?.privacySettings.allowAnalytics || true,
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Benutzer nicht gefunden
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Profil
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Verwalte deine Kontoinformationen und Einstellungen
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Kontoinformationen
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-secondary"
                  >
                    Bearbeiten
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vorname
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                    placeholder="Dein Vorname"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nachname
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                    placeholder="Dein Nachname"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stadt
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                    placeholder="Deine Stadt"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    EVU (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.evu}
                    onChange={(e) => setFormData({ ...formData, evu: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                    placeholder="Dein EVU"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    E-Mail-Adresse
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="input-field bg-gray-50 dark:bg-gray-700"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    E-Mail-Adresse kann nicht geändert werden
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Benutzerrolle
                  </label>
                  <input
                    type="text"
                    value={user.role === 'user' ? 'Lernender' : user.role === 'editor' ? 'Editor' : 'Administrator'}
                    disabled
                    className="input-field bg-gray-50 dark:bg-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Registriert seit
                  </label>
                  <input
                    type="text"
                    value={new Date(user.createdAt).toLocaleDateString('de-DE')}
                    disabled
                    className="input-field bg-gray-50 dark:bg-gray-700"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleCancel}
                    className="btn-secondary"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary"
                  >
                    Speichern
                  </button>
                </div>
              )}
            </div>

            {/* Privacy Settings */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Datenschutz-Einstellungen
              </h2>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!!formData.showOnLeaderboard}
                    onChange={(e) => setFormData({ ...formData, showOnLeaderboard: e.target.checked })}
                    disabled={!isEditing}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      In Bestenlisten anzeigen
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Erlaubt es anderen, deine Fortschritte in Bestenlisten zu sehen
                    </p>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!!formData.allowAnalytics}
                    onChange={(e) => setFormData({ ...formData, allowAnalytics: e.target.checked })}
                    disabled={!isEditing}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Analytics erlauben
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Hilft uns, die App zu verbessern (anonyme Daten)
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Detailed Statistics */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Detaillierte Statistiken
              </h2>
              
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {userStats?.totalQuizzes || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Quiz absolviert
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {userStats?.correctAnswers || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Richtige Antworten
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {chapterStats.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Kapitel bearbeitet
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {userStats?.totalQuizzes > 0 
                        ? Math.round((userStats.correctAnswers / (userStats.correctAnswers + userStats.incorrectAnswers)) * 100) 
                        : 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Erfolgsrate
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Quiz Statistics */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quiz-Statistiken
              </h3>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Gesamt Quiz</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {userStats?.totalQuizzes || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Richtige Antworten</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {userStats?.correctAnswers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Falsche Antworten</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {userStats?.incorrectAnswers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Erfolgsrate</span>
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      {userStats?.totalQuizzes > 0 
                        ? Math.round((userStats.correctAnswers / (userStats.correctAnswers + userStats.incorrectAnswers)) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chapter Progress */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Kapitel-Fortschritt
              </h3>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {chapterStats.slice(0, 3).map((chapter: any) => (
                    <div key={chapter.chapter_id}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {chapter.chapter_title}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {chapter.completion_rate || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${chapter.completion_rate || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {chapterStats.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Noch keine Kapitel bearbeitet
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Letzte Aktivität
              </h3>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {quizSessions.slice(0, 3).map((session: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {session.chapter_title || 'Quiz'}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(session.completed_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${
                        session.score >= 80 ? 'text-green-600 dark:text-green-400' :
                        session.score >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {session.score}%
                      </span>
                    </div>
                  ))}
                  {quizSessions.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      Noch keine Quiz-Sessions
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Admin Section */}
            {user?.role === 'admin' && (
              <div className="card border-l-4 border-l-red-500">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  Admin-Bereich
                </h3>
                <div className="space-y-3">
                  <a
                    href="/admin"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Admin-Dashboard
                  </a>
                  <a
                    href="/admin?tab=users"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Benutzer verwalten
                  </a>
                  <a
                    href="/admin?tab=stats"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    System-Statistiken
                  </a>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Schnellzugriff
              </h3>
              <div className="space-y-3">
                <a
                  href="/dashboard"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/quiz"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Quiz starten
                </a>
                <a
                  href="/help"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Hilfe & Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

