import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { initializeApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAI1JBYRF4hZZOmwdSk5QKraGQ_zxqWPZI",
  authDomain: "grape-bd-g2g.firebaseapp.com",
  projectId: "grape-bd-g2g",
  storageBucket: "grape-bd-g2g.firebasestorage.app",
  messagingSenderId: "95985049833",
  appId: "1:95985049833:web:2e1b9b0d993fd04b855078"
};
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
// Initialize Firebase
const app = initializeApp(firebaseConfig);


createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);