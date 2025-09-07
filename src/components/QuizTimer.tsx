import React from 'react';

interface QuizTimerProps {
  timeRemaining: number;
}

const QuizTimer: React.FC<QuizTimerProps> = ({ timeRemaining }) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLowTime = timeRemaining <= 60; // Less than 1 minute

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 ${
      isLowTime 
        ? 'border-danger-500 bg-danger-50 text-danger-700' 
        : 'border-primary-500 bg-primary-50 text-primary-700'
    }`}>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="font-mono text-lg font-semibold">
        {formatTime(minutes)}:{formatTime(seconds)}
      </span>
    </div>
  );
};

export default QuizTimer;



