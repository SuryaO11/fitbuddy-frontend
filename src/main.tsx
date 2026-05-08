import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { requestNotificationPermission } from './lib/notifications';
import { sendNotification } from './lib/notifications';
// import * as Sentry from '@sentry/browser';

// async function enableMocks() {
//   if (import.meta.env.DEV) {
//     try {
//       await import('./lib/mocks');
//       console.log('MSW mocks loaded successfully');
//     } catch (error) {
//       console.error('Failed to load MSW mocks:', error);
//     }
//   }
// }

// enableMocks().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
// });

// Register service worker for PWA
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}

// Request notification permission on app load
requestNotificationPermission();

// Daily workout reminder at 7pm if no workout logged
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 19) {
    const lastReminded = localStorage.getItem('workout_reminder_last') || '';
    const todayStr = now.toISOString().slice(0, 10);
    if (lastReminded !== todayStr) {
      // Check if a workout was logged today (by checking localStorage or API if available)
      // For now, just send the notification (replace with real check if needed)
      sendNotification('Workout Reminder', { body: 'Don\'t forget to log your workout today!' });
      localStorage.setItem('workout_reminder_last', todayStr);
    }
  }
}, 10 * 60 * 1000); // every 10 minutes

// if (import.meta.env.PROD) {
//   Sentry.init({
//     dsn: 'https://your-sentry-dsn@sentry.io/project-id',
//     tracesSampleRate: 1.0,
//     environment: import.meta.env.MODE,
//   });
// }
