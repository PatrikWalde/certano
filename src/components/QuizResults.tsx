import React from 'react';
import { Question, SessionAnswer } from '../types';

// Helper function to convert old option format to new format
const convertOldOptions = (options: any[]): Array<{id: string, text: string, isCorrect: boolean}> => {
  if (!options || !Array.isArray(options)) return [];
  
  return options.map((option, index) => {
    if (typeof option === 'string') {
      return {
        id: `option-${index}`,
        text: option,
        isCorrect: false // Default to false for string options
      };
    } else if (option && typeof option === 'object') {
      return {
        id: option.id || `option-${index}`,
        text: option.text || option.option || option,
        isCorrect: option.isCorrect || false
      };
    }
    return {
      id: `option-${index}`,
      text: String(option),
      isCorrect: false
    };
  });
};

interface QuizResultsProps {
  questions: Question[];
  answers: SessionAnswer[];
  startTime: Date;
  onRestart: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  questions,
  answers,
  startTime,
  onRestart,
}) => {
  const endTime = new Date();
  const totalTime = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
  const correctAnswers = answers.filter(answer => answer.isCorrect).length;
  const answeredQuestions = answers.length;
  const accuracy = answeredQuestions > 0 ? Math.round((correctAnswers / answeredQuestions) * 100) : 0;
  const xpEarned = correctAnswers * 10; // 10 XP per correct answer

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceMessage = () => {
    if (accuracy >= 96) return { message: 'Glückwunsch, Du bist der neue Prüfungsexperte!', color: 'text-success-600' };
    if (accuracy >= 70) return { message: 'Glückwunsch, Du hast bestanden!', color: 'text-success-600' };
    if (accuracy >= 60) return { message: 'Knapp bestanden!', color: 'text-warning-600' };
    return { message: 'Leider nicht bestanden!', color: 'text-danger-600' };
  };

  const performance = getPerformanceMessage();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Results Header */}
      <div className="card text-center">
        <div className="mb-6">
          <div className={`text-4xl font-bold mb-2 ${performance.color}`}>
            {performance.message}
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Du hast {correctAnswers} von {answeredQuestions} Fragen richtig beantwortet
            {answeredQuestions < questions.length && (
              <span className="block text-sm text-gray-500 mt-1">
                ({questions.length - answeredQuestions} Fragen nicht beantwortet)
              </span>
            )}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-primary-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{accuracy}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Richtig Beantwortet</div>
          </div>
          
          <div className="bg-success-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-success-600">{correctAnswers}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Richtige Antworten</div>
          </div>
          
          <div className="bg-warning-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-warning-600">{formatTime(totalTime)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Benötigte Zeit</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">+{xpEarned}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">XP erhalten</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onRestart}
            className="btn-primary"
          >
            Neues Quiz starten
          </button>
          <a
            href="/dashboard"
            className="btn-secondary"
          >
            Zum Dashboard
          </a>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detaillierte Ergebnisse
        </h3>
        
        <div className="space-y-4">
          {questions
            .map((question, index) => {
              const answer = answers.find(a => a.questionId === question.id);
              return { question, answer, originalIndex: index };
            })
            .filter(({ answer }) => answer) // Only show answered questions
            .map(({ question, answer, originalIndex }) => {
              const isCorrect = answer!.isCorrect;
              
              return (
                <div
                  key={question.id}
                  className={`p-4 rounded-lg border-2 ${
                    isCorrect 
                      ? 'border-success-200 bg-success-50' 
                      : 'border-danger-200 bg-danger-50'
                  }`}
                >
                                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Frage {originalIndex + 1}
                      </span>
                    {/* Difficulty badge removed - difficulty feature no longer used */}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {isCorrect ? (
                      <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span className={`text-sm font-medium ${
                      isCorrect ? 'text-success-600' : 'text-danger-600'
                    }`}>
                      {isCorrect ? 'Richtig' : 'Falsch'}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-900 dark:text-white mb-2">{question.prompt}</p>
                
                {answer && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Deine Antwort:</strong>{' '}
                    {answer.userAnswer || 
                     (answer.selectedOptions && convertOldOptions(question.options)
                       .filter(opt => answer.selectedOptions?.includes(opt.id))
                       .map(opt => opt.text)
                       .join(', ')) || 
                     'Nicht beantwortet'}
                  </div>
                )}
                
                {question.explanation && (
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    <strong>Erklärung:</strong>
                    <div 
                      className="mt-1 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: question.explanation.replace(
                          /<p[^>]*data-f-id="pbf"[^>]*>.*?Powered by.*?<\/p>/gi, 
                          ''
                        ).replace(
                          /<p[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>.*?Powered by.*?<\/p>/gi, 
                          ''
                        )
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizResults;

