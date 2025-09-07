import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  progress?: number;
  max?: number;
  showProgress?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  progress,
  max = 100,
  showProgress = false,
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-100 dark:bg-blue-800',
          progress: '#3b82f6',
        };
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          text: 'text-green-700 dark:text-green-300',
          iconBg: 'bg-green-100 dark:bg-green-800',
          progress: '#8fb89e',
        };
      case 'warning':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          text: 'text-orange-700 dark:text-orange-300',
          iconBg: 'bg-orange-100 dark:bg-orange-800',
          progress: '#f59e0b',
        };
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-700 dark:text-red-300',
          iconBg: 'bg-red-100 dark:bg-red-800',
          progress: '#c65656',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-100 dark:bg-blue-800',
          progress: '#3b82f6',
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-100 dark:bg-blue-800',
          progress: '#3b82f6',
        };
    }
  };

  const colors = getColorClasses();

  if (showProgress && progress !== undefined) {
    const radius = 35;
    const circumference = radius * 2 * Math.PI;
    const progressPercent = Math.min((progress / max) * 100, 100);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
    
    // Ensure no NaN values
    const safeStrokeDashoffset = isNaN(strokeDashoffset) ? circumference : strokeDashoffset;

    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-heading text-gray-600 dark:text-gray-300 mb-1">{title}</p>
          <p className={`text-2xl font-display ${colors.text}`}>{value}</p>
          {subtitle && (
            <p className="text-sm font-body text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
          
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg
              width={80}
              height={80}
              className="transform -rotate-90"
            >
              {/* Background circle */}
              <circle
                cx={40}
                cy={40}
                r={radius}
                stroke="#e5e7eb"
                strokeWidth={8}
                fill="transparent"
                className="opacity-30"
              />
              {/* Progress circle */}
              <circle
                cx={40}
                cy={40}
                r={radius}
                stroke={colors.progress}
                strokeWidth={8}
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={safeStrokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-sm font-display text-gray-900 dark:text-white">
                {Math.round(progressPercent)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-heading text-gray-600 dark:text-gray-300 mb-1">{title}</p>
          <p className={`text-2xl font-display ${colors.text}`}>{value}</p>
          {subtitle && (
            <p className="text-sm font-body text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        
        {icon && (
          <div className={`w-12 h-12 ${colors.iconBg} rounded-lg flex items-center justify-center`}>
            <span className="text-2xl">{icon}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;

