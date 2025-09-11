import React from 'react';
import { Link } from 'react-router-dom';

interface UpgradePromptProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ onClose, showCloseButton = true }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 relative">
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🚀 Upgrade auf Certano Pro
          </h3>
          <p className="text-gray-600 mb-4">
            Du hast dein tägliches Limit von 5 Fragen erreicht. Mit Certano Pro erhältst du:
          </p>
          
          <ul className="space-y-2 mb-6">
            <li className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-700">Unbegrenzte Fragen pro Tag</span>
            </li>
            <li className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-700">Erweiterte Statistiken</span>
            </li>
            <li className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-700">Prioritäts-Support</span>
            </li>
            <li className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-gray-700">Alle zukünftigen Features</span>
            </li>
          </ul>
          
          <div className="flex space-x-3">
            <Link
              to="/upgrade"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Jetzt upgraden - 9,99€/Monat
            </Link>
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Später
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradePrompt;
