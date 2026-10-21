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
        const rawId = decodeURIComponent(hash.replace(/^#/, ''));
        const el = rawId ? document.getElementById(rawId) : null;
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [pathname, hash]);
  return null;
};

const SiteMotionManager: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    let frame = 0;
    const syncScrollGlow = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const progress = Math.min(1, window.scrollY / maxScroll);
        document.documentElement.style.setProperty('--page-scroll-progress', progress.toFixed(3));
        document.documentElement.style.setProperty('--page-scroll-offset', `${Math.round(window.scrollY * 0.18)}px`);
        document.documentElement.style.setProperty('--page-scroll-hue', `${Math.round(progress * 72 - 28)}deg`);
        document.documentElement.style.setProperty('--page-scroll-rotation', `${Math.round(progress * 10)}deg`);
      });
    };
    window.addEventListener('scroll', syncScrollGlow, { passive: true });
    syncScrollGlow();

    const targets = Array.from(document.querySelectorAll<HTMLElement>('main section[id], main .glass-card-shell'));
    if (!targets.length) return () => window.removeEventListener('scroll', syncScrollGlow);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    targets.forEach((target, index) => {
      target.classList.add('site-reveal');
      target.style.setProperty('--reveal-delay', `${Math.min(index % 5, 4) * 65}ms`);
    });

    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-visible'));
      return () => window.removeEventListener('scroll', syncScrollGlow);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', syncScrollGlow);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
};

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ScrollManager />
        <SiteMotionManager />
        <div className="app-shell relative isolate min-h-screen flex flex-col justify-between">
          <div className="app-ambient" aria-hidden="true">
            <span className="app-scroll-glow" />
            <img className="app-ambient-gif" src="/assets/media/aurora-flow-loop.gif" alt="" />
            <span className="app-ambient-aura app-ambient-aura--violet" />
            <span className="app-ambient-aura app-ambient-aura--cyan" />
            <span className="app-ambient-aura app-ambient-aura--rose" />
            <span className="app-ambient-orb app-ambient-orb--violet" />
            <span className="app-ambient-orb app-ambient-orb--blue" />
            <span className="app-ambient-orb app-ambient-orb--mint" />
            <span className="app-ambient-orb app-ambient-orb--rose" />
            <span className="app-ambient-ring app-ambient-ring--one" />
            <span className="app-ambient-ring app-ambient-ring--two" />
            <span className="app-ambient-sparkle app-ambient-sparkle--one">✦</span>
            <span className="app-ambient-sparkle app-ambient-sparkle--two">✧</span>
            <span className="app-ambient-sparkle app-ambient-sparkle--three">✦</span>
            <span className="app-ambient-sparkle app-ambient-sparkle--four">✧</span>
            <span className="app-ambient-sparkle app-ambient-sparkle--five">✦</span>
            <span className="app-ambient-sparkle app-ambient-sparkle--six">✧</span>
            <span className="app-ambient-particle app-ambient-particle--one" />
            <span className="app-ambient-particle app-ambient-particle--two" />
            <span className="app-ambient-particle app-ambient-particle--three" />
            <span className="app-ambient-particle app-ambient-particle--four" />
            <span className="app-ambient-particle app-ambient-particle--five" />
          </div>
          <GlassNavbar />
          <main className="relative z-10 flex-1">
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
          <div className="relative z-10"><GlassFooter /></div>
          <ToastContainer />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
