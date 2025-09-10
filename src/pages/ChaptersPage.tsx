import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuizStatsStore } from '../store/quizStatsStore';
import { useSupabase } from '../hooks/useSupabase';
import { Chapter } from '../store/chapterStore';
import { getChapterStats } from '../services/quizService';

const ChaptersPage: React.FC = () => {
  const { chapterStats, setChapterStats } = useQuizStatsStore();
  const { getChapters } = useSupabase();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log('ChaptersPage: Loading chapters from database...');
        const realChapters = await getChapters();
        console.log('ChaptersPage: Loaded chapters:', realChapters);
        setChapters(realChapters);

        console.log('ChaptersPage: Loading chapter stats from database...');
        const realChapterStats = await getChapterStats();
        console.log('ChaptersPage: Loaded chapter stats:', realChapterStats);
        console.log('ChaptersPage: First chapter stat structure:', realChapterStats[0]);
        setChapterStats(realChapterStats);
      } catch (error) {
        console.error('ChaptersPage: Error loading data:', error);
        setChapters([]);
        setChapterStats([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // Leere dependency array - lädt nur einmal beim Mount

  const getChapterProgress = (chapterName: string) => {
    console.log('ChaptersPage: Looking for progress for chapter:', chapterName);
    console.log('ChaptersPage: Available chapterStats:', chapterStats);
    console.log('ChaptersPage: Chapter names in stats:', chapterStats.map(c => c.name));
    const progress = chapterStats.find(c => c.name === chapterName);
    console.log('ChaptersPage: Found progress:', progress);
    return progress;
  };

  const getOverallProgress = () => {
    if (chapterStats.length === 0) return 0;
    const totalProgress = chapterStats.reduce((sum, c) => sum + c.progress, 0);
    return Math.round(totalProgress / chapterStats.length);
  };

  const getTotalQuestions = () => {
    return chapterStats.reduce((sum, c) => sum + c.totalQuestions, 0);
  };

  const getTotalCorrect = () => {
    return chapterStats.reduce((sum, c) => sum + c.correctAnswers, 0);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
    if (progress >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
    if (progress >= 40) return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
  };

  // getDifficultyLevel function removed - difficulty feature no longer used

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Lade Kapitel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Alle Kapitel
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Hier findest du alle Kapitel und deine Fortschritte
              </p>
            </div>
            <Link
              to="/dashboard"
              className="btn-secondary"
            >
              ← Zurück zum Dashboard
            </Link>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Gesamtfortschritt
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {getOverallProgress()}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Durchschnitt</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600 dark:text-success-400 mb-2">
                {chapters.filter(c => c.isActive).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Aktive Kapitel</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-warning-600 dark:text-warning-400 mb-2">
                {getTotalQuestions()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Fragen beantwortet</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {getTotalCorrect()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Richtige Antworten</div>
            </div>
          </div>
        </div>

        {/* Chapters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chapters
            .filter(chapter => chapter.isActive)
            .map((chapter) => {
              const progress = getChapterProgress(chapter.name);
              const progressData = progress || {
                totalQuestions: 0,
                correctAnswers: 0,
                progress: 0,
                lastPracticed: null,
              };
              
              // const difficulty = getDifficultyLevel(progressData.progress); // Removed - difficulty feature no longer used
              
              return (
                <div key={chapter.id} className="card hover:shadow-md transition-shadow">
                  {/* Chapter Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{chapter.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{chapter.name}</h3>
                        {/* Difficulty badge removed - difficulty feature no longer used */}
                      </div>
                    </div>
                  </div>

                  {/* Chapter Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {chapter.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fortschritt</span>
                      <span className={`text-sm font-bold ${getProgressColor(progressData.progress)}`}>
                        {progressData.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progressData.progress >= 80 ? 'bg-green-500' :
                          progressData.progress >= 60 ? 'bg-blue-500' :
                          progressData.progress >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${progressData.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {progressData.totalQuestions}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">Fragen</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {progressData.correctAnswers}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">Richtig</div>
                    </div>
                  </div>

                  {/* Last Practiced */}
                  {progressData.lastPracticed && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Zuletzt geübt: {formatDate(progressData.lastPracticed)}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/quiz?chapter=${encodeURIComponent(chapter.name)}`}
                      className="flex-1 btn-primary text-center"
                    >
                      Üben
                    </Link>
                    {progressData.progress >= 80 && (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">✅ Meister</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Inactive Chapters */}
        {chapters.filter(c => !c.isActive).length > 0 && (
          <div className="mt-8">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Inaktive Kapitel
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chapters
                  .filter(chapter => !chapter.isActive)
                  .map((chapter) => (
                    <div key={chapter.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{chapter.icon}</span>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{chapter.name}</h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                            Inaktiv
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {chapter.description}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChaptersPage;
