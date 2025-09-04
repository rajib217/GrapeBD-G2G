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
  // Register the main service worker
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('Main SW registered:', registration);
    })
    .catch((error) => {
      console.error('Main SW registration failed:', error);
    });
    
  // Register Firebase messaging service worker
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('Firebase messaging SW registered:', registration);
    })
    .catch((error) => {
      console.error('Firebase messaging SW registration failed:', error);
    });
}


createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);