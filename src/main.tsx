import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'

// Register service worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('নতুন আপডেট পাওয়া গেছে। রিফ্রেশ করবেন?')) {
      updateSW()
    }
  },
  onOfflineReady() {
    console.log('অফলাইন মোড চালু আছে!')
  },
})

createRoot(document.getElementById("root")!).render(<App />);
