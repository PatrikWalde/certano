// Service Worker für Certano PWA
const CACHE_NAME = 'certano-v1.0.0';
const STATIC_CACHE = 'certano-static-v1.0.0';
const DYNAMIC_CACHE = 'certano-dynamic-v1.0.0';

// Dateien die gecacht werden sollen
const STATIC_FILES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  // Offline-Fallback-Seiten
  '/offline.html'
];

// API-Endpunkte die gecacht werden sollen
const API_CACHE_PATTERNS = [
  /\/api\/questions/,
  /\/api\/chapters/,
  /\/api\/topics/,
  /\/api\/user-stats/
];

// Install Event - Cache statische Dateien
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files', error);
      })
  );
});

// Activate Event - Alte Caches löschen
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch Event - Cache-Strategien
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Nur GET-Requests cachen
  if (request.method !== 'GET') {
    return;
  }

  // Cache-Strategie für statische Dateien
  if (STATIC_FILES.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            });
        })
    );
    return;
  }

  // Cache-Strategie für API-Requests
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          // Cache-First für API-Requests
          if (response) {
            // Im Hintergrund aktualisieren
            fetch(request)
              .then((fetchResponse) => {
                if (fetchResponse.status === 200) {
                  const responseClone = fetchResponse.clone();
                  caches.open(DYNAMIC_CACHE)
                    .then((cache) => {
                      cache.put(request, responseClone);
                    });
                }
              })
              .catch((error) => {
                console.error('Service Worker: Background fetch error', error);
                // Fehler ignorieren, verwende Cache
              });
            return response;
          }

          // Kein Cache vorhanden, fetch und cache
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch((error) => {
              console.error('Service Worker: API fetch error', error);
              // Offline-Fallback
              return new Response(
                JSON.stringify({ 
                  error: 'Offline', 
                  message: 'Keine Internetverbindung verfügbar' 
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
        })
    );
    return;
  }

  // Cache-Strategie für andere Requests (Network-First)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              // Only cache non-chrome-extension requests
              if (!request.url.startsWith('chrome-extension://')) {
                cache.put(request, responseClone);
              }
            })
            .catch((error) => {
              console.error('Service Worker: Error caching response', error);
            });
        }
        return response;
      })
      .catch((error) => {
        console.error('Service Worker: Fetch error', error);
        // Offline-Fallback für HTML-Seiten
        if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
        // Für andere Dateien, versuche Cache
        return caches.match(request);
      })
  );
});

// Background Sync für Quiz-Ergebnisse
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'quiz-results') {
    event.waitUntil(syncQuizResults());
  }
});

// Quiz-Ergebnisse synchronisieren
async function syncQuizResults() {
  try {
    // Hole gespeicherte Quiz-Ergebnisse aus IndexedDB
    const results = await getStoredQuizResults();
    
    if (results.length > 0) {
      console.log('Service Worker: Syncing quiz results', results.length);
      
      // Sende Ergebnisse an Server
      for (const result of results) {
        try {
          const response = await fetch('/api/quiz-results', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(result)
          });
          
          if (response.ok) {
            // Erfolgreich gesendet, aus lokalem Speicher entfernen
            await removeStoredQuizResult(result.id);
            console.log('Service Worker: Quiz result synced', result.id);
          }
        } catch (error) {
          console.error('Service Worker: Error syncing quiz result', error);
        }
      }
    }
  } catch (error) {
    console.error('Service Worker: Error in background sync', error);
  }
}

// IndexedDB Helper-Funktionen
async function getStoredQuizResults() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CertanoDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['quizResults'], 'readonly');
      const store = transaction.objectStore('quizResults');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
  });
}

async function removeStoredQuizResult(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CertanoDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['quizResults'], 'readwrite');
      const store = transaction.objectStore('quizResults');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Push-Notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'Zeit für dein tägliches Quiz!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Quiz starten',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Schließen',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Certano Quiz', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/quiz')
    );
  } else if (event.action === 'close') {
    // Notification schließen
  } else {
    // Standard-Click - öffne App
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});


