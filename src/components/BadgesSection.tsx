import React, { useEffect } from 'react';
import { useQuizStatsStore } from '../store/quizStatsStore';

const BadgesSection: React.FC = () => {
  const { getUnlockedBadges, initializeBadges } = useQuizStatsStore();
  
  useEffect(() => {
    // Initialize badges if none exist
    const unlockedBadges = getUnlockedBadges();
    if (unlockedBadges.length === 0) {
      initializeBadges();
    }
  }, [getUnlockedBadges, initializeBadges]);
  
  const unlockedBadges = getUnlockedBadges();
  
  if (unlockedBadges.length === 0) return null;
  
  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          🏆 Deine Badges
        </h3>
        
        <div className="space-y-3">
          {unlockedBadges.map((badge) => (
            <div key={badge.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xl flex-shrink-0">
                {badge.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">{badge.name}</h5>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-1 line-clamp-2">{badge.description}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {badge.unlockedAt && new Date(badge.unlockedAt).toLocaleDateString('de-DE')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BadgesSection;
