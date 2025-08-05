import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

// Register service worker
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    if (confirm('নতুন আপডেট পাওয়া গেছে। রিফ্রেশ করবেন?')) {
      updateSW()
    }
  },
  onOfflineReady() {
    console.log('অফলাইন মোড চালু আছে!')
  },
  onRegistered(r) {
    console.log('Service worker registered')
    r && setInterval(() => {
      r.update()
    }, 60 * 60 * 1000) // Check for updates every hour
  },
  onRegisterError(error) {
    console.error('Service worker registration error:', error)
  }
})

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
