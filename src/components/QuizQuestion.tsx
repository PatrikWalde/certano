import React, { useState, useEffect } from 'react';
import { Question, SessionAnswer, FillBlankOption } from '../types';

interface QuizQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: SessionAnswer) => void;
  onNextQuestion?: () => void;
  onSkip?: () => void;
  shuffleOptions: boolean;
  showExplanations: boolean;
  onOptionSelected?: () => void;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  onNextQuestion,
  shuffleOptions,
  showExplanations,
  onOptionSelected,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  // Hilfsfunktion zur Konvertierung alter Datenstruktur
  const convertOldOptions = (options: any) => {
    if (Array.isArray(options)) {
      return options;
    } else if (options && typeof options === 'object') {
      const oldFormat = options as any;
      if (oldFormat.options && Array.isArray(oldFormat.options)) {
        // Support both single correct answer and multiple correct answers
        const correctAnswers = Array.isArray(oldFormat.correct) ? oldFormat.correct : [oldFormat.correct];
        return oldFormat.options.map((text: string, index: number) => ({
          id: `option-${index}`,
          text: text,
          isCorrect: correctAnswers.includes(text)
        }));
      }
    }
    return [];
  };

  const [shuffledOptions, setShuffledOptions] = useState(convertOldOptions(question.options));
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [shuffledRightSide, setShuffledRightSide] = useState<string[]>([]);
  const [selectedLeftItem, setSelectedLeftItem] = useState<string | null>(null);
  const [showSelfAssessment, setShowSelfAssessment] = useState(false);
  const [selfAssessmentAnswer, setSelfAssessmentAnswer] = useState<'yes' | 'no' | null>(null);
  const [fillBlankAnswers, setFillBlankAnswers] = useState<string[]>([]);
  const [shuffledFillBlankOptions, setShuffledFillBlankOptions] = useState<FillBlankOption[]>([]);

  // Reset state when question changes
  useEffect(() => {
    console.log('QuizQuestion useEffect triggered for question:', question.id, 'type:', question.type);
    console.log('Question options:', question.options);
    
    setSelectedOptions([]);
    setUserAnswer('');
    setShowResult(false);
    setIsCorrect(false);
    setStartTime(Date.now());
    setMatchingSelections({});
    setSelectedLeftItem(null);
    setShowSelfAssessment(false);
    setSelfAssessmentAnswer(null);
    setFillBlankAnswers([]);
    
    // Konvertiere alte Datenstruktur zu neuer Format
    const safeOptions = convertOldOptions(question.options);
    
    if (question.type === 'matching' && question.matchingPairs) {
      // For matching questions, shuffle the right side
      const rightSideTexts = question.matchingPairs.map(pair => pair.rightText);
      const shuffled = shuffleOptions ? [...rightSideTexts].sort(() => Math.random() - 0.5) : rightSideTexts;
      setShuffledRightSide(shuffled);
    } else if (question.type === 'fill_blank' && question.fillBlankOptions) {
      // For fill blank questions, shuffle the options
      const shuffled = shuffleOptions ? [...question.fillBlankOptions].sort(() => Math.random() - 0.5) : question.fillBlankOptions;
      setShuffledFillBlankOptions(shuffled);
    } else if (shuffleOptions && safeOptions.length > 0) {
      const shuffled = [...safeOptions].sort(() => Math.random() - 0.5);
      setShuffledOptions(shuffled);
    } else {
      setShuffledOptions(safeOptions);
    }
  }, [question.id, questionNumber, shuffleOptions]);

  const handleOptionSelect = async (optionId: string) => {
    if (showResult) return;

    if (question.type === 'multiple_choice') {
      // For multiple choice, allow multiple selections
      setSelectedOptions(prev => {
        const newOptions = prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId];
        return newOptions;
      });
    } else if (question.type === 'true_false') {
      // For true/false questions, single selection with immediate result
      setSelectedOptions([optionId]);
      
      // Auto-submit for true/false questions immediately (no setTimeout)
      await handleSubmitWithOptions([optionId]);
    } else {
      // For other question types, single selection
      setSelectedOptions([optionId]);
    }
  };

  const handleLeftItemSelect = (leftId: string) => {
    if (showResult) return;
    
    // If this left item is already matched, deselect it
    if (matchingSelections[leftId]) {
      setMatchingSelections(prev => {
        const newSelections = { ...prev };
        delete newSelections[leftId];
        return newSelections;
      });
      setSelectedLeftItem(null);
    } else {
      setSelectedLeftItem(leftId);
    }
  };

  const handleRightItemSelect = (rightText: string) => {
    if (showResult || !selectedLeftItem) return;
    
    // Check if this right item is already used
    const isAlreadyUsed = Object.values(matchingSelections).includes(rightText);
    if (isAlreadyUsed) return;
    
    // Create the match
    setMatchingSelections(prev => ({
      ...prev,
      [selectedLeftItem]: rightText
    }));
    setSelectedLeftItem(null);
  };

  const handleSubmitWithOptions = async (optionsToUse: string[]) => {
    if (showResult) return;

    // ⚠️ FREEMIUM CHECK: Check usage limit BEFORE processing answer
    const { supabase } = await import('../lib/supabase');
    const { usageService } = await import('../services/usageService');
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (currentUser && currentUser.email !== 'pw@patrikwalde.com') {
      // Check and increment usage for free users
      const usageResult = await usageService.incrementUsage(currentUser.id);
      
      if (usageResult.limitReached) {
        alert('🚨 Tägliches Limit erreicht!\n\nDu hast deine 5 kostenlosen Fragen für heute aufgebraucht.\n\nUpgrade auf Pro für unbegrenzte Fragen!');
        window.location.href = '/upgrade';
        return; // Stop processing - don't count this answer
      }
      
      console.log('🔥 FREEMIUM SYSTEM ACTIVE: Usage incremented to:', usageResult.newUsage, 'for user', currentUser.email);
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    let correct = false;

    if (question.type === 'matching' && question.matchingPairs) {
      // Check if all matching pairs are correct
      const allPairsMatched = question.matchingPairs.every(pair => 
        matchingSelections[pair.id] === pair.rightText
      );
      correct = allPairsMatched && Object.keys(matchingSelections).length === question.matchingPairs.length;
    } else if (question.type === 'fill_blank' && question.fillBlankOptions) {
      // Check if all fill blank answers are correct
      const correctAnswers = question.fillBlankOptions
        .filter(option => option.isCorrect)
        .sort((a, b) => (a.blankIndex || 0) - (b.blankIndex || 0));
      
      correct = fillBlankAnswers.length === correctAnswers.length &&
        fillBlankAnswers.every((answerId, index) => {
          const selectedOption = question.fillBlankOptions?.find(opt => opt.id === answerId);
          const correctOption = correctAnswers[index];
          return selectedOption && correctOption && selectedOption.id === correctOption.id;
        });
    } else if (question.type === 'open_ended' && !question.isOpenQuestion) {
      // For regular open-ended questions, we'll assume correct for now
      // In a real app, this would be evaluated differently
      correct = userAnswer.trim().length > 0;
    } else if ((question.type === 'image_question' || question.type === 'open_ended') && question.isOpenQuestion) {
      // For self-evaluation questions, we don't set correctness here
      // It will be set later in handleSelfAssessment
      correct = false; // Temporary value, will be updated in handleSelfAssessment
    } else {
      // Check if selected options match correct answers
      const convertedOptions = convertOldOptions(question.options);
      const correctOptionIds = convertedOptions
        .filter((option: any) => option.isCorrect)
        .map((option: any) => option.id);
      
      correct = optionsToUse.length === correctOptionIds.length &&
        optionsToUse.every(id => correctOptionIds.includes(id));
    }

    setIsCorrect(correct);
    
    if ((question.type === 'image_question' || question.type === 'open_ended') && question.isOpenQuestion) {
      // For self-evaluation questions, show result directly (explanation + self-assessment)
      setShowResult(true);
      setShowSelfAssessment(true);
    } else {
      setShowResult(true);
    }

    // Enable the "Weiter" button after the answer is submitted
    if (onOptionSelected) {
      onOptionSelected();
    }

    // For self-evaluation questions, don't send answer yet
    // It will be sent in handleSelfAssessment
    if (!((question.type === 'image_question' || question.type === 'open_ended') && question.isOpenQuestion)) {
      const answer: SessionAnswer = {
        questionId: question.id,
        selectedOptions: question.type !== 'open_ended' && question.type !== 'matching' && question.type !== 'fill_blank' ? optionsToUse : undefined,
        userAnswer: question.type === 'open_ended' ? userAnswer : undefined,
        fillBlankAnswers: question.type === 'fill_blank' ? fillBlankAnswers : undefined,
        isCorrect: correct,
        timeSpent,
        answeredAt: new Date().toISOString(),
      };

      onAnswer(answer);
    }
  };

  const handleSubmit = async () => {
    if (question.type === 'open_ended' && question.isOpenQuestion) {
      // For self-evaluation open questions, submit without options
      await handleSubmitWithOptions([]);
    } else {
      await handleSubmitWithOptions(selectedOptions);
    }
  };

  const handleSelfAssessment = (answer: 'yes' | 'no') => {
    setSelfAssessmentAnswer(answer);
    setShowSelfAssessment(false);
    setShowResult(true);
    
    // Update the answer with the correct self-assessment result
    const correct = answer === 'yes';
    setIsCorrect(correct);
    
    // Create updated answer with correct self-assessment
    const updatedAnswer: SessionAnswer = {
      questionId: question.id,
      selectedOptions: undefined,
      userAnswer: undefined,
      isCorrect: correct,
      timeSpent: Math.floor((Date.now() - startTime) / 1000),
      answeredAt: new Date().toISOString(),
    };
    
    onAnswer(updatedAnswer);
  };

  const getQuestionTypeLabel = () => {
    switch (question.type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true_false':
        return 'Richtig/Falsch';
      case 'matching':
        return 'Zuordnung';
      case 'image_question':
        return 'Bildfrage';
      case 'open_ended':
        return 'Offene Frage';
      case 'fill_blank':
        return 'Lückentext';
      default:
        return 'Frage';
    }
  };

  const canSubmit = () => {
    if (question.type === 'matching' && question.matchingPairs) {
      return Object.keys(matchingSelections).length === question.matchingPairs.length;
    }
    if (question.type === 'fill_blank' && question.fillBlankOptions) {
      return fillBlankAnswers.length === question.blankCount;
    }
    if (question.type === 'open_ended' && !question.isOpenQuestion) {
      return userAnswer.trim().length > 0;
    }
    if ((question.type === 'image_question' || question.type === 'open_ended') && question.isOpenQuestion) {
      // For self-evaluation questions, always allow submission
      return true;
    }
    // For multiple choice and other question types, check if at least one option is selected
    return selectedOptions.length > 0;
  };

  // Check if this question was already answered (for back navigation)
  const isQuestionAnswered = () => {
    const hasOpenAnswer = question.type === 'open_ended' && !question.isOpenQuestion && userAnswer.trim().length > 0;
    const hasSelfEval = (question.type === 'image_question' || question.type === 'open_ended') && question.isOpenQuestion;
    const hasFillBlankAnswers = question.type === 'fill_blank' && fillBlankAnswers.length > 0;
    return showResult || selectedOptions.length > 0 || hasOpenAnswer || hasSelfEval || Object.keys(matchingSelections).length > 0 || hasFillBlankAnswers || showSelfAssessment;
  };

  // Get the appropriate button text based on question state
  const getButtonText = () => {
    if (showResult) {
      return 'Weiter';
    }
    
    if (isQuestionAnswered()) {
      if (question.type === 'multiple_choice') {
        return 'Antwort prüfen';
      } else if (question.type === 'matching') {
        return 'Zuordnung prüfen';
      } else if (question.type === 'fill_blank') {
        return 'Lücken prüfen';
      } else if (question.type === 'open_ended' && !question.isOpenQuestion) {
        return 'Antwort prüfen';
      } else if ((question.type === 'image_question' || question.type === 'open_ended') && question.isOpenQuestion) {
        return 'Antwort prüfen';
      } else if (question.type === 'true_false') {
        return 'Antwort prüfen';
      } else {
        return 'Antwort prüfen';
      }
    }
    
    return 'Antworten';
  };

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="bg-primary-100 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 text-sm font-medium px-3 py-1 rounded-full">
            {getQuestionTypeLabel()}
          </span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400">
          {questionNumber} / {totalQuestions}
        </span>
      </div>

      {/* Question Text */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white dark:text-white mb-4">
          {question.prompt}
        </h2>
        
        {question.media && question.type === 'image_question' && (
          <div className="mb-6">
            <img
              src={question.media}
              alt="Frage"
              className="max-w-full h-auto rounded-lg border border-gray-200"
            />
          </div>
        )}

        {/* Self-Evaluation for Image Questions and Open Questions */}
        {(question.type === 'image_question' || question.type === 'open_ended') && question.isOpenQuestion && !showResult && (
          <div className="mb-6">
            <div className="text-center">
              <p className="text-lg font-medium text-gray-700 mb-4">
                Denke dir die Antwort aus und klicke dann auf "Antwort prüfen"
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Du musst nichts eintippen - nur die Antwort im Kopf haben!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Answer Options or Matching Pairs */}
      {question.type === 'matching' && question.matchingPairs ? (
        // Duolingo-style Matching Question UI
        <div className="space-y-4">
          {/* Instructions */}
          <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            {selectedLeftItem ? 
              "Wähle jetzt das passende Element auf der rechten Seite" :
              "Wähle zuerst ein Element auf der linken Seite"
            }
          </div>
          
          {/* Left and Right side side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left side - clickable items */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Linke Seite</h3>
              <div className="space-y-3">
                {question.matchingPairs.map((pair) => {
                  const isSelected = selectedLeftItem === pair.id;
                  const isMatched = matchingSelections[pair.id];
                  const isCorrect = showResult && matchingSelections[pair.id] === pair.rightText;
                  const isIncorrect = showResult && matchingSelections[pair.id] && matchingSelections[pair.id] !== pair.rightText;
                  
                  let itemClass = "p-4 border-2 rounded-lg cursor-pointer transition-all w-full text-left";
                  if (showResult) {
                    if (isCorrect) {
                      itemClass += " border-green-500 bg-green-50";
                    } else if (isIncorrect) {
                      itemClass += " border-red-500 bg-red-50";
                    } else {
                      itemClass += " border-gray-300 bg-gray-50";
                    }
                  } else if (isSelected) {
                    itemClass += " border-primary-500 bg-primary-50";
                  } else if (isMatched) {
                    itemClass += " border-blue-300 bg-blue-50";
                  } else {
                    itemClass += " border-gray-300 hover:border-gray-400 hover:bg-gray-50";
                  }
                  
                  return (
                    <button
                      key={pair.id}
                      onClick={() => handleLeftItemSelect(pair.id)}
                      disabled={showResult}
                      className={itemClass}
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{pair.leftText}</span>
                      {isMatched && !showResult && (
                        <div className="mt-1 text-sm text-blue-600">
                          ✓ {matchingSelections[pair.id]}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Right side - clickable items */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Rechte Seite</h3>
              <div className="space-y-3">
                {shuffledRightSide.map((rightText) => {
                  const isUsed = Object.values(matchingSelections).includes(rightText);
                  const isSelected = selectedLeftItem && !isUsed;
                  
                  let itemClass = "p-4 border-2 rounded-lg transition-all w-full text-left";
                  if (showResult) {
                                         // Find which pair this belongs to
                     const correctPair = question.matchingPairs?.find(pair => pair.rightText === rightText);
                    const userSelection = Object.entries(matchingSelections).find(([_, value]) => value === rightText);
                    const isCorrect = userSelection && correctPair && userSelection[1] === correctPair.rightText;
                    
                    if (isCorrect) {
                      itemClass += " border-green-500 bg-green-50";
                    } else if (userSelection) {
                      itemClass += " border-red-500 bg-red-50";
                    } else {
                      itemClass += " border-gray-300 bg-gray-50";
                    }
                  } else if (isUsed) {
                    itemClass += " border-blue-300 bg-blue-50 cursor-not-allowed";
                  } else if (isSelected) {
                    itemClass += " border-primary-500 bg-primary-50 cursor-pointer hover:bg-primary-100";
                  } else {
                    itemClass += " border-gray-300 bg-gray-50 cursor-not-allowed opacity-50";
                  }
                  
                  return (
                    <button
                      key={rightText}
                      onClick={() => handleRightItemSelect(rightText)}
                      disabled={showResult || isUsed || !selectedLeftItem}
                      className={itemClass}
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{rightText}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : question.type === 'fill_blank' && question.fillBlankOptions ? (
        // Fill Blank Question UI
        <div className="space-y-6">
          {/* Instructions */}
          <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            Wähle für jede Lücke das passende Wort aus der Liste unten
          </div>
          
          {/* Question text with blanks */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-lg text-gray-900 dark:text-white leading-relaxed">
              {question.prompt.split('___').map((part, index) => (
                <React.Fragment key={index}>
                  {part}
                  {index < (question.blankCount || 0) && (
                    <span className="inline-block mx-2">
                      {fillBlankAnswers[index] ? (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded border border-blue-300 font-medium">
                          {shuffledFillBlankOptions.find(opt => opt.id === fillBlankAnswers[index])?.text}
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-200 text-gray-500 dark:text-gray-400 rounded border border-gray-300 font-medium">
                          [Lücke {index + 1}]
                        </span>
                      )}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          
          {/* Available options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Verfügbare Wörter</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {shuffledFillBlankOptions.map((option) => {
                const isUsed = fillBlankAnswers.includes(option.id);
                
                let optionClass = "p-3 border-2 rounded-lg transition-all text-center font-medium";
                if (showResult) {
                  const isCorrect = option.isCorrect;
                  if (isCorrect) {
                    optionClass += " border-green-500 bg-green-50 text-green-800";
                  } else {
                    optionClass += " border-red-500 bg-red-50 text-red-800";
                  }
                } else if (isUsed) {
                  optionClass += " border-blue-300 bg-blue-50 text-blue-800 cursor-not-allowed";
                } else {
                  optionClass += " border-gray-300 bg-white hover:border-primary-500 hover:bg-primary-50 cursor-pointer";
                }
                
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      if (!isUsed && !showResult) {
                        const nextBlankIndex = fillBlankAnswers.length;
                        if (nextBlankIndex < (question.blankCount || 0)) {
                          setFillBlankAnswers(prev => [...prev, option.id]);
                        }
                      }
                    }}
                    disabled={isUsed || showResult}
                    className={optionClass}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Clear answers button */}
          {fillBlankAnswers.length > 0 && !showResult && (
            <div className="text-center">
              <button
                onClick={() => setFillBlankAnswers([])}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 text-sm underline"
              >
                Alle Antworten löschen
              </button>
            </div>
          )}
        </div>
      ) : question.type !== 'open_ended' ? (
        // Regular Answer Options UI
        <div className="space-y-3">
          {Array.isArray(shuffledOptions) ? shuffledOptions.map((option) => {
            const isSelected = selectedOptions.includes(option.id);
            const showAsCorrect = showResult && option.isCorrect;
            const showAsIncorrect = showResult && isSelected && !option.isCorrect;
            
            let optionClass = 'quiz-option';
            if (showResult) {
              if (showAsCorrect) optionClass += ' correct';
              if (showAsIncorrect) optionClass += ' incorrect';
            } else if (isSelected) {
              optionClass += ' selected';
            }

            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                disabled={showResult}
                className={optionClass}
              >
                <div className="flex items-center justify-between">
                  <span>{option.text}</span>
                  {showResult && option.isCorrect && (
                    <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {showResult && showAsIncorrect && (
                    <svg className="w-5 h-5 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            );
          }) : (
            <div className="text-gray-500 dark:text-gray-400 text-center py-4">
              Keine Antwortoptionen verfügbar
            </div>
          )}
        </div>
      ) : null}

      {/* Open-ended Question Input */}
      {question.type === 'open_ended' && !question.isOpenQuestion && (
        <div>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Deine Antwort..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={4}
            disabled={showResult}
          />
        </div>
      )}


      {/* Self-Assessment for Image Questions and Open Questions */}
      {showResult && ((question.type === 'image_question' || question.type === 'open_ended') && question.isOpenQuestion) && (
        <div className="space-y-4">
          {/* Explanation */}
          {question.explanation && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-700">
                <strong>Erklärung:</strong> {question.explanation}
              </p>
            </div>
          )}
          
          {/* Self-Assessment Prompt */}
          {showSelfAssessment && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="text-lg font-medium text-yellow-800 mb-3">
                Deine Antwort bewerten
              </h4>
              <p className="text-yellow-700 mb-4">
                Hattest du die Antwort richtig gewusst?
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleSelfAssessment('yes')}
                  className="px-6 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors"
                >
                  Ja, richtig gewusst
                </button>
                <button
                  onClick={() => handleSelfAssessment('no')}
                  className="px-6 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors"
                >
                  Nein, falsch gewusst
                </button>
              </div>
            </div>
          )}
          
          {/* Final Result after Self-Assessment */}
          {!showSelfAssessment && selfAssessmentAnswer && (
            <div className={`p-4 rounded-lg border-2 ${
              isCorrect 
                ? 'bg-success-50 border-success-200' 
                : 'bg-danger-50 border-danger-200'
            }`}>
              <div className="flex items-center space-x-2 mb-3">
                {isCorrect ? (
                  <svg className="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={`font-semibold ${
                  isCorrect ? 'text-success-800' : 'text-danger-800'
                }`}>
                  {isCorrect ? 'Richtig!' : 'Falsch!'}
                </span>
              </div>
              
              {/* Report Error Link */}
              <div className="mt-4 pt-3 border-t border-gray-200">
                <a
                  href={`mailto:pw@patrikwalde.com?subject=Fehler im Quiz gefunden - Frage ${question.questionNumber || question.id}&body=Hallo,%0D%0A%0D%0AIch habe einen Fehler in Frage ${question.questionNumber || question.id} gefunden:%0D%0A%0D%0A[Beschreibe hier den Fehler]%0D%0A%0D%0AVielen Dank!`}
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Fehler melden
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Result and Explanation - NOT for self-evaluation questions */}
      {showResult && !((question.type === 'image_question' || question.type === 'open_ended') && question.isOpenQuestion) && (
        <div className={`p-4 rounded-lg border-2 ${
          isCorrect 
            ? 'bg-success-50 border-success-200' 
            : 'bg-danger-50 border-danger-200'
        }`}>
          <div className="flex items-center space-x-2 mb-3">
            {isCorrect ? (
              <svg className="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`font-semibold ${
              isCorrect ? 'text-success-800' : 'text-danger-800'
            }`}>
              {isCorrect ? 'Richtig!' : 'Falsch!'}
            </span>
          </div>
          
          {showExplanations && question.explanation && (
            <p className="text-gray-700">
              <strong>Erklärung:</strong> {question.explanation}
            </p>
          )}
          
          {/* Report Error Link */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <a
              href={`mailto:pw@patrikwalde.com?subject=Fehler im Quiz gefunden - Frage ${question.questionNumber || question.id}&body=Hallo,%0D%0A%0D%0AIch habe einen Fehler in Frage ${question.questionNumber || question.id} gefunden:%0D%0A%0D%0A[Beschreibe hier den Fehler]%0D%0A%0D%0AVielen Dank!`}
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Fehler melden
            </a>
          </div>
        </div>
      )}

      {/* Buttons */}
      {!showResult && (
        <div className="flex justify-between items-center pt-4">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {getButtonText()} {selectedOptions.length > 0 ? `(${selectedOptions.length} ausgewählt)` : ''}
          </button>
        </div>
      )}

      {/* Next Question Button - shown when result is displayed */}
      {showResult && onNextQuestion && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onNextQuestion}
            className="btn-primary"
          >
            {questionNumber < totalQuestions ? 'Nächste Frage' : 'Quiz beenden'}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizQuestion;
