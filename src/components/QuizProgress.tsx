import React from 'react';

interface QuizProgressProps {
  current: number;
  total: number;
  progress: number;
}

const QuizProgress: React.FC<QuizProgressProps> = ({ current, total, progress }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>Fortschritt</span>
        <span>{current} von {total} Fragen</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="text-right text-sm text-gray-500">
        {Math.round(progress)}% abgeschlossen
      </div>
    </div>
  );
};

export default QuizProgress;



