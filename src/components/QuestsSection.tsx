import React, { useEffect } from 'react';
import { useQuizStatsStore } from '../store/quizStatsStore';

const QuestsSection: React.FC = () => {
  const { getActiveQuests, generateDailyQuests, generateWeeklyQuests } = useQuizStatsStore();
  
  useEffect(() => {
    // Generate daily and weekly quests if none exist
    const activeQuests = getActiveQuests();
    if (activeQuests.filter(q => q.type === 'daily').length === 0) {
      generateDailyQuests();
    }
    if (activeQuests.filter(q => q.type === 'weekly').length === 0) {
      generateWeeklyQuests();
    }
  }, [getActiveQuests, generateDailyQuests, generateWeeklyQuests]);
  
  const activeQuests = getActiveQuests();
  const dailyQuests = activeQuests.filter(q => q.type === 'daily');
  const weeklyQuests = activeQuests.filter(q => q.type === 'weekly');
  
  return (
    <div className="mb-8">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center mr-3">
              <span className="text-red-600 dark:text-red-400 text-lg">🎯</span>
            </div>
            Aktuelle Quests
          </h3>
        </div>
        
        <div className="space-y-8">
          {/* Daily Quests */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 dark:text-blue-400 text-sm">📅</span>
              </div>
              Tägliche Quests
            </h4>
            <div className="grid grid-cols-1 gap-6">
              {dailyQuests.map((quest) => {
                const progress = Math.min((quest.currentProgress / quest.target) * 100, 100);
                const isCompleted = quest.currentProgress >= quest.target;
                
                return (
                  <div key={quest.id} className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-900/20 dark:via-cyan-900/20 dark:to-teal-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Floating Particles */}
                    <div className="absolute top-3 right-3 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500 delay-100"></div>
                    <div className="absolute top-6 right-6 w-1 h-1 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500 delay-200"></div>
                    
                    <div className="relative z-10">
                      {/* Progress Circle - Top */}
                      <div className="flex justify-center mb-4">
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            {/* Background circle */}
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="2"
                              className="dark:stroke-gray-600"
                            />
                            {/* Progress circle */}
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={isCompleted ? "#10b981" : "#3b82f6"}
                              strokeWidth="2"
                              strokeDasharray={`${progress}, 100`}
                              strokeLinecap="round"
                              className="transition-all duration-700 ease-in-out"
                            />
                          </svg>
                          
                          {/* Center content */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {Math.round(progress)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quest Content */}
                      <div className="text-center">
                        <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                          {quest.title}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                          {quest.description}
                        </p>
                        
                        {/* Progress Info */}
                        <div className="flex items-center justify-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {quest.currentProgress}/{quest.target}
                            </span>
                          </div>
                          
                          {/* Reward Badge */}
                          <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full">
                            <span className="text-yellow-600 dark:text-yellow-400 text-sm mr-1">⭐</span>
                            <span className="text-yellow-700 dark:text-yellow-300 text-sm font-semibold">
                              {quest.reward.xp} XP
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Weekly Quests */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 dark:text-purple-400 text-sm">📊</span>
              </div>
              Wöchentliche Quests
            </h4>
            <div className="grid grid-cols-1 gap-6">
              {weeklyQuests.map((quest) => {
                const progress = Math.min((quest.currentProgress / quest.target) * 100, 100);
                const isCompleted = quest.currentProgress >= quest.target;
                
                return (
                  <div key={quest.id} className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
                    {/* Animated Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-rose-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Floating Particles */}
                    <div className="absolute top-3 right-3 w-2 h-2 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500 delay-100"></div>
                    <div className="absolute top-6 right-6 w-1 h-1 bg-pink-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500 delay-200"></div>
                    
                    <div className="relative z-10">
                      {/* Progress Circle - Top */}
                      <div className="flex justify-center mb-4">
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            {/* Background circle */}
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="2"
                              className="dark:stroke-gray-600"
                            />
                            {/* Progress circle */}
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={isCompleted ? "#10b981" : "#8b5cf6"}
                              strokeWidth="2"
                              strokeDasharray={`${progress}, 100`}
                              strokeLinecap="round"
                              className="transition-all duration-700 ease-in-out"
                            />
                          </svg>
                          
                          {/* Center content */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {Math.round(progress)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Quest Content */}
                      <div className="text-center">
                        <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                          {quest.title}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                          {quest.description}
                        </p>
                        
                        {/* Progress Info */}
                        <div className="flex items-center justify-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {quest.currentProgress}/{quest.target}
                            </span>
                          </div>
                          
                          {/* Reward Badge */}
                          <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full">
                            <span className="text-purple-600 dark:text-purple-400 text-sm mr-1">🏆</span>
                            <span className="text-purple-700 dark:text-purple-300 text-sm font-semibold">
                              {quest.reward.xp} XP
                              {quest.reward.badge && " + Badge"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestsSection;
