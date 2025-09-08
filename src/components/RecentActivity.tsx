import React from 'react';
import { Link } from 'react-router-dom';

interface Activity {
  date: string;
  questionsAnswered: number;
  accuracyRate: number;
  xpEarned: number;
}

interface RecentActivityProps {
  activities: Activity[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Letzte Aktivität
      </h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          // Wenn es die Standard-Nachricht ist, zeige sie anders an
          if (activity.date === 'Noch keine Quiz-Sessions' && activity.questionsAnswered === 0) {
            return (
              <div key={index} className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {activity.date}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Starte dein erstes Quiz!
                  </p>
                </div>
              </div>
            );
          }
          
          return (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{activity.date}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {activity.questionsAnswered} Fragen beantwortet
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.accuracyRate}% Richtig Beantwortet
                </p>
                <p className="text-sm text-success-600 dark:text-success-400">
                  +{activity.xpEarned} XP
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link
          to="/activity"
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Alle Aktivitäten anzeigen →
        </Link>
      </div>
    </div>
  );
};

export default RecentActivity;

