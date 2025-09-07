import React from 'react';
import { Link } from 'react-router-dom';
import { useQuizStatsStore } from '../store/quizStatsStore';

const ErrorReviewSection: React.FC = () => {
  const { getErrorQuestions } = useQuizStatsStore();
  const errorQuestions = getErrorQuestions();
  
  if (errorQuestions.length === 0) return null;
  
  const totalErrors = errorQuestions.reduce((sum, e) => sum + e.errorCount, 0);
  const maxErrors = Math.max(...errorQuestions.map(e => e.errorCount));
  
  return (
    <div className="mb-8">
      <div className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-8 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-red-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Floating Particles */}
        <div className="absolute top-3 right-3 w-2 h-2 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-all duration-500 delay-100"></div>
        <div className="absolute top-6 right-6 w-1 h-1 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-500 delay-200"></div>
        
        <div className="relative z-10">
          {/* Header with Icon */}
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center mr-4">
              <span className="text-red-600 dark:text-red-400 text-xl">🎯</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-300">
                Fehlerwiederholung verfügbar
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Übe deine falsch beantworteten Fragen für bessere Ergebnisse!
              </p>
            </div>
          </div>
          
          {/* Content */}
          <div className="mb-6">
            <p className="text-base text-gray-700 dark:text-gray-300 mb-4">
              Du hast <span className="font-bold text-red-600 dark:text-red-400">{errorQuestions.length}</span> Fragen falsch beantwortet.
            </p>
            
            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span><span className="font-medium">Gesamtfehler:</span> {totalErrors}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span><span className="font-medium">Höchste Fehlerrate:</span> {maxErrors}x</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/quiz?review=true"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 text-center text-sm shadow-sm hover:shadow-md"
            >
              🚀 Fehlerwiederholung starten
            </Link>
            <Link
              to="/errors"
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 text-center text-sm shadow-sm hover:shadow-md"
            >
              📊 Details anzeigen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorReviewSection;
