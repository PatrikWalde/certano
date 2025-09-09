import React, { useState, useEffect } from 'react';
import { QuizConfig as QuizConfigType, Question, SessionAnswer } from '../types';
import { useQuizStatsStore } from '../store/quizStatsStore';
import QuizQuestion from './QuizQuestion';
import QuizProgress from './QuizProgress';
import QuizTimer from './QuizTimer';

interface QuizSessionProps {
  config: QuizConfigType;
  questions: Question[];
  onComplete: (answers: SessionAnswer[]) => void;
  startTime: Date;
}

const QuizSession: React.FC<QuizSessionProps> = ({
  config,
  questions,
  onComplete,
  startTime,
}) => {
  const { updateUserStats, updateChapterStats, addAttempt, trackQuestionError, updateQuestProgress } = useQuizStatsStore();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    config.timeLimit || null
  );
  const [isCompleted, setIsCompleted] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Timer effect
  useEffect(() => {
    if (!timeRemaining || isCompleted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isCompleted]);

  // Reset canProceed when question changes
  useEffect(() => {
    setCanProceed(false);
  }, [currentQuestionIndex]);

  const handleAnswer = (answer: SessionAnswer) => {
    // Clear any existing auto-advance timer
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
    }
    
    const newAnswers = [...answers];
    const existingAnswerIndex = newAnswers.findIndex(
      (a) => a.questionId === answer.questionId
    );

    if (existingAnswerIndex >= 0) {
      newAnswers[existingAnswerIndex] = answer;
    } else {
      newAnswers.push(answer);
    }

    setAnswers(newAnswers);
    setCanProceed(true); // Enable the "Weiter" button after answering

    // Update statistics
    const currentQuestion = questions[currentQuestionIndex];
    const timeSpent = Date.now() - (startTime as unknown as number);
    
    // Update user stats (XP calculation: 10 for correct, 5 for incorrect)
    const xpEarned = answer.isCorrect ? 10 : 5;
    
    // Use requestAnimationFrame to avoid blocking the main thread
    requestAnimationFrame(() => {
      updateUserStats(answer.isCorrect, xpEarned, timeSpent / 1000); // Convert to seconds
      
      // Update chapter stats if chapter is available
      if (currentQuestion.chapter && currentQuestion.chapter !== 'all') {
        updateChapterStats(currentQuestion.chapter, answer.isCorrect);
      }
      
      // Track question errors for spaced repetition
      trackQuestionError(currentQuestion.id, currentQuestion.chapter, answer.isCorrect);
      
      // Update quest progress
      updateQuestProgress('daily-questions', 1); // Increment daily questions quest
      if (answer.isCorrect) {
        updateQuestProgress('daily-accuracy', Math.round((answers.filter(a => a.isCorrect).length / answers.length) * 100));
      }
    });

    // Auto-advance to next question after showing result
    // Only auto-advance for non-image questions to avoid performance issues
    if (currentQuestion.type !== 'image_question') {
      const timer = setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setCanProceed(false); // Reset for next question
        } else {
          handleComplete();
        }
      }, 10000); // 10 Sekunden Wartezeit für bessere UX
      
      // Store timer reference
      setAutoAdvanceTimer(timer);
    }
  };

  // Function to enable the "Weiter" button when an option is selected
  const handleOptionSelected = () => {
    setCanProceed(true);
  };

  const handleSkip = () => {
    if (!config.allowSkip) return;

    const skipAnswer: SessionAnswer = {
      questionId: currentQuestion.id,
      isCorrect: false,
      timeSpent: 0,
      answeredAt: new Date().toISOString(),
    };

    handleAnswer(skipAnswer);
  };

  const handleNext = () => {
    // Clear any pending auto-advance timer
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
    
    if (currentQuestionIndex < questions.length - 1 && canProceed) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCanProceed(false); // Reset for next question
    } else {
      handleComplete();
    }
  };





  const handleComplete = async () => {
    // Clear any pending auto-advance timer
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      setAutoAdvanceTimer(null);
    }
    
    // If there's a current question that hasn't been answered yet, ask for confirmation
    if (!answers.find(a => a.questionId === currentQuestion.id)) {
      const confirmed = window.confirm(
        'Die aktuelle Frage wurde noch nicht beantwortet. Möchtest du das Quiz wirklich beenden?'
      );
      if (!confirmed) {
        return;
      }
    }
    
    setIsCompleted(true);
    
    // Save complete quiz attempt to statistics
    const totalTime = Date.now() - (startTime as unknown as number);
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const accuracyRate = Math.round((correctAnswers / answers.length) * 100);
    const totalXp = answers.reduce((sum, answer) => sum + (answer.isCorrect ? 10 : 5), 0);
    
    // Get unique chapters from answered questions
    const chapters = [...new Set(
      questions
        .filter((_, index) => answers[index])
        .map(q => q.chapter)
        .filter(chapter => chapter !== 'all')
    )];
    
    // Save quiz attempt to database and local store
    try {
      console.log('💾 About to save quiz attempt:', {
        date: new Date().toISOString(),
        questionsAnswered: answers.length,
        correctAnswers,
        accuracyRate,
        xpEarned: totalXp,
        chapters,
        timeSpent: totalTime / 1000,
      });
      
      await addAttempt({
        date: new Date().toISOString(),
        questionsAnswered: answers.length,
        correctAnswers,
        accuracyRate,
        xpEarned: totalXp,
        chapters,
        timeSpent: totalTime / 1000, // Convert to seconds
      });
      
      console.log('✅ Quiz attempt saved successfully');
    } catch (error) {
      console.error('❌ Error saving quiz attempt:', error);
    }
    
    onComplete(answers);
  };

  if (isCompleted) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Quiz wird ausgewertet...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Quiz - {config.chapter === 'all' ? 'Alle Kapitel' : config.chapter}
          </h1>
          {timeRemaining !== null && (
            <QuizTimer timeRemaining={timeRemaining} />
          )}
        </div>

        <QuizProgress
          current={currentQuestionIndex + 1}
          total={questions.length}
          progress={progress}
        />
      </div>

      {/* Question */}
      <div className="card">
        <QuizQuestion
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
          onSkip={config.allowSkip ? handleSkip : undefined}
          shuffleOptions={config.shuffleOptions}
          showExplanations={config.showExplanations}
          onOptionSelected={handleOptionSelected}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Frage {currentQuestionIndex + 1} von {questions.length}
          </div>
          <button
            onClick={handleComplete}
            className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 border border-red-300 rounded hover:bg-red-50 transition-colors"
            title="Quiz frühzeitig beenden"
          >
            Quiz beenden
          </button>
        </div>

        <button
          onClick={handleNext}
          disabled={currentQuestionIndex === questions.length - 1 ? false : !canProceed}
          className={`btn-primary ${(currentQuestionIndex === questions.length - 1 ? false : !canProceed) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {currentQuestionIndex === questions.length - 1 ? 'Beenden' : 'Weiter →'}
        </button>
      </div>
    </div>
  );
};

export default QuizSession;

