import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { GlassNavbar, GlassFooter } from './components/layout/NavbarAndFooter';
import { ToastContainer } from './components/ui/GlassComponents';
import { HomePage } from './pages/HomePage';
import { PromptsDirectoryPage, PromptDetailPage } from './pages/PromptsPages';
import { BlogDirectoryPage, BlogDetailPage } from './pages/BlogPages';
import {
  LoginPage,
  SignupPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  UserProfilePage,
  PrivacyPolicyPage,
  TermsAndConditionsPage,
} from './pages/AuthAndLegalPages';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const ScrollManager: React.FC = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [pathname, hash]);
  return null;
};

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ScrollManager />
        <div className="min-h-screen flex flex-col justify-between">
          <GlassNavbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/prompts" element={<PromptsDirectoryPage />} />
              <Route path="/prompts/:slug" element={<PromptDetailPage />} />
              <Route path="/blog" element={<BlogDirectoryPage />} />
              <Route path="/blog/:slug" element={<BlogDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/blogs" element={<AdminDashboardPage />} />
            </Routes>
          </main>
          <GlassFooter />
          <ToastContainer />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
