import React from 'react';
import { Link } from 'react-router-dom';

interface Chapter {
  name: string;
  progress: number;
  totalQuestions: number;
  correctAnswers: number;
}

interface ChapterProgressProps {
  chapters: Chapter[];
}

const ChapterProgress: React.FC<ChapterProgressProps> = ({ chapters }) => {
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return '#8fb89e'; // Green
    if (progress >= 60) return '#f59e0b'; // Orange
    return '#c65656'; // Red
  };

  const getStatusText = (progress: number) => {
    if (progress >= 80) return 'Sehr gut';
    if (progress >= 60) return 'Gut';
    return 'Üben';
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 80) return 'text-green-700 dark:text-green-300';
    if (progress >= 60) return 'text-orange-700 dark:text-orange-300';
    return 'text-red-700 dark:text-red-300';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading text-gray-900 dark:text-white">
          Kapitel-Fortschritt
        </h3>
        <Link
          to="/chapters"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-heading"
        >
          Alle anzeigen →
        </Link>
      </div>
      
      <div className="space-y-4">
        {chapters.map((chapter, index) => {
          const radius = 28;
          const circumference = radius * 2 * Math.PI;
          const progressPercent = Math.min(chapter.progress, 100);
          const strokeDasharray = circumference;
          const strokeDashoffset = circumference - (progressPercent / 100) * circumference;
          const progressColor = getProgressColor(chapter.progress);

          return (
            <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200">
              <div className="flex items-center space-x-4">
                {/* Progress Ring */}
                <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
                  <svg
                    width={64}
                    height={64}
                    className="transform -rotate-90"
                  >
                    {/* Background circle */}
                    <circle
                      cx={32}
                      cy={32}
                      r={28}
                      stroke="#e5e7eb"
                      strokeWidth={6}
                      fill="transparent"
                      className="opacity-30"
                    />
                    {/* Progress circle */}
                    <circle
                      cx={32}
                      cy={32}
                      r={28}
                      stroke={progressColor}
                      strokeWidth={6}
                      fill="transparent"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-in-out"
                    />
                  </svg>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-xs font-display text-gray-900 dark:text-white">
                      {Math.round(progressPercent)}%
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-heading text-gray-900 dark:text-white truncate">{chapter.name}</h4>
                    <span className={`text-xs font-heading ${getStatusColor(chapter.progress)}`}>
                      {getStatusText(chapter.progress)}
                    </span>
                  </div>
                  
                  <p className="text-sm font-body text-gray-600 dark:text-gray-300 mb-2">
                    {chapter.correctAnswers} von {chapter.totalQuestions} Fragen richtig
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-body text-gray-500 dark:text-gray-400">
                      {chapter.totalQuestions - chapter.correctAnswers} Fragen übrig
                    </span>
                    <Link
                      to={`/quiz?chapter=${encodeURIComponent(chapter.name)}`}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-heading"
                    >
                      Üben →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChapterProgress;

