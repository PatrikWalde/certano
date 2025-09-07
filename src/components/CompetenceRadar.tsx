import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuizStatsStore } from '../store/quizStatsStore';

interface CompetenceRadarProps {
  chapterStats?: any[];
}

const CompetenceRadar: React.FC<CompetenceRadarProps> = ({ chapterStats: propChapterStats }) => {
  const { chapterStats: storeChapterStats } = useQuizStatsStore();
  
  // Use prop data if available, otherwise fall back to store data
  const chapterStats = propChapterStats || storeChapterStats;
  
  // Debug log
  console.log('CompetenceRadar - chapterStats:', chapterStats);
  
  // Transform chapter stats for radar chart
  const radarData = chapterStats.map(chapter => ({
    subject: chapter.chapter || chapter.name,
    A: chapter.progress || 0, // Success rate
    fullMark: 100,
  }));
  
  console.log('CompetenceRadar - radarData:', radarData);
  
  // If no data, show placeholder
  if (radarData.length === 0) {
    return (
      <div className="mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            🎯 Kompetenz-Radar
          </h3>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Noch keine Daten
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              Mache ein paar Quiz um dein Kompetenzprofil zu sehen!
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate average performance
  const averagePerformance = Math.round(
    radarData.reduce((sum, item) => sum + item.A, 0) / radarData.length
  );
  
  // Get performance level and color
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Exzellent', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/20' };
    if (score >= 80) return { level: 'Sehr gut', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/20' };
    if (score >= 70) return { level: 'Gut', color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' };
    if (score >= 60) return { level: 'Befriedigend', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/20' };
    return { level: 'Verbesserung nötig', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/20' };
  };
  
  const performanceInfo = getPerformanceLevel(averagePerformance);
  
  return (
    <div className="mb-8">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🎯 Kompetenz-Radar
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${performanceInfo.bgColor} ${performanceInfo.color}`}>
            {performanceInfo.level}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Radar Chart */}
          <div className="lg:col-span-2">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-600" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    className="dark:fill-gray-300"
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    className="dark:fill-gray-400"
                  />
                  <Radar
                    name="Kompetenz"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <p className="font-medium text-gray-900 dark:text-white">{label}</p>
                            <p className="text-blue-600 dark:text-blue-400">
                              Kompetenz: {payload[0].value}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Performance Summary */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {averagePerformance}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Durchschnittliche Kompetenz
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white text-center">
                Kapitel-Übersicht
              </h4>
              {radarData.map((item, index) => {
                const chapterPerformance = getPerformanceLevel(item.A);
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.subject}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            item.A >= 90 ? 'bg-green-500' :
                            item.A >= 80 ? 'bg-blue-500' :
                            item.A >= 70 ? 'bg-yellow-500' :
                            item.A >= 60 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${item.A}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${chapterPerformance.color}`}>
                        {item.A}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="text-center pt-4">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                💡 Tipp: Fokussiere dich auf Kapitel mit niedrigen Werten
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetenceRadar;
