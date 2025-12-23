import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

// Import Firebase service - this will initialize Firebase
import './services/firebase';

const queryClient = new QueryClient();

// Register service workers for PWA and Firebase messaging
if ('serviceWorker' in navigator) {
  // Register Firebase messaging service worker FIRST with root scope
  navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
    .then((registration) => {
      console.log('[SW] Firebase messaging SW registered:', registration);
      console.log('[SW] Firebase SW scope:', registration.scope);
    })
    .catch((error) => {
      console.error('[SW] Firebase messaging SW registration failed:', error);
    });
    
  // Register the main/PWA service worker with a different scope
  // or let it share the root scope (Firebase will handle push)
  navigator.serviceWorker.register('/sw.js', { scope: '/app/' })
    .then((registration) => {
      console.log('[SW] Main/PWA SW registered:', registration);
    })
    .catch((error) => {
      // It's okay if this fails - Firebase SW handles push
      console.warn('[SW] Main SW registration failed (optional):', error);
    });
}


createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);