import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface LeaderboardUser {
  id: string;
  firstName: string;
  lastName: string;
  totalXp: number;
  level: number;
  avatar?: string;
  showOnLeaderboard: boolean;
}

const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Fetch all users (we'll filter by privacy settings later)
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch user stats for each user
      const { data: stats, error: statsError } = await supabase
        .from('user_stats')
        .select('user_id, total_xp, current_level')
        .in('user_id', profiles?.map(p => p.id) || []);

      if (statsError) throw statsError;

      // Combine profile and stats data, filter by privacy settings
      const leaderboardData = profiles?.map(profile => {
        const userStats = stats?.find(s => s.user_id === profile.id);
        return {
          id: profile.id,
          firstName: profile.first_name || profile.full_name?.split(' ')[0] || 'Unbekannt',
          lastName: profile.last_name || profile.full_name?.split(' ').slice(1).join(' ') || '',
          totalXp: userStats?.total_xp || 0,
          level: userStats?.current_level || 1,
          avatar: profile.avatar,
          showOnLeaderboard: true // For now, show all users until we add privacy settings
        };
      }).filter(user => user.showOnLeaderboard && user.totalXp > 0) || [];

      // Sort by XP descending
      leaderboardData.sort((a, b) => b.totalXp - a.totalXp);

      setLeaderboard(leaderboardData);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Fehler beim Laden der Bestenliste');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return 'text-yellow-500';
      case 1: return 'text-gray-400';
      case 2: return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Lade Bestenliste...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Fehler</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🏆 Bestenliste
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Die besten Lernenden der Community
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="text-blue-500 text-xl mr-3">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Datenschutz-Hinweis
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Nur Nutzer, die in ihren Datenschutz-Einstellungen "In Bestenlisten anzeigen" aktiviert haben, 
                werden hier angezeigt. Du kannst diese Einstellung jederzeit in deinem Profil ändern.
              </p>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Noch keine Bestenliste
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Aktiviere "In Bestenlisten anzeigen" in deinem Profil, um hier zu erscheinen!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((user, index) => (
              <div
                key={user.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 transition-all duration-200 ${
                  user.id === user?.id 
                    ? 'border-primary-500 shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Rank */}
                    <div className="flex items-center">
                      <div className={`text-2xl font-bold mr-4 ${getRankColor(index)}`}>
                        {getRankIcon(index)}
                      </div>
                      
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mr-4">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-primary-600 dark:text-primary-400 font-semibold text-lg">
                            {user.firstName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      {/* Name */}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Level {user.level}
                        </p>
                      </div>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                        {user.totalXp.toLocaleString()} XP
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Gesamtpunkte
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Your Position */}
        {user && leaderboard.length > 0 && (
          <div className="mt-8 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-primary-900 dark:text-primary-100">
                  Deine Position
                </h3>
                <p className="text-primary-800 dark:text-primary-200 text-sm">
                  {leaderboard.findIndex(u => u.id === user.id) + 1} von {leaderboard.length}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  {leaderboard.find(u => u.id === user.id)?.totalXp.toLocaleString() || 0} XP
                </div>
                <div className="text-sm text-primary-700 dark:text-primary-300">
                  Level {leaderboard.find(u => u.id === user.id)?.level || 1}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
