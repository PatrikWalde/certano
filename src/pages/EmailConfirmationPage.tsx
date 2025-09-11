import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const EmailConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (!token || !type) {
          setStatus('error');
          setMessage('Ungültiger Bestätigungslink');
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setStatus('error');
          setMessage('Bestätigung fehlgeschlagen. Der Link ist möglicherweise abgelaufen.');
          return;
        }

        setStatus('success');
        setMessage('Email erfolgreich bestätigt!');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);

      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  const handleRetry = () => {
    navigate('/login');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-8">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {status === 'loading' && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              )}
              {status === 'success' && (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {status === 'error' && (
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h1 className="text-2xl font-bold">
              {status === 'loading' && 'Email wird bestätigt...'}
              {status === 'success' && 'Email bestätigt!'}
              {status === 'error' && 'Bestätigung fehlgeschlagen'}
            </h1>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            {status === 'loading' && (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Wir bestätigen gerade deine Email-Adresse. Bitte warte einen Moment...
                </p>
                <div className="flex justify-center">
                  <div className="animate-pulse flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {message}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Du wirst automatisch zum Dashboard weitergeleitet...
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleGoToDashboard}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Zum Dashboard
                  </button>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Weiterleitung in 3 Sekunden...
                  </div>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="text-6xl mb-4">😞</div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {message}
                </p>
                <div className="space-y-3">
                  <button
                    onClick={handleRetry}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Erneut versuchen
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full text-gray-600 dark:text-gray-300 font-medium py-3 px-6 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Zur Startseite
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700 px-8 py-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Brauchst du Hilfe? <a href="mailto:support@certano.app" className="text-blue-600 hover:text-blue-700">Kontaktiere uns</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationPage;
