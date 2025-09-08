import { useState, useEffect } from 'react';

interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  installPrompt: PWAInstallPrompt | null;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    installPrompt: null,
  });

  useEffect(() => {
    // Service Worker registrieren (nur einmal)
    if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    // Install Prompt abfangen
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: e as any,
      }));
    };

    // App installiert
    const handleAppInstalled = () => {
      setPwaState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        installPrompt: null,
      }));
    };

    // Online/Offline Status
    const handleOnline = () => {
      setPwaState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setPwaState(prev => ({ ...prev, isOnline: false }));
    };

    // Event Listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Prüfen ob App bereits installiert ist
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setPwaState(prev => ({ ...prev, isInstalled: true }));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (pwaState.installPrompt) {
      try {
        await pwaState.installPrompt.prompt();
        const choiceResult = await pwaState.installPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        
        setPwaState(prev => ({
          ...prev,
          isInstallable: false,
          installPrompt: null,
        }));
      } catch (error) {
        console.error('Error installing app:', error);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        ...options,
      });
    }
  };

  const scheduleQuizReminder = () => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      // Sende Nachricht an Service Worker
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification('Certano Quiz', {
          body: 'Zeit für dein tägliches Quiz!',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'quiz-reminder',
          requireInteraction: true,
          // actions: [
          //   {
          //     action: 'quiz',
          //     title: 'Quiz starten',
          //     icon: '/icon-192x192.png'
          //   },
          //   {
          //     action: 'later',
          //     title: 'Später',
          //     icon: '/icon-192x192.png'
          //   }
          // ]
        });
      });
    }
  };

  return {
    ...pwaState,
    installApp,
    requestNotificationPermission,
    showNotification,
    scheduleQuizReminder,
  };
};


