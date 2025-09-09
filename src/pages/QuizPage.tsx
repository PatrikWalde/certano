import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSupabase } from '../hooks/useSupabase';
import { useOfflineStorage } from '../hooks/useOfflineStorage';
import { Question } from '../types';
import QuizConfig from '../components/QuizConfig';
import QuizQuestion from '../components/QuizQuestion';
import QuizResults from '../components/QuizResults';
import QuizTimer from '../components/QuizTimer';
import { saveQuizSession, QuizSessionData } from '../services/quizService';
import { useQuizStatsStore } from '../store/quizStatsStore';

interface QuizConfigData {
  questionCount: number;
  timeLimit?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showExplanations: boolean;
  allowSkip: boolean;
  chapter?: string;
}

const QuizPage: React.FC = () => {
  const { getQuestions, loading, error } = useSupabase();
  const { saveQuizResult, isOnline, loadOfflineQuestions, saveOfflineQuestions } = useOfflineStorage();
  const location = useLocation();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{
    questionId: string;
    selectedOptions?: string[];
    userAnswer?: string;
    fillBlankAnswers?: string[];
    isCorrect: boolean;
    timeSpent: number;
    answeredAt: string;
    chapter?: string;
  }>>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isQuickQuiz, setIsQuickQuiz] = useState(false);
  const [quizConfig, setQuizConfig] = useState<QuizConfigData | null>(null);

  useEffect(() => {
    // Prüfe ob eine Schnell-Quiz Konfiguration übergeben wurde
    if (location.state?.config && location.state?.isQuickQuiz) {
      const quickQuizConfig = location.state.config;
      console.log('Quick Quiz Config:', quickQuizConfig);
      console.log('Quick Quiz Questions:', quickQuizConfig.questions);
      setQuestions(quickQuizConfig.questions || []);
      setIsQuickQuiz(true);
      setQuizStarted(true);
      setStartTime(new Date());
      setCurrentQuestionIndex(0);
      setAnswers([]);
    } else {
      loadData();
    }
  }, [location.state]);

  const loadData = async () => {
    try {
      let questionsData: Question[] = [];
      
      if (isOnline) {
        // Online: Lade Fragen von Server
        questionsData = await getQuestions();
        // Speichere Fragen offline für späteren Gebrauch
        await saveOfflineQuestions(questionsData);
        console.log('Fragen online geladen und offline gespeichert:', questionsData.length);
      } else {
        // Offline: Lade Fragen aus lokalem Speicher
        questionsData = await loadOfflineQuestions();
        console.log('Fragen offline geladen:', questionsData.length);
        
        if (questionsData.length === 0) {
          console.warn('Keine offline verfügbaren Fragen gefunden');
        }
      }
      
      setQuestions(questionsData);
    } catch (err) {
      console.error('Error loading data:', err);
      
      // Fallback: Versuche offline Fragen zu laden
      if (isOnline) {
        try {
          const offlineQuestions = await loadOfflineQuestions();
          if (offlineQuestions.length > 0) {
            setQuestions(offlineQuestions);
            console.log('Fallback: Offline Fragen geladen:', offlineQuestions.length);
          }
        } catch (offlineErr) {
          console.error('Error loading offline questions:', offlineErr);
        }
      }
    }
  };

  const handleConfigSubmit = (config: QuizConfigData) => {
    // Speichere die Konfiguration
    setQuizConfig(config);
    
    // Filter questions based on config
    let filteredQuestions = questions;
    
    if (config.chapter && config.chapter !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.chapter === config.chapter);
    }

    // Shuffle questions if enabled
    if (config.shuffleQuestions) {
      filteredQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5);
    }

    // Limit to requested question count
    filteredQuestions = filteredQuestions.slice(0, config.questionCount);

    if (filteredQuestions.length === 0) {
      alert('Keine Fragen mit den gewählten Kriterien gefunden. Bitte ändere deine Auswahl.');
      return;
    }

    setQuestions(filteredQuestions);
    setQuizStarted(true);
    setStartTime(new Date());
    setTimeRemaining(config.timeLimit || null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
  };

  const handleAnswer = (answer: {
    questionId: string;
    selectedOptions?: string[];
    userAnswer?: string;
    fillBlankAnswers?: string[];
    isCorrect: boolean;
    timeSpent: number;
    answeredAt: string;
  }) => {
    // Finde das Kapitel für diese Frage
    const currentQuestion = questions[currentQuestionIndex];
    const answerWithChapter = {
      ...answer,
      chapter: currentQuestion?.chapter || 'Unbekannt'
    };
    setAnswers(prev => [...prev, answerWithChapter]);
    // Don't automatically go to next question - let the user see the result first
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeQuiz();
    }
  };

  // const handleSkip = () => {
  //   const currentQuestion = questions && questions.length > 0 ? questions[currentQuestionIndex] : null;
  //   if (!currentQuestion) return;
  //   
  //   const answer = {
  //     questionId: currentQuestion.id,
  //     selectedOptions: [],
  //     userAnswer: '',
  //     fillBlankAnswers: [],
  //     isCorrect: false,
  //     timeSpent: 0,
  //     answeredAt: new Date().toISOString()
  //   };

  //   setAnswers(prev => [...prev, answer]);

  //   if (currentQuestionIndex < questions.length - 1) {
  //     setCurrentQuestionIndex(prev => prev + 1);
  //   } else {
  //     completeQuiz();
  //   }
  // };

  const completeQuiz = async () => {
    try {
      // Berechne Quiz-Statistiken
      const correctAnswers = answers.filter(answer => answer.isCorrect).length;
      const accuracyRate = answers.length > 0 ? (correctAnswers / answers.length) * 100 : 0;
      const totalTimeSeconds = startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0;
      const xpEarned = Math.floor(correctAnswers * 10 + (accuracyRate / 100) * 50); // XP basierend auf richtigen Antworten und Genauigkeit

      // Bestimme Session-Typ
      const sessionType = isQuickQuiz ? 'quick_quiz' : 'chapter_quiz';
      
      // Erstelle Session-Daten
      const sessionData: QuizSessionData = {
        sessionType,
        chapterName: questions[0]?.chapter, // Erste Frage für Kapitel-Name
        totalQuestions: questions.length,
        correctAnswers,
        accuracyRate,
        totalTimeSeconds,
        xpEarned,
        answers
      };

      // Speichere Quiz-Session (Online oder Offline)
      if (isOnline) {
        try {
          await saveQuizSession(sessionData);
          console.log('Quiz-Ergebnisse online gespeichert:', sessionData);
          
          // Zusätzlich: Speichere in quiz_attempts Tabelle für "Letzte Aktivität"
          const { addAttempt } = useQuizStatsStore.getState();
          const chapters = [...new Set(questions.map(q => q.chapter).filter(chapter => chapter !== 'all'))];
          
          console.log('💾 About to save quiz attempt to quiz_attempts (v2):', {
            date: new Date().toISOString(),
            questionsAnswered: questions.length,
            correctAnswers,
            accuracyRate,
            xpEarned,
            chapters,
            timeSpent: totalTimeSeconds,
          });
          
          await addAttempt({
            date: new Date().toISOString(),
            questionsAnswered: questions.length,
            correctAnswers,
            accuracyRate,
            xpEarned,
            chapters,
            timeSpent: totalTimeSeconds,
          });
          
          console.log('✅ Quiz attempt saved to quiz_attempts successfully');
        } catch (error) {
          console.error('Online-Speicherung fehlgeschlagen, speichere offline:', error);
          // Fallback: Offline speichern
          await saveQuizResult({
            questions,
            answers,
            startTime: startTime!,
            endTime: new Date(),
            score: correctAnswers,
            totalQuestions: questions.length,
            chapter: questions[0]?.chapter,
          });
        }
      } else {
        // Offline speichern
        await saveQuizResult({
          questions,
          answers,
          startTime: startTime!,
          endTime: new Date(),
          score: correctAnswers,
          totalQuestions: questions.length,
          chapter: questions[0]?.chapter,
        });
        console.log('Quiz-Ergebnisse offline gespeichert');
      }
      
    } catch (error) {
      console.error('Fehler beim Speichern der Quiz-Ergebnisse:', error);
    } finally {
      setQuizCompleted(true);
      setQuizStarted(false);
    }
  };

  const restartQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setStartTime(null);
    setTimeRemaining(null);
  };

  const currentQuestion = questions && questions.length > 0 ? questions[currentQuestionIndex] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Quiz wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Fehler beim Laden</h1>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <QuizResults
        questions={questions}
        answers={answers}
        startTime={startTime!}
        onRestart={restartQuiz}
      />
    );
  }

  // Fehlerbehandlung: Quiz gestartet aber keine Fragen
  if (quizStarted && (!questions || questions.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Keine Fragen verfügbar</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Es wurden keine Fragen für das Quiz gefunden.
          </p>
          <button
            onClick={restartQuiz}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          >
            Zurück zur Konfiguration
          </button>
        </div>
      </div>
    );
  }

  if (quizStarted && currentQuestion && questions.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-4">
          {/* Quiz Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6 transition-colors duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quiz läuft</h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Frage {currentQuestionIndex + 1} von {questions.length}
                </p>
              </div>
              {timeRemaining && (
                <QuizTimer
                  timeRemaining={timeRemaining}
                />
              )}
            </div>
          </div>

          {/* Current Question */}
          <QuizQuestion
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            onNextQuestion={goToNextQuestion}
            shuffleOptions={quizConfig?.shuffleOptions ?? true}
            showExplanations={quizConfig?.showExplanations ?? true}
          />
        </div>
      </div>
    );
  }

  // Quiz Configuration
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {isQuickQuiz ? 'Schnell-Quiz' : 'Quiz starten'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isQuickQuiz 
              ? '10 zufällige Fragen aus allen Kapiteln' 
              : 'Konfiguriere dein Quiz und starte mit dem Lernen'
            }
          </p>
        </div>

        {!isQuickQuiz && <QuizConfig onConfigSubmit={handleConfigSubmit} />}
      </div>
    </div>
  );
};

export default QuizPage;
