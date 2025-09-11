import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { stripeService, SUBSCRIPTION_PLANS } from '../services/stripeService';

const UpgradePage: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (!user?.id) {
      setError('Du musst angemeldet sein, um zu upgraden');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Plan nicht gefunden');
      }

      await stripeService.redirectToCheckout(plan.stripePriceId, user.id);
    } catch (error: any) {
      console.error('Upgrade error:', error);
      setError(error.message || 'Fehler beim Upgrade. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: '🚀',
      title: 'Unbegrenzte Fragen',
      description: 'Löse so viele Fragen wie du möchtest - ohne tägliche Limits'
    },
    {
      icon: '📊',
      title: 'Erweiterte Statistiken',
      description: 'Detaillierte Analysen deines Lernfortschritts und Schwachstellen'
    },
    {
      icon: '🎯',
      title: 'Intelligente Wiederholung',
      description: 'KI-basierte Spaced Repetition für optimales Lernen'
    },
    {
      icon: '⚡',
      title: 'Prioritäts-Support',
      description: 'Schnelle Hilfe bei Fragen und Problemen'
    },
    {
      icon: '🔮',
      title: 'Zukünftige Features',
      description: 'Erste Zugriff auf alle neuen Funktionen und Inhalte'
    },
    {
      icon: '📱',
      title: 'Offline-Modus',
      description: 'Lerne auch ohne Internetverbindung'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Upgrade auf{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Certano Pro
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Entfessle dein volles Lernpotenzial mit unbegrenzten Fragen, erweiterten Statistiken und exklusiven Features.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-md mx-auto mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
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
          </div>
        )}

        {/* Pricing Cards */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div key={plan.id} className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3">
                    <span className="font-semibold">🔥 Beliebteste Wahl</span>
                  </div>
                )}
                
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">{plan.price.toFixed(2)} {plan.currency}</span>
                      <span className="text-gray-600 dark:text-gray-300 ml-2">/{plan.interval === 'month' ? 'Monat' : 'Jahr'}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">Jederzeit kündbar</p>
                    {plan.interval === 'year' && (
                      <p className="text-green-600 dark:text-green-400 text-sm font-semibold mt-1">
                        💰 2 Monate gratis (17% Ersparnis)
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button 
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isLoading}
                    className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Wird geladen...
                      </div>
                    ) : (
                      `Jetzt upgraden - ${plan.price.toFixed(2)} ${plan.currency}/${plan.interval === 'month' ? 'Monat' : 'Jahr'}`
                    )}
                  </button>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                    Sichere Zahlung mit Stripe • Jederzeit kündbar
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Häufig gestellte Fragen
          </h2>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Kann ich jederzeit kündigen?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Ja, du kannst dein Abonnement jederzeit in den Einstellungen kündigen. 
                Du behältst den Pro-Status bis zum Ende des bezahlten Zeitraums.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Was passiert nach der Kündigung?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Nach der Kündigung kehrst du zum kostenlosen Plan zurück mit 5 Fragen pro Tag. 
                Deine Statistiken und der Lernfortschritt bleiben erhalten.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ist meine Zahlung sicher?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Ja, wir verwenden Stripe für sichere Zahlungen. Deine Kreditkartendaten werden 
                niemals auf unseren Servern gespeichert.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
