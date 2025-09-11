import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [evu, setEvu] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  
  const { login, register, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Navigate to dashboard when user is authenticated and auth loading is complete
  useEffect(() => {
    if (user && !authLoading && isLogin) {
      console.log('LoginPage: User authenticated, navigating to dashboard');
      navigate('/dashboard');
    }
  }, [user, authLoading, isLogin, navigate]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setForgotPasswordMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setForgotPasswordMessage('Fehler beim Senden der E-Mail. Bitte versuche es erneut.');
      } else {
        setForgotPasswordMessage('E-Mail zum Zurücksetzen des Passworts wurde gesendet!');
        setForgotPasswordEmail('');
      }
    } catch (error) {
      setForgotPasswordMessage('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    console.log('LoginPage: Attempting login for:', email);

    try {
      if (isLogin) {
        await login(email, password);
        console.log('LoginPage: Login successful, waiting for auth state update');
        // Don't navigate here - let useEffect handle navigation after auth state updates
      } else {
        // Validate required fields for registration
        if (!firstName.trim() || !lastName.trim() || !city.trim()) {
          setError('Bitte fülle alle Pflichtfelder aus.');
          setIsLoading(false);
          return;
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
          setError('Passwörter stimmen nicht überein.');
          setIsLoading(false);
          return;
        }
        
        await register(email, password, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          city: city.trim(),
          evu: evu.trim() || undefined
        });
        setError('Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse.');
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('LoginPage: Exception during auth:', error);
      
      // Handle specific Supabase errors
      let errorMessage = 'Ein Fehler ist aufgetreten';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Ungültige E-Mail oder Passwort';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Bitte bestätige zuerst deine E-Mail-Adresse';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Zu viele Versuche. Bitte warte einen Moment';
        } else if (error.message.includes('User already registered') || 
                   error.message.includes('duplicate key value violates unique constraint')) {
          errorMessage = 'Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an oder verwende eine andere E-Mail-Adresse.';
        } else if (error.message.includes('Profile creation failed')) {
          errorMessage = 'Registrierung fehlgeschlagen. Bitte versuche es erneut oder kontaktiere den Support.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Das Passwort muss mindestens 6 Zeichen lang sein';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Bitte gib eine gültige E-Mail-Adresse ein';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
    } finally {
      // Only reset loading for registration, not for login
      if (!isLogin) {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-4 4v8m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLogin ? 'Anmelden' : 'Registrieren'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {isLogin ? (
              <>
                Oder{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                >
                  erstelle ein neues Konto
                </button>
              </>
            ) : (
              <>
                Oder{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                >
                  melde dich an
                </button>
              </>
            )}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="E-Mail-Adresse eingeben"
              />
            </div>
            
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Vorname <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required={!isLogin}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                      placeholder="Vorname"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nachname <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required={!isLogin}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                      placeholder="Nachname"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ort <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    required={!isLogin}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                    placeholder="Ihr Wohnort"
                  />
                </div>
                
                <div>
                  <label htmlFor="evu" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    EVU (optional)
                  </label>
                  <input
                    id="evu"
                    name="evu"
                    type="text"
                    value={evu}
                    onChange={(e) => setEvu(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                    placeholder="Ihr Energieversorger (optional)"
                  />
                </div>
              </>
            )}
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Passwort eingeben"
              />
              {isLogin && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
                  >
                    Passwort vergessen?
                  </button>
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Passwort bestätigen
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                  placeholder="Passwort wiederholen"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isLogin ? 'Anmelden...' : 'Registrieren...'}
                </div>
              ) : (
                isLogin ? 'Anmelden' : 'Registrieren'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
            >
              Zurück zur Startseite
            </Link>
          </div>
        </form>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Passwort zurücksetzen
                  </h3>
                  <button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotPasswordMessage('');
                      setForgotPasswordEmail('');
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      E-Mail-Adresse
                    </label>
                    <input
                      id="forgotEmail"
                      type="email"
                      required
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                      placeholder="E-Mail-Adresse eingeben"
                    />
                  </div>
                  
                  {forgotPasswordMessage && (
                    <div className={`p-3 rounded-md ${
                      forgotPasswordMessage.includes('gesendet') 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                    }`}>
                      {forgotPasswordMessage}
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      {isLoading ? 'Wird gesendet...' : 'E-Mail senden'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordMessage('');
                        setForgotPasswordEmail('');
                      }}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Abbrechen
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
