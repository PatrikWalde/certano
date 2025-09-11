import React from 'react';
import { usageService, UsageStats } from '../services/usageService';
import { useAuth } from '../hooks/useAuth';

interface UsageCounterProps {
  className?: string;
  showUpgrade?: boolean;
}

const UsageCounter: React.FC<UsageCounterProps> = ({ className = '', showUpgrade = true }) => {
  const { user } = useAuth();
  const [usageStats, setUsageStats] = React.useState<UsageStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (user?.id) {
      loadUsageStats();
    }
  }, [user?.id]);

  // Add refresh function
  const refreshUsageStats = () => {
    loadUsageStats();
  };

  const loadUsageStats = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('UsageCounter: Loading usage stats for user:', user.id);
      const stats = await usageService.getUsageStats(user.id);
      console.log('UsageCounter: Usage stats loaded:', stats);
      setUsageStats(stats);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usageStats) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  const isFreeUser = usageStats.subscriptionType === 'free';
  const isAdminUser = usageStats.subscriptionType === 'admin';
  const isLimitReached = !usageStats.canAnswerMore;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isAdminUser ? (
        <div className="flex items-center space-x-1">
          <span className="text-sm text-purple-600 font-medium">Admin</span>
          <span className="text-xs text-gray-500">Unbegrenzt</span>
          <button 
            onClick={refreshUsageStats}
            className="ml-2 text-xs text-gray-400 hover:text-gray-600"
            title="Aktualisieren"
          >
            ↻
          </button>
        </div>
      ) : isFreeUser ? (
        <>
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-600">
              Heute: {usageStats.dailyUsage}/5 Fragen
            </span>
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isLimitReached ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${(usageStats.dailyUsage / 5) * 100}%` }}
              ></div>
            </div>
          </div>
          
          {isLimitReached && showUpgrade && (
            <button 
              onClick={() => window.location.href = '/upgrade'}
              className="px-3 py-1 text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
            >
              Upgrade
            </button>
          )}
        </>
      ) : (
        <div className="flex items-center space-x-1">
          <span className="text-sm text-green-600 font-medium">Pro</span>
          <span className="text-xs text-gray-500">Unbegrenzt</span>
        </div>
      )}
    </div>
  );
};

export default UsageCounter;
