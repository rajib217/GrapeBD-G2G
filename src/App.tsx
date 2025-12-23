import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import UserProfile from "./components/UserProfile";
import Messages from "./components/Messages";
import { useEffect } from "react";
import { requestNotificationPermission, hasRejectedNotifications } from "@/services/notification";
import { toast } from "sonner";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const isGranted = localStorage.getItem('notificationGranted') === 'true';
    
    if (!hasRejectedNotifications() && !isGranted) {
      const askPermission = async () => {
        const shouldAsk = window.confirm('নোটিফিকেশন চালু করতে চান? মেসেজ ও গিফট সংক্রান্ত আপডেট পেতে নোটিফিকেশন দরকার।');
        if (shouldAsk) {
          await requestNotificationPermission();
        } else {
          localStorage.setItem('notificationRejected', 'true');
        }
      };
      askPermission();
    }
  }, []);

  // Listen for FCM foreground messages and show toast
  useEffect(() => {
    const handleForegroundMessage = (event: CustomEvent) => {
      const { title, body, data } = event.detail;
      console.log('[App] FCM foreground message event received:', { title, body, data });
      
      toast(title || 'নতুন নোটিফিকেশন', {
        description: body,
        duration: 6000,
        action: data?.click_action ? {
          label: 'দেখুন',
          onClick: () => {
            window.location.href = data.click_action;
          }
        } : undefined
      });
    };

    window.addEventListener('fcm-foreground-message', handleForegroundMessage as EventListener);
    console.log('[App] FCM foreground message listener registered');

    return () => {
      window.removeEventListener('fcm-foreground-message', handleForegroundMessage as EventListener);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/home" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user/:userId" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/messages" 
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<Auth />} />
          </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
