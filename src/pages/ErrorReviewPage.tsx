import React, { useState, useEffect } from 'react';
import { useQuizStatsStore } from '../store/quizStatsStore';
import { useSupabase } from '../hooks/useSupabase';
import { Link } from 'react-router-dom';
import { Question } from '../types';

const ErrorReviewPage: React.FC = () => {
  const { getErrorQuestions } = useQuizStatsStore();
  const { getQuestions } = useSupabase();
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load real questions from database
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true);
        const realQuestions = await getQuestions();
        setQuestions(realQuestions);
        console.log('ErrorReviewPage: Loaded questions from database:', realQuestions.length);
      } catch (error) {
        console.error('Error loading questions for ErrorReviewPage:', error);
        setQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, []); // Empty dependency array - only run once on mount
  
  const errorQuestions = getErrorQuestions(selectedChapter === 'all' ? undefined : selectedChapter);
  const chapters = [...new Set(errorQuestions.map(e => e.chapter))];
  
  // Get question details for display
  const getQuestionDetails = (questionId: string) => {
    return questions.find(q => q.id === questionId);
  };
  
  const totalErrors = errorQuestions.reduce((sum, e) => sum + e.errorCount, 0);
  const averageSuccessRate = errorQuestions.length > 0 
    ? Math.round(errorQuestions.reduce((sum, e) => sum + e.successRate, 0) / errorQuestions.length)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Fragen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🎯 Fehlerwiederholung
              </h1>
              <p className="text-gray-600">
                Übe deine falsch beantworteten Fragen für bessere Ergebnisse
              </p>
            </div>
            <Link
              to="/quiz"
              state={{ isReviewMode: true }}
              className="btn-primary"
            >
              Fehlerwiederholung starten
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-warning-50 border-warning-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning-800">{errorQuestions.length}</div>
              <div className="text-sm text-warning-600">Fragen mit Fehlern</div>
            </div>
          </div>
          <div className="card bg-danger-50 border-danger-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-danger-800">{totalErrors}</div>
              <div className="text-sm text-danger-600">Gesamtfehler</div>
            </div>
          </div>
          <div className="card bg-info-50 border-info-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-info-800">{averageSuccessRate}%</div>
              <div className="text-sm text-info-600">Durchschnittliche Erfolgsrate</div>
            </div>
          </div>
          <div className="card bg-success-50 border-success-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-800">{chapters.length}</div>
              <div className="text-sm text-success-600">Betroffene Kapitel</div>
            </div>
          </div>
        </div>

        {/* Chapter Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kapitel filtern
          </label>
          <select
            value={selectedChapter}
            onChange={(e) => setSelectedChapter(e.target.value)}
            className="input-field max-w-xs"
          >
            <option value="all">Alle Kapitel</option>
            {chapters.map(chapter => (
              <option key={chapter} value={chapter}>{chapter}</option>
            ))}
          </select>
        </div>

        {/* Error Questions List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Falsch beantwortete Fragen
          </h3>
          
          {errorQuestions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Keine Fehler mehr!
              </h3>
              <p className="text-gray-600 mb-6">
                Du hast alle Fragen richtig beantwortet. Mach ein neues Quiz um neue Herausforderungen zu finden!
              </p>
              <Link to="/quiz" className="btn-primary">
                Quiz starten
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {errorQuestions.map((error) => {
                const question = getQuestionDetails(error.questionId);
                if (!question) return null;
                
                return (
                  <div key={error.questionId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {error.chapter}
                          </span>
                          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {question.type === 'multiple_choice' ? 'Multiple Choice' :
                             question.type === 'true_false' ? 'Richtig/Falsch' :
                             question.type === 'matching' ? 'Zuordnung' :
                             question.type === 'image_question' ? 'Bildfrage' :
                             question.type === 'open_ended' ? 'Offene Frage' :
                             question.type === 'fill_blank' ? 'Lückentext' : 'Unbekannt'}
                          </span>
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-2">
                          {question.prompt}
                        </h4>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <span>
                            <span className="font-medium">Fehler:</span> {error.errorCount}x
                          </span>
                          <span>
                            <span className="font-medium">Versuche:</span> {error.totalAttempts}x
                          </span>
                          <span>
                            <span className="font-medium">Erfolgsrate:</span> {error.successRate}%
                          </span>
                          <span>
                            <span className="font-medium">Letzter Fehler:</span> {new Date(error.lastErrorDate).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          error.errorCount >= 3 ? 'bg-danger-100 text-danger-800' :
                          error.errorCount >= 2 ? 'bg-warning-100 text-warning-800' :
                          'bg-success-100 text-success-800'
                        }`}>
                          {error.errorCount >= 3 ? 'Kritisch' :
                           error.errorCount >= 2 ? 'Verbesserung nötig' :
                           'Fast beherrscht'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorReviewPage;


