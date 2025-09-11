import React from 'react';
import { Link } from 'react-router-dom';

const UpgradePage: React.FC = () => {

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

        {/* Pricing Card */}
        <div className="max-w-md mx-auto mb-16">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Popular Badge */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3">
              <span className="font-semibold">🔥 Beliebteste Wahl</span>
            </div>
            
            <div className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Certano Pro</h3>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">9,99€</span>
                  <span className="text-gray-600 dark:text-gray-300 ml-2">/Monat</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Jederzeit kündbar</p>
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <span className="text-2xl">{feature.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{feature.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                Jetzt upgraden - 9,99€/Monat
              </button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Sichere Zahlung mit Stripe • Jederzeit kündbar
              </p>
            </div>
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
