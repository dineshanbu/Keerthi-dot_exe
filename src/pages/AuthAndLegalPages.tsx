import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Sparkles,
  Heart,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GlassCard, GlassButton, GlassInput, SmartImage, PromptCard } from '../components/ui/GlassComponents';
import type { PromptItem } from '../shared/types';

export const LoginPage: React.FC = () => {
  const { refreshAuth, refreshNotifications, showToast } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        return;
      }
      await refreshAuth();
      await refreshNotifications();
      showToast({ type: 'success', title: 'Logged In', description: data.message });
      if (redirectPath && redirectPath.startsWith('/')) {
        navigate(redirectPath);
      } else {
        navigate(data.user?.role === 'Admin' ? '/admin' : '/');
      }
    } catch {
      setError('Network error during login.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewSession = async (role: 'Admin' | 'User') => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/auth/demo-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start session');
        return;
      }
      await refreshAuth();
      await refreshNotifications();
      showToast({ type: 'success', title: `${role} Session Active`, description: data.message });
      if (redirectPath && redirectPath.startsWith('/')) {
        navigate(redirectPath);
      } else {
        navigate(role === 'Admin' ? '/admin' : '/profile');
      }
    } catch {
      setError('Could not start preview session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <GlassCard className="p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">Welcome Back</h1>
          <p className="text-xs text-slate-600">
            Sign in to your Keerthi_dot_exe community or administrator account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <GlassInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="text-xs font-semibold text-slate-700">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-purple-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl bg-white/85 border border-slate-200/80 px-3.5 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <GlassButton type="submit" disabled={loading} className="w-full py-3">
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </GlassButton>
        </form>

        {/* Server-Side Preview Quick Switch (Zero hardcoded passwords in browser) */}
        <div className="pt-4 border-t border-slate-200/70 space-y-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
            Instant Preview Sandbox Sessions
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handlePreviewSession('Admin')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Admin Session</span>
            </button>
            <button
              type="button"
              onClick={() => handlePreviewSession('User')}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>Member Session</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-center text-slate-600">
          Don’t have an account?{' '}
          <Link to="/signup" className="font-bold text-purple-700 hover:underline">
            Create Free Account
          </Link>
        </p>
      </GlassCard>
    </div>
  );
};

export const SignupPage: React.FC = () => {
  const { refreshAuth, refreshNotifications, showToast } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and a number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setError('You must accept the Privacy Policy and Terms & Conditions.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          acceptTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      await refreshAuth();
      await refreshNotifications();
      showToast({
        type: 'success',
        title: 'Account Created!',
        description: data.message,
      });
      navigate('/profile');
    } catch {
      setError('Network error during sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <GlassCard className="p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Join Keerthi_dot_exe
          </h1>
          <p className="text-xs text-slate-600">
            Create your free community account to save prompts and receive updates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          <GlassInput
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            required
          />

          <GlassInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />

          <div>
            <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Password (min 8 chars, 1 uppercase, 1 number)
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full rounded-xl bg-white/85 border border-slate-200/80 px-3.5 py-2.5 pr-10 text-sm text-slate-900 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <GlassInput
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            required
          />

          <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-purple-600"
            />
            <span>
              I agree to the{' '}
              <Link to="/privacy-policy" className="text-purple-700 underline">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/terms-and-conditions" className="text-purple-700 underline">
                Terms & Conditions
              </Link>
              .
            </span>
          </label>

          {error && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <GlassButton type="submit" disabled={loading} className="w-full py-3">
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </GlassButton>
        </form>

        <p className="text-xs text-center text-slate-600">
          Already a member?{' '}
          <Link to="/login" className="font-bold text-purple-700 hover:underline">
            Login here
          </Link>
        </p>
      </GlassCard>
    </div>
  );
};

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setPreviewToken(null);
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not process request.');
        return;
      }
      setMessage(data.message);
      if (data.previewResetToken) {
        setPreviewToken(data.previewResetToken);
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <GlassCard className="p-6 sm:p-8 space-y-5">
        <div className="text-center space-y-1">
          <KeyRound className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">Reset Your Password</h1>
          <p className="text-xs text-slate-600">
            Enter your account email to receive a time-limited, single-use reset token.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <GlassInput
            label="Account Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ananya.creator@example.com"
            required
          />
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          {message && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2">
              <p>{message}</p>
              {previewToken && (
                <div className="pt-1 border-t border-emerald-200/70">
                  <p className="font-semibold">Preview Mode Reset Link:</p>
                  <Link
                    to={`/reset-password?token=${previewToken}`}
                    className="text-purple-700 underline font-mono break-all"
                  >
                    Open Single-Use Reset Form →
                  </Link>
                </div>
              )}
            </div>
          )}
          <GlassButton type="submit" disabled={loading} className="w-full py-2.5">
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </GlassButton>
        </form>

        <p className="text-xs text-center text-slate-600">
          <Link to="/login" className="font-semibold text-purple-700 hover:underline">
            ← Back to Login
          </Link>
        </p>
      </GlassCard>
    </div>
  );
};

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useApp();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Reset failed.');
        return;
      }
      showToast({ type: 'success', title: 'Password Reset Complete', description: data.message });
      navigate('/login');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <GlassCard className="p-6 sm:p-8 space-y-5">
        <h1 className="text-2xl font-extrabold text-slate-900 font-display text-center">
          Set New Password
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <GlassInput
            label="Reset Token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste single-use reset token"
            required
          />
          <GlassInput
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 chars, 1 uppercase, 1 number"
            required
          />
          <GlassInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
          />
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          <GlassButton type="submit" disabled={loading} className="w-full py-2.5">
            {loading ? 'Updating...' : 'Update Password'}
          </GlassButton>
        </form>
      </GlassCard>
    </div>
  );
};

export const UserProfilePage: React.FC = () => {
  const { user, refreshAuth, showToast, savedPromptIds } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [featuredBlogs, setFeaturedBlogs] = useState(
    user?.notificationPreferences?.featuredBlogs ?? true
  );
  const [newPrompts, setNewPrompts] = useState(user?.notificationPreferences?.newPrompts ?? true);
  const [communityAnnouncements, setCommunityAnnouncements] = useState(
    user?.notificationPreferences?.communityAnnouncements ?? true
  );
  const [saving, setSaving] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<PromptItem[]>([]);

  useEffect(() => {
    const ids = savedPromptIds.join(',');
    fetch(`/api/public/prompts/saved?ids=${encodeURIComponent(ids)}`, {
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setSavedPrompts(data.items || []))
      .catch(() => {});
  }, [savedPromptIds]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <GlassCard className="p-8 space-y-4">
          <p className="text-sm font-semibold text-slate-800">Please sign in to view your profile.</p>
          <GlassButton type="button" onClick={() => navigate('/login')}>
            Go to Login
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name,
          bio,
          notificationPreferences: {
            featuredBlogs,
            newPrompts,
            communityAnnouncements,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshAuth();
        showToast({ type: 'success', title: 'Profile Saved', description: data.message });
      } else {
        showToast({ type: 'error', title: 'Update Failed', description: data.error });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <GlassCard className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200/70 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow bg-purple-100">
              <SmartImage
                src={user.avatarUrl || '/assets/media/keerthi-avatar.png'}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 font-display">{user.name}</h1>
              <p className="text-xs text-slate-500">
                {user.email} · Role: <strong className="text-purple-700">{user.role}</strong> · Status:{' '}
                <strong className="text-emerald-700">{user.status}</strong>
              </p>
            </div>
          </div>

          {user.role === 'Admin' && (
            <Link
              to="/admin"
              className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Open Admin Dashboard →
            </Link>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <GlassInput
            label="Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div>
            <label htmlFor="prof-bio" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Creator Bio
            </label>
            <textarea
              id="prof-bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl bg-white/85 border border-slate-200/80 px-3.5 py-2.5 text-sm text-slate-900"
            />
          </div>

          <div className="pt-2 space-y-2">
            <p className="text-xs font-bold text-slate-900 font-display">Notification Preferences</p>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={featuredBlogs}
                onChange={(e) => setFeaturedBlogs(e.target.checked)}
              />
              <span>Notify me when new featured tutorials & blogs are published</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={newPrompts}
                onChange={(e) => setNewPrompts(e.target.checked)}
              />
              <span>Notify me about new AI prompt packs</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={communityAnnouncements}
                onChange={(e) => setCommunityAnnouncements(e.target.checked)}
              />
              <span>Receive WhatsApp & Instagram community event announcements</span>
            </label>
          </div>

          <div className="pt-3">
            <GlassButton type="submit" disabled={saving}>
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Settings'}</span>
            </GlassButton>
          </div>
        </form>
      </GlassCard>

      {/* Personal Saved AI Prompts Library */}
      <GlassCard className="p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 font-display">
                My Saved AI Prompts Library ({savedPrompts.length})
              </h2>
              <p className="text-xs text-slate-600">
                Your personal collection of liked and bookmarked AI prompts.
              </p>
            </div>
          </div>
          <Link
            to="/prompts"
            className="text-xs font-semibold text-purple-700 hover:underline"
          >
            Browse Prompt Library →
          </Link>
        </div>

        {savedPrompts.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-800">No saved prompts yet</p>
            <p className="text-xs text-slate-500">
              Click the Save or Heart button on any prompt card to add it to your personal library.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savedPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-10">
    <GlassCard className="p-8 space-y-4 article-prose">
      <h1>Privacy Policy — Keerthi_dot_exe</h1>
      <p>Last Updated: October 2026</p>
      <h2>1. Information We Collect</h2>
      <p>
        When you register a community account or submit a contact enquiry on Keerthi_dot_exe, we collect only the information you explicitly provide (such as your name, email address, optional phone number, and enquiry message).
      </p>
      <h2>2. How We Protect Your Data</h2>
      <p>
        Passwords are hashed using industry-standard bcrypt algorithms and are never stored or transmitted in plain text. Authentication sessions use HttpOnly cookies, and administrative actions are recorded in an internal security audit trail.
      </p>
      <h2>3. Official Instagram API Media</h2>
      <p>
        Our Instagram feed displays authorized creator content from @keerthi_dot_exe via Meta’s official Instagram Graph API or approved embeds. We never request or store visitor Instagram credentials.
      </p>
      <h2>4. Account Deletion & Data Retention</h2>
      <p>
        You may request account removal or enquiry erasure at any time by contacting hello@keerthidotexe.com.
      </p>
    </GlassCard>
  </div>
);

export const TermsAndConditionsPage: React.FC = () => (
  <div className="max-w-4xl mx-auto px-4 py-10">
    <GlassCard className="p-8 space-y-4 article-prose">
      <h1>Terms & Conditions — Keerthi_dot_exe</h1>
      <p>Last Updated: October 2026</p>
      <h2>1. Community Prompt Usage</h2>
      <p>
        AI prompts published in the Keerthi_dot_exe Prompt Library may be copied and used for personal and commercial creative generations in Midjourney, Flux, Ideogram, Runway, and ComfyUI. Automated scraping or bulk redistribution of our curated library without attribution is prohibited.
      </p>
      <h2>2. User Conduct</h2>
      <p>
        Members joining our WhatsApp communities and platform agree to maintain a respectful, constructive learning environment.
      </p>
      <h2>3. Services & Consultations</h2>
      <p>
        Custom AI design deliverables, brand consultations, and workshops are governed by the project scope confirmed upon enquiry response.
      </p>
    </GlassCard>
  </div>
);
