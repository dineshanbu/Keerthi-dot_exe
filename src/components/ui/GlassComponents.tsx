import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Check,
  Copy,
  AlertCircle,
  Sparkles,
  Clock,
  X,
  CheckCircle2,
  Info,
  ExternalLink,
  Heart,
  Bookmark,
  BookOpen,
} from 'lucide-react';
import type { PromptItem, BlogPost, AuthorSpotlightData } from '../../shared/types';
import { useApp } from '../../context/AppContext';

export const SmartImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-indigo-50 to-sky-100 text-slate-600 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Sparkles className="w-7 h-7 text-purple-500 mb-1.5" />
        <span className="text-xs font-medium line-clamp-2 max-w-[180px]">{alt || 'Keerthi_dot_exe Visual'}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  subtle?: boolean;
}> = ({ children, className = '', subtle = false }) => (
  <div className={`${subtle ? 'glass-card-subtle' : 'glass-panel'} rounded-2xl ${className}`}>
    {children}
  </div>
);

export const GlassButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'dark' | 'glass' | 'danger';
    size?: 'sm' | 'md' | 'lg';
  }
> = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-sm',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6366F1] text-white shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 hover:brightness-105',
    dark: 'bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-md shadow-slate-900/15',
    glass:
      'bg-white/80 hover:bg-white text-slate-800 border border-white/90 shadow-sm hover:shadow',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  }[variant];

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const GlassInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
  }
> = ({ label, error, id, className = '', ...props }) => {
  const inputId = id || (label ? `inp-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-xl bg-white/85 border ${
          error ? 'border-rose-400 focus:ring-rose-400' : 'border-slate-200/80 focus:border-purple-500 focus:ring-purple-500/20'
        } px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

export const GlassDropdown: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    options: { value: string; label: string }[];
    error?: string;
  }
> = ({ label, options, error, id, className = '', ...props }) => {
  const selectId = id || (label ? `sel-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-xl bg-white/85 border ${
          error ? 'border-rose-400' : 'border-slate-200/80 focus:border-purple-500 focus:ring-purple-500/20'
        } px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-4 transition-all ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
};

export const GlassModal: React.FC<{
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}> = ({ open, title, onClose, children, maxWidthClass = 'max-w-2xl' }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto rounded-3xl bg-white/95 border border-white shadow-2xl p-6`}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 font-display">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const ConfirmationDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ open, title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) => (
  <GlassModal open={open} title={title} onClose={onCancel} maxWidthClass="max-w-md">
    <p className="text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>
    <div className="flex items-center justify-end gap-3">
      <GlassButton type="button" variant="glass" onClick={onCancel}>
        Cancel
      </GlassButton>
      <GlassButton type="button" variant="danger" onClick={onConfirm}>
        {confirmLabel}
      </GlassButton>
    </div>
  </GlassModal>
);

export const SectionHeading: React.FC<{
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionTo?: string;
  onActionClick?: () => void;
}> = ({ title, subtitle, actionLabel, actionTo, onActionClick }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-display tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-slate-600 mt-1">{subtitle}</p>}
    </div>
    {actionLabel && actionTo && (
      <Link
        to={actionTo}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 hover:bg-white border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-xs transition-all whitespace-nowrap shrink-0 self-start sm:self-auto"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
      </Link>
    )}
    {actionLabel && !actionTo && onActionClick && (
      <button
        type="button"
        onClick={onActionClick}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 hover:bg-white border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
      </button>
    )}
  </div>
);

export const PromptCard: React.FC<{
  prompt: PromptItem;
  onCopied?: (id: string) => void;
}> = ({ prompt, onCopied }) => {
  const [copied, setCopied] = useState(false);
  const { showToast, isPromptSaved, toggleSavePrompt } = useApp();
  const saved = isPromptSaved(prompt.id);
  const baseLikes = prompt.likesCount ?? Math.max(12, Math.round(prompt.copiesCount * 0.25));
  const [likesCount, setLikesCount] = useState(baseLikes);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt.promptText);
    } catch {
      // Fallback copy
      const ta = document.createElement('textarea');
      ta.value = prompt.promptText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    fetch(`/api/public/prompts/${prompt.id}/copy`, { method: 'POST' }).catch(() => {});
    onCopied?.(prompt.id);
    showToast({
      type: 'success',
      title: 'Prompt Copied!',
      description: `"${prompt.title}" is ready to paste into ${prompt.recommendedModel}.`,
    });
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowSaved = await toggleSavePrompt(prompt);
    setLikesCount((prev) => (nowSaved ? prev + 1 : Math.max(0, prev - 1)));
  };

  return (
    <GlassCard className="p-4 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-0.5">
      <div>
        <div className="relative h-44 rounded-xl overflow-hidden mb-3.5 bg-slate-100">
          <SmartImage
            src={prompt.previewImage}
            alt={prompt.title}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleToggleSave}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${prompt.title} from saved library` : `Save ${prompt.title} to personal library`}
            className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md transition-all cursor-pointer shadow-xs ${
              saved
                ? 'bg-rose-500 text-white'
                : 'bg-white/90 hover:bg-white text-slate-700 hover:text-rose-600'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
            <span className="font-mono tabular-nums">{likesCount}</span>
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
          <span className="font-semibold text-purple-700">{prompt.category}</span>
          <span aria-hidden="true">·</span>
          <span>{prompt.recommendedModel}</span>
        </div>
        <Link to={`/prompts/${prompt.slug}`} className="block group">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-1 font-display">
            {prompt.title}
          </h3>
        </Link>
        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
          {prompt.shortDescription}
        </p>
        <div className="mt-3 p-2.5 rounded-xl bg-slate-900/5 border border-slate-200/70 font-mono text-xs text-slate-700 line-clamp-2">
          {prompt.promptText}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-3.5 mt-3.5 border-t border-slate-200/60">
        <span className="text-xs text-slate-500 font-mono tabular-nums">
          {prompt.copiesCount.toLocaleString()} copies
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleSave}
            aria-pressed={saved}
            aria-label={saved ? `Saved ${prompt.title}` : `Save ${prompt.title}`}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              saved
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 hover:text-rose-600'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current text-rose-600' : ''}`} />
            <span>{saved ? 'Saved' : 'Save'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy prompt for ${prompt.title}`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
          </button>
          <Link
            to={`/prompts/${prompt.slug}`}
            aria-label={`View details for ${prompt.title}`}
            className="p-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-700 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </GlassCard>
  );
};

export const BlogCard: React.FC<{ post: BlogPost; compact?: boolean }> = ({ post, compact = false }) => {
  const formattedDate = new Date(post.publishAt).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group glass-panel rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div>
        <div className={`relative ${compact ? 'h-32' : 'h-44'} rounded-xl overflow-hidden bg-slate-900 mb-3`}>
          <SmartImage
            src={post.featuredImage}
            alt={post.imageAlt || post.title}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />
          <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase text-slate-800 shadow-xs">
            {post.category}
          </div>
          <div className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-purple-600 shadow-xs group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <h3
          className={`${
            compact ? 'text-sm' : 'text-base'
          } font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2 font-display leading-snug`}
        >
          {post.title}
        </h3>
        {!compact && (
          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">{post.excerpt}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 font-mono tabular-nums">
        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
        <span>{formattedDate}</span>
        {!compact && (
          <>
            <span aria-hidden="true">·</span>
            <span>{post.readingTimeMinutes} min read</span>
          </>
        )}
      </div>
    </Link>
  );
};

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative p-2 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 text-slate-700 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center font-mono tabular-nums">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl p-4 z-50">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-900 font-display">
              Notifications ({unreadCount} unread)
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800 cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No notifications yet.</p>
            ) : (
              notifications.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    markNotificationRead(n.id);
                    setOpen(false);
                    navigate(n.link);
                  }}
                  className={`w-full text-left py-2.5 px-2 rounded-xl transition-colors hover:bg-slate-50 flex items-start justify-between gap-2 cursor-pointer ${
                    !n.read ? 'bg-purple-50/50' : ''
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                  </div>
                  {!n.read && (
                    <span className="text-[10px] font-bold text-purple-700 shrink-0">NEW</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const LoadingSkeleton: React.FC<{ count?: number; className?: string }> = ({
  count = 3,
  className = 'h-48',
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
    {Array.from({ length: count }).map((_, idx) => (
      <div
        key={idx}
        className={`rounded-2xl bg-white/60 border border-white/80 animate-pulse p-4 ${className}`}
      />
    ))}
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => (
  <GlassCard className="p-8 text-center max-w-lg mx-auto my-6">
    <Sparkles className="w-8 h-8 text-purple-500 mx-auto mb-3" />
    <h3 className="text-base font-bold text-slate-900 font-display">{title}</h3>
    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <div className="mt-4">
        <GlassButton type="button" size="sm" onClick={onAction}>
          {actionLabel}
        </GlassButton>
      </div>
    )}
  </GlassCard>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <GlassCard className="p-6 border-rose-200 bg-rose-50/60 text-center max-w-lg mx-auto my-6">
    <AlertCircle className="w-7 h-7 text-rose-600 mx-auto mb-2" />
    <p className="text-sm font-semibold text-rose-900">{message}</p>
    {onRetry && (
      <div className="mt-3">
        <GlassButton type="button" size="sm" variant="glass" onClick={onRetry}>
          Try Again
        </GlassButton>
      </div>
    )}
  </GlassCard>
);

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-xl"
        >
          {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
          {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900">{t.title}</p>
            {t.description && <p className="text-xs text-slate-600 mt-0.5">{t.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export const AuthorSpotlightSection: React.FC<{
  author: AuthorSpotlightData;
  contextType?: 'prompt' | 'blog';
}> = ({ author, contextType = 'prompt' }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'prompts' | 'blogs'>('all');

  const showPrompts = activeTab === 'all' || activeTab === 'prompts';
  const showBlogs = activeTab === 'all' || activeTab === 'blogs';

  return (
    <section
      role="region"
      aria-label="About the Author"
      className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-white/90"
    >
      {/* Creator Header: Avatar, Name, Role, Stats & Bio */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-200/70">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-purple-100 shrink-0">
            <SmartImage
              src={author.avatarUrl || '/assets/media/keerthi-avatar.png'}
              alt={author.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                {contextType === 'prompt' ? 'Prompt Creator' : 'Article Author'}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                <CheckCircle2 className="w-3 h-3" />
                Verified Creator
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display tracking-tight">
                {author.name}
              </h2>
              <p className="text-xs font-semibold text-purple-700 mt-0.5">{author.role}</p>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{author.bio}</p>

            {/* Creator Portfolio Metrics */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-slate-700">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 border border-slate-200/80">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span className="font-mono">{author.totalPublishedPrompts}</span> Published Prompts
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/85 border border-slate-200/80">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-mono">{author.totalPublishedBlogs}</span> Published Guides
              </span>
            </div>
          </div>
        </div>

        {/* Creator Community Actions */}
        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0">
          {author.instagramUrl && (
            <a
              href={author.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white text-xs font-semibold shadow-sm shadow-purple-500/20 hover:brightness-105 transition-all whitespace-nowrap"
            >
              <span>Follow @keerthi_dot_exe</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <Link
            to="/prompts"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 transition-colors whitespace-nowrap"
          >
            <span>Explore Full Portfolio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Author's Other Published Content */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              More Published Content by {author.name}
            </h3>
            <p className="text-xs text-slate-500">
              Explore other copy-ready AI prompts and step-by-step tutorials from this creator.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {(
              [
                { id: 'all', label: 'All Content' },
                { id: 'prompts', label: `AI Prompts (${author.otherPrompts.length})` },
                { id: 'blogs', label: `Blog Guides (${author.otherBlogs.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showPrompts &&
            author.otherPrompts.map((p) => (
              <Link
                key={`auth-prm-${p.id}`}
                to={`/prompts/${p.slug}`}
                className="group flex items-center gap-3.5 p-3 rounded-2xl bg-white/85 hover:bg-white border border-slate-200/80 hover:border-purple-300 transition-all shadow-2xs"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <SmartImage
                    src={p.previewImage}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
                    <Sparkles className="w-3 h-3" />
                    <span>AI Prompt · {p.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors truncate font-display mt-0.5">
                    {p.title}
                  </h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {p.recommendedModel} · {p.copiesCount.toLocaleString()} copies
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 shrink-0" />
              </Link>
            ))}

          {showBlogs &&
            author.otherBlogs.map((b) => (
              <Link
                key={`auth-blg-${b.id}`}
                to={`/blog/${b.slug}`}
                className="group flex items-center gap-3.5 p-3 rounded-2xl bg-white/85 hover:bg-white border border-slate-200/80 hover:border-indigo-300 transition-all shadow-2xs"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <SmartImage
                    src={b.featuredImage}
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                    <BookOpen className="w-3 h-3" />
                    <span>Blog Guide · {b.category}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate font-display mt-0.5">
                    {b.title}
                  </h4>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {b.readingTimeMinutes} min read · {b.views.toLocaleString()} views
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
};

