import React, { useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';
import { ChapterData, Topic } from '../types';

interface QuizConfigProps {
  onConfigSubmit: (config: QuizConfigData) => void;
}

interface QuizConfigData {
  questionCount: number;
  timeLimit?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanations: boolean;
  allowSkip: boolean;
  chapter?: string;
}

const QuizConfig: React.FC<QuizConfigProps> = ({ onConfigSubmit }) => {
  const { getChapters, getTopics, loading, error } = useSupabase();
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>(['all']);
  const [config, setConfig] = useState<QuizConfigData>({
    questionCount: 10,
    timeLimit: undefined, // Kein Zeitlimit
    shuffleQuestions: true, // Automatisch aktiv
    shuffleOptions: true, // Automatisch aktiv
    showExplanations: true, // Automatisch aktiv
    allowSkip: false, // Automatisch deaktiviert
    chapter: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [chaptersData, topicsData] = await Promise.all([
        getChapters(),
        getTopics()
      ]);
      setChapters(chaptersData);
      setTopics(topicsData);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleChapterToggle = (chapterName: string) => {
    setSelectedChapters(prev => {
      if (chapterName === 'all') {
        // "Alle Kapitel" umschalten
        return prev.includes('all') ? [] : ['all'];
      }
      
      const newSelection = prev.includes(chapterName)
        ? prev.filter(c => c !== chapterName)
        : [...prev.filter(c => c !== 'all'), chapterName];
      
      // Wenn keine Kapitel ausgewählt sind, wähle "Alle Kapitel"
      if (newSelection.length === 0) {
        return ['all'];
      }
      
      return newSelection;
    });
  };

  const handleTopicToggle = (topicId: string) => {
    const topicChapters = chapters.filter(chapter => chapter.topicId === topicId);
    const topicChapterNames = topicChapters.map(chapter => chapter.name);
    
    setSelectedChapters(prev => {
      // Prüfe ob alle Kapitel des Themas bereits ausgewählt sind
      const allTopicChaptersSelected = topicChapterNames.every(name => prev.includes(name));
      
      if (allTopicChaptersSelected) {
        // Alle Kapitel des Themas abwählen
        const newSelection = prev.filter(c => !topicChapterNames.includes(c));
        return newSelection.length === 0 ? ['all'] : newSelection;
      } else {
        // Alle Kapitel des Themas auswählen
        const newSelection = [...prev.filter(c => c !== 'all'), ...topicChapterNames];
        return newSelection;
      }
    });
  };

  const isTopicFullySelected = (topicId: string) => {
    // Wenn "Alle Kapitel" ausgewählt ist, ist auch jedes Thema vollständig ausgewählt
    if (selectedChapters.includes('all')) {
      return true;
    }
    
    const topicChapters = chapters.filter(chapter => chapter.topicId === topicId);
    const topicChapterNames = topicChapters.map(chapter => chapter.name);
    return topicChapterNames.length > 0 && topicChapterNames.every(name => selectedChapters.includes(name));
  };

  const isTopicPartiallySelected = (topicId: string) => {
    // Wenn "Alle Kapitel" ausgewählt ist, gibt es keine teilweise ausgewählten Themen
    if (selectedChapters.includes('all')) {
      return false;
    }
    
    const topicChapters = chapters.filter(chapter => chapter.topicId === topicId);
    const topicChapterNames = topicChapters.map(chapter => chapter.name);
    return topicChapterNames.some(name => selectedChapters.includes(name)) && !isTopicFullySelected(topicId);
  };

  const isChapterSelected = (chapterName: string) => {
    // Wenn "Alle Kapitel" ausgewählt ist, ist auch jedes einzelne Kapitel ausgewählt
    return selectedChapters.includes('all') || selectedChapters.includes(chapterName);
  };

  const hasSelectedChapters = () => {
    // Prüft ob mindestens ein Kapitel ausgewählt ist
    // "Alle Kapitel" zählt als gültige Auswahl
    return selectedChapters.length > 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Konvertiere selectedChapters zu config.chapter
    const finalConfig = {
      ...config,
      chapter: selectedChapters.includes('all') ? 'all' : selectedChapters.join(',')
    };
    
    onConfigSubmit(finalConfig);
  };


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quiz konfigurieren</h2>
      
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Anzahl Fragen
          </label>
          <select
            value={config.questionCount}
            onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value={5}>5 Fragen</option>
            <option value={10}>10 Fragen</option>
            <option value={15}>15 Fragen</option>
            <option value={20}>20 Fragen</option>
            <option value={30}>30 Fragen</option>
          </select>
        </div>


        {/* Chapter Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Kapitel auswählen
          </label>
          
          <div className="space-y-2 border border-gray-200 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-700/50">
            {/* Alle Kapitel */}
            <div className="flex items-center">
              <input
                id="all-chapters"
                type="checkbox"
                checked={selectedChapters.includes('all')}
                onChange={() => handleChapterToggle('all')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="all-chapters" className="ml-2 block text-sm font-medium text-gray-900 dark:text-white">
                Alle Kapitel
              </label>
            </div>

            {/* Themen und Kapitel */}
            {topics.map((topic) => {
              const topicChapters = chapters.filter(chapter => chapter.topicId === topic.id);
              
              if (topicChapters.length === 0) return null;
              
              return (
                <div key={topic.id} className="ml-4">
                  {/* Thema mit Checkbox */}
                  <div className="flex items-center py-1">
                    <input
                      id={`topic-${topic.id}`}
                      type="checkbox"
                      checked={isTopicFullySelected(topic.id)}
                      ref={(input) => {
                        if (input) {
                          input.indeterminate = isTopicPartiallySelected(topic.id);
                        }
                      }}
                      onChange={() => handleTopicToggle(topic.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor={`topic-${topic.id}`} className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      {topic.icon} {topic.name}
                    </label>
                  </div>
                  
                  {/* Kapitel unter dem Thema */}
                  <div className="ml-4 space-y-1">
                    {topicChapters.map((chapter) => (
                      <div key={chapter.id} className="flex items-center">
                        <input
                          id={`chapter-${chapter.id}`}
                          type="checkbox"
                          checked={isChapterSelected(chapter.name)}
                          onChange={() => handleChapterToggle(chapter.name)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label htmlFor={`chapter-${chapter.id}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          {chapter.icon} {chapter.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Kapitel ohne Thema */}
            {(() => {
              const chaptersWithoutTopic = chapters.filter(chapter => !chapter.topicId);
              if (chaptersWithoutTopic.length === 0) return null;
              
              return (
                <div className="ml-4">
                  {/* Ohne Thema */}
                  <div className="flex items-center py-1">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      📁 Ohne Thema
                    </span>
                  </div>
                  
                  {/* Kapitel ohne Thema */}
                  <div className="ml-4 space-y-1">
                    {chaptersWithoutTopic.map((chapter) => (
                      <div key={chapter.id} className="flex items-center">
                        <input
                          id={`chapter-${chapter.id}`}
                          type="checkbox"
                          checked={isChapterSelected(chapter.name)}
                          onChange={() => handleChapterToggle(chapter.name)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                        />
                        <label htmlFor={`chapter-${chapter.id}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                          {chapter.icon} {chapter.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>



        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !hasSelectedChapters()}
          className={`w-full py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
            loading || !hasSelectedChapters()
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800 focus:ring-blue-500'
          }`}
        >
          {loading ? 'Wird geladen...' : !hasSelectedChapters() ? 'Bitte Kapitel auswählen' : 'Quiz starten'}
        </button>
      </form>
    </div>
  );
};

export default QuizConfig;
