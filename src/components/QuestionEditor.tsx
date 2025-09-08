import React, { useState, useEffect } from 'react';
import { Question, ChapterData, QuestionType, QuestionOption, FillBlankOption, WrongAnswer } from '../types';

// Helper function to generate automatic question number
const generateQuestionNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}.${hour}${minute}${second}`;
};

interface QuestionEditorProps {
  question?: Question;
  chapters: ChapterData[];
  onSave: (questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, chapters, onSave, onClose }) => {
  // Initialize form data directly from question prop
  const getInitialFormData = () => {
    if (question) {
      // Convert old options structure to new structure
      let convertedOptions: QuestionOption[] = [];
      
      if (question.options) {
        if (typeof question.options === 'object' && 'options' in question.options && Array.isArray((question.options as any).options)) {
          // Old structure: { correct: string, options: string[] }
          convertedOptions = (question.options as any).options.map((option: string, index: number) => ({
            id: String(index + 1),
            text: option,
            isCorrect: option === (question.options as any).correct
          }));
        } else if (Array.isArray(question.options)) {
          // New structure: QuestionOption[]
          convertedOptions = question.options;
        }
      }
      
      // If no options found and it's a multiple choice question, create default options
      if (convertedOptions.length === 0 && question.type === 'multiple_choice') {
        convertedOptions = [
          { id: '1', text: 'Option 1', isCorrect: true },
          { id: '2', text: 'Option 2', isCorrect: false },
          { id: '3', text: 'Option 3', isCorrect: false },
          { id: '4', text: 'Option 4', isCorrect: false }
        ];
      }
      
      return {
        prompt: question.prompt || '',
        type: question.type || 'multiple_choice',
        chapter: question.chapter || '',
        explanation: question.explanation || '',
        tags: question.tags || [],
        options: convertedOptions,
        matchingPairs: question.matchingPairs || [],
        fillBlankOptions: question.fillBlankOptions || [],
        blankCount: question.blankCount || 1,
        media: question.media || '',
        isOpenQuestion: question.isOpenQuestion || false,
        questionNumber: question.questionNumber || '',
        difficulty: question.difficulty || 'medium'
      };
    } else {
      // Default form data for new question
      return {
        prompt: '',
        type: 'multiple_choice' as QuestionType,
        chapter: chapters.length > 0 ? chapters[0].name : '',
        explanation: '',
        tags: [] as string[],
        options: [
          { id: '1', text: '', isCorrect: false },
          { id: '2', text: '', isCorrect: false }
        ],
        matchingPairs: [] as any[],
        fillBlankOptions: [] as any[],
        blankCount: 1,
        media: '',
        isOpenQuestion: false,
        questionNumber: generateQuestionNumber(),
        difficulty: 'medium'
      };
    }
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form data when question changes
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [question?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      // Ensure question number is set
      const dataToSave = {
        ...formData,
        questionNumber: formData.questionNumber || generateQuestionNumber(),
        difficulty: (formData.difficulty as 'easy' | 'medium' | 'hard') || 'medium'
      };
      
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving question:', error);
      setErrors({ submit: 'Fehler beim Speichern der Frage' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addOption = () => {
    const newId = String(formData.options.length + 1);
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { id: newId, text: '', isCorrect: false }]
    }));
  };

  const removeOption = (id: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(option => option.id !== id)
    }));
  };

  const updateOption = (id: string, field: keyof QuestionOption, value: any) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(option =>
        option.id === id ? { ...option, [field]: value } : option
      )
    }));
  };

  // Matching pairs functions
  const addMatchingPair = () => {
    const newId = String(formData.matchingPairs.length + 1);
    setFormData(prev => ({
      ...prev,
      matchingPairs: [...prev.matchingPairs, { id: newId, left: '', right: '' }]
    }));
  };

  const removeMatchingPair = (id: string) => {
    setFormData(prev => ({
      ...prev,
      matchingPairs: prev.matchingPairs.filter(pair => pair.id !== id)
    }));
  };

  const updateMatchingPair = (id: string, field: 'left' | 'right', value: string) => {
    setFormData(prev => ({
      ...prev,
      matchingPairs: prev.matchingPairs.map(pair =>
        pair.id === id ? { ...pair, [field]: value } : pair
      )
    }));
  };

  // Fill blank functions
  const updateFillBlankOption = (id: string, field: 'text' | 'correctAnswer', value: string) => {
    setFormData(prev => ({
      ...prev,
      fillBlankOptions: prev.fillBlankOptions.map(option =>
        option.id === id ? { ...option, [field]: value } : option
      )
    }));
  };

  const addWrongAnswer = (blankId: string) => {
    setFormData(prev => ({
      ...prev,
      fillBlankOptions: prev.fillBlankOptions.map((option: FillBlankOption) => {
        if (option.id === blankId) {
          const wrongAnswers = option.wrongAnswers || [];
          const newWrongAnswer: WrongAnswer = {
            id: String(wrongAnswers.length + 1),
            text: ''
          };
          return {
            ...option,
            wrongAnswers: [...wrongAnswers, newWrongAnswer]
          };
        }
        return option;
      })
    }));
  };

  const removeWrongAnswer = (blankId: string, wrongAnswerId: string) => {
    setFormData(prev => ({
      ...prev,
      fillBlankOptions: prev.fillBlankOptions.map((option: FillBlankOption) => {
        if (option.id === blankId) {
          return {
            ...option,
            wrongAnswers: (option.wrongAnswers || []).filter((wrong: WrongAnswer) => wrong.id !== wrongAnswerId)
          };
        }
        return option;
      })
    }));
  };

  const updateWrongAnswer = (blankId: string, wrongAnswerId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      fillBlankOptions: prev.fillBlankOptions.map((option: FillBlankOption) => {
        if (option.id === blankId) {
          return {
            ...option,
            wrongAnswers: (option.wrongAnswers || []).map((wrong: WrongAnswer) =>
              wrong.id === wrongAnswerId ? { ...wrong, text: value } : wrong
            )
          };
        }
        return option;
      })
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {question ? 'Frage bearbeiten' : 'Neue Frage hinzufügen'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fragenummer
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={formData.questionNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, questionNumber: e.target.value }))}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="z.B. 20240115.143045 oder eigene Nummer"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, questionNumber: generateQuestionNumber() }))}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                title="Automatische Nummer generieren"
              >
                🔄 Neu
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leer lassen für automatische Generierung im Format: YYYYMMDD.HHMMSS
            </p>
          </div>

          {/* Question Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fragentext *
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              required
            />
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fragetyp *
            </label>
            <select
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value as QuestionType;
                setFormData(prev => {
                  // Initialize matching pairs if switching to matching type
                  if (newType === 'matching' && prev.matchingPairs.length === 0) {
                    return {
                      ...prev,
                      type: newType,
                      matchingPairs: [
                        { id: '1', left: '', right: '' },
                        { id: '2', left: '', right: '' }
                      ]
                    };
                  }
                  // Initialize options for image questions if needed
                  if (newType === 'image_question' && prev.options.length === 0) {
                    return {
                      ...prev,
                      type: newType,
                      options: [
                        { id: '1', text: '', isCorrect: false },
                        { id: '2', text: '', isCorrect: false }
                      ]
                    };
                  }
                  // Initialize open ended question settings
                  if (newType === 'open_ended') {
                    return {
                      ...prev,
                      type: newType,
                      isOpenQuestion: false // Default to manual evaluation
                    };
                  }
                  // Initialize fill blank options if needed
                  if (newType === 'fill_blank' && prev.fillBlankOptions.length === 0) {
                    return {
                      ...prev,
                      type: newType,
                      fillBlankOptions: [
                        { 
                          id: '1', 
                          text: '', 
                          correctAnswer: '',
                          wrongAnswers: [
                            { id: '1', text: '' },
                            { id: '2', text: '' }
                          ]
                        } as FillBlankOption
                      ],
                      blankCount: 1
                    };
                  }
                  return { ...prev, type: newType };
                });
              }}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">Richtig/Falsch</option>
              <option value="matching">Zuordnung</option>
              <option value="image_question">Bildfrage</option>
              <option value="open_ended">Offene Frage</option>
              <option value="fill_blank">Lückentext</option>
            </select>
          </div>

          {/* Chapter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kapitel *
            </label>
            <select
              value={formData.chapter}
              onChange={(e) => setFormData(prev => ({ ...prev, chapter: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            >
              <option value="">Kapitel auswählen</option>
              {chapters.map(chapter => (
                <option key={chapter.id} value={chapter.name}>
                  {chapter.name}
                </option>
              ))}
            </select>
          </div>


          {/* Multiple Choice Options */}
          {formData.type === 'multiple_choice' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Antwortoptionen * ({formData.options.length} Optionen)
                <span className="text-xs text-gray-500 ml-2">✓ = richtige Antwort (mehrere möglich)</span>
              </label>
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={() => {
                        // Toggle this option's correctness
                        setFormData(prev => ({
                          ...prev,
                          options: prev.options.map(opt =>
                            opt.id === option.id ? { ...opt, isCorrect: !opt.isCorrect } : opt
                          )
                        }));
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(option.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Option hinzufügen
                </button>
              </div>
            </div>
          )}

          {/* True/False Options */}
          {formData.type === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Antwortoptionen *
              </label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={formData.options[0]?.isCorrect || false}
                    onChange={() => {
                      setFormData(prev => ({
                        ...prev,
                        options: [
                          { id: '1', text: 'Richtig', isCorrect: true },
                          { id: '2', text: 'Falsch', isCorrect: false }
                        ]
                      }));
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700">Richtig</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={formData.options[1]?.isCorrect || false}
                    onChange={() => {
                      setFormData(prev => ({
                        ...prev,
                        options: [
                          { id: '1', text: 'Richtig', isCorrect: false },
                          { id: '2', text: 'Falsch', isCorrect: true }
                        ]
                      }));
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-700">Falsch</span>
                </div>
              </div>
            </div>
          )}

          {/* Matching Questions */}
          {formData.type === 'matching' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zuordnungspaare * ({formData.matchingPairs.length} Paare)
              </label>
              <div className="space-y-3">
                {formData.matchingPairs.map((pair, index) => (
                  <div key={pair.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-md">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Linke Seite</label>
                      <input
                        type="text"
                        value={pair.left}
                        onChange={(e) => updateMatchingPair(pair.id, 'left', e.target.value)}
                        placeholder={`Begriff ${index + 1}`}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex items-center text-gray-400">
                      <span className="text-lg">↔</span>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Rechte Seite</label>
                      <input
                        type="text"
                        value={pair.right}
                        onChange={(e) => updateMatchingPair(pair.id, 'right', e.target.value)}
                        placeholder={`Zuordnung ${index + 1}`}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    {formData.matchingPairs.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeMatchingPair(pair.id)}
                        className="text-red-600 hover:text-red-800 p-2"
                      >
                        Löschen
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMatchingPair}
                  className="text-blue-600 hover:text-blue-800 text-sm border border-blue-300 rounded-md px-3 py-2 hover:bg-blue-50"
                >
                  + Zuordnungspaar hinzufügen
                </button>
              </div>
            </div>
          )}

          {/* Image Questions */}
          {formData.type === 'image_question' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bildfrage *
              </label>
              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bild hochladen
                  </label>
                  
                  {/* Upload Button */}
                  <div className="flex items-center space-x-4 mb-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // In einer echten App würdest du das Bild zu einem Server hochladen
                          // Hier simulieren wir es mit einem lokalen URL
                          const imageUrl = URL.createObjectURL(file);
                          setFormData(prev => ({ ...prev, media: imageUrl }));
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Bild hochladen</span>
                    </button>
                    {formData.media && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, media: '' }))}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Bild entfernen</span>
                      </button>
                    )}
                  </div>

                  {/* Drag & Drop Area */}
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const imageUrl = URL.createObjectURL(file);
                          setFormData(prev => ({ ...prev, media: imageUrl }));
                        }
                      }}
                      className="hidden"
                      id="image-upload-drag"
                    />
                    <label
                      htmlFor="image-upload-drag"
                      className="cursor-pointer text-blue-600 hover:text-blue-800"
                    >
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600">
                        Oder ziehen Sie ein Bild hierher
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Klicken Sie hier oder ziehen Sie ein Bild in diesen Bereich
                      </p>
                    </label>
                  </div>

                  {/* Image Preview */}
                  {formData.media && (
                    <div className="mt-4">
                      <img
                        src={formData.media}
                        alt="Hochgeladenes Bild"
                        className="max-w-full h-48 object-contain border border-gray-300 dark:border-gray-600 rounded-md"
                      />
                    </div>
                  )}
                </div>

                {/* Question Type for Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fragetyp für das Bild
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="imageQuestionType"
                        checked={!formData.isOpenQuestion}
                        onChange={() => setFormData(prev => ({ ...prev, isOpenQuestion: false }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-gray-700">Multiple Choice (mit vorgegebenen Antworten)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="imageQuestionType"
                        checked={formData.isOpenQuestion}
                        onChange={() => setFormData(prev => ({ ...prev, isOpenQuestion: true }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-gray-700">Offene Frage (freie Antwort)</span>
                    </div>
                  </div>
                </div>

                {/* Multiple Choice Options for Image */}
                {!formData.isOpenQuestion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Antwortoptionen * ({formData.options.length} Optionen)
                    </label>
                    <div className="space-y-3">
                      {formData.options.map((option, index) => (
                        <div key={option.id} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={option.isCorrect}
                            onChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                options: prev.options.map(opt => ({
                                  ...opt,
                                  isCorrect: opt.id === option.id
                                }))
                              }));
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          {formData.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(option.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Löschen
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Option hinzufügen
                      </button>
                    </div>
                  </div>
                )}

                {/* Open Question Info */}
                {formData.isOpenQuestion && (
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-blue-800 text-sm">
                      <strong>Offene Bildfrage:</strong> Die Benutzer können eine freie Antwort zu dem Bild eingeben. 
                      Die Bewertung erfolgt manuell oder über Schlüsselwörter.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Open Ended Questions */}
          {formData.type === 'open_ended' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offene Frage *
              </label>
              <div className="space-y-4">
                {/* Question Type for Open Ended */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fragetyp
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="openQuestionType"
                        checked={!formData.isOpenQuestion}
                        onChange={() => setFormData(prev => ({ ...prev, isOpenQuestion: false }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-gray-700">Freie Texteingabe (manuelle Bewertung)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="openQuestionType"
                        checked={formData.isOpenQuestion}
                        onChange={() => setFormData(prev => ({ ...prev, isOpenQuestion: true }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-gray-700">Selbstbewertung (Benutzer bewertet sich selbst)</span>
                    </div>
                  </div>
                </div>

                {/* Expected Answer for Manual Evaluation */}
                {!formData.isOpenQuestion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Erwartete Antwort (für manuelle Bewertung)
                    </label>
                    <textarea
                      value={formData.explanation || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={3}
                      placeholder="Beschreiben Sie hier die erwartete Antwort oder wichtige Punkte, die in der Antwort enthalten sein sollten..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Diese Antwort wird dem Bewerter als Referenz angezeigt
                    </p>
                  </div>
                )}

                {/* Self-Evaluation Info */}
                {formData.isOpenQuestion && (
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-blue-800 text-sm">
                      <strong>Selbstbewertung:</strong> Der Benutzer kann eine freie Antwort eingeben und sich dann selbst bewerten. 
                      Diese Art von Frage eignet sich gut für Reflexionsfragen oder persönliche Einschätzungen.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fill Blank Questions */}
          {formData.type === 'fill_blank' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lückentext *
              </label>
              <div className="space-y-4">
                {/* Number of Blanks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anzahl der Lücken
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.blankCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 1;
                      setFormData(prev => {
                        const newFillBlankOptions = [];
                        for (let i = 0; i < count; i++) {
                          const existingOption = prev.fillBlankOptions[i];
                          newFillBlankOptions.push({
                            id: String(i + 1),
                            text: existingOption?.text || '',
                            correctAnswer: existingOption?.correctAnswer || '',
                            wrongAnswers: existingOption?.wrongAnswers || [
                              { id: '1', text: '' },
                              { id: '2', text: '' }
                            ]
                          });
                        }
                        return {
                          ...prev,
                          blankCount: count,
                          fillBlankOptions: newFillBlankOptions
                        };
                      });
                    }}
                    className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Fill Blank Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lücken definieren ({formData.fillBlankOptions.length} Lücken)
                  </label>
                  <div className="space-y-3">
                    {formData.fillBlankOptions.map((option, index) => (
                      <div key={option.id} className="p-4 border border-gray-200 rounded-md">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="text-sm font-medium text-gray-600">
                            Lücke {index + 1}:
                          </span>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Text mit Lücke (verwenden Sie ___ für die Lücke)
                            </label>
                            <input
                              type="text"
                              value={option.text}
                              onChange={(e) => updateFillBlankOption(option.id, 'text', e.target.value)}
                              placeholder={`Beispiel: Die Hauptstadt von Deutschland ist ___.`}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Richtige Antwort
                            </label>
                            <input
                              type="text"
                              value={option.correctAnswer}
                              onChange={(e) => updateFillBlankOption(option.id, 'correctAnswer', e.target.value)}
                              placeholder="Berlin"
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          
                          {/* Wrong Answers */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-xs text-gray-500">
                                Falsche Antworten (Ablenkung)
                              </label>
                              <button
                                type="button"
                                onClick={() => addWrongAnswer(option.id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                + Falsche Antwort hinzufügen
                              </button>
                            </div>
                            <div className="space-y-2">
                              {(option.wrongAnswers || []).map((wrongAnswer: WrongAnswer, wrongIndex: number) => (
                                <div key={wrongAnswer.id} className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={wrongAnswer.text}
                                    onChange={(e) => updateWrongAnswer(option.id, wrongAnswer.id, e.target.value)}
                                    placeholder={`Falsche Antwort ${wrongIndex + 1}`}
                                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  />
                                  {(option.wrongAnswers || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeWrongAnswer(option.id, wrongAnswer.id)}
                                      className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                      Löschen
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-blue-800 text-sm">
                    <strong>Lückentext-Fragen:</strong> Verwenden Sie ___ (drei Unterstriche) im Text, um die Lücke zu markieren. 
                    Für jede Lücke können Sie eine richtige Antwort und mehrere falsche Antworten definieren. 
                    Die Benutzer wählen dann aus allen Optionen (richtig + falsch) die korrekte Antwort aus.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Erklärung
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={2}
            />
          </div>


          {/* Error Display */}
          {errors.submit && (
            <div className="text-red-600 text-sm">{errors.submit}</div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionEditor;
