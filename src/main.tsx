import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

const queryClient = new QueryClient();

// Service worker registration disabled for StackBlitz compatibility
// Uncomment the following code when running in environments that support Service Workers:
/*
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegisterError(error) {
    console.error('Service worker registration error:', error);
  },
});
*/

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);