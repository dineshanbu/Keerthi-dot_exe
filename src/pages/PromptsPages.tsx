import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  SlidersHorizontal,
  Briefcase,
  Palette,
  Code2,
  Megaphone,
  Layers,
  X,
  Heart,
  Bookmark,
  LockKeyhole,
  ShoppingBag,
} from 'lucide-react';
import { PROMPT_CATEGORIES, PRIMARY_PROMPT_FILTERS, type PromptItem, type AuthorSpotlightData } from '../shared/types';
import {
  GlassCard,
  GlassButton,
  PromptCard,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
  SmartImage,
  AuthorSpotlightSection,
  CommentSection,
} from '../components/ui/GlassComponents';
import { useApp } from '../context/AppContext';

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string; amount: number; currency: string; name: string; description: string; order_id: string;
      prefill: { name?: string; email?: string }; theme: { color: string };
      handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
    }) => { open: () => void; on: (event: string, callback: (event: { error?: { description?: string } }) => void) => void };
  }
}

type PromptSortOption = 'popular' | 'newest' | 'alphabetical' | 'category';

const PRIMARY_FILTER_META: Record<
  (typeof PRIMARY_PROMPT_FILTERS)[number],
  { label: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
  All: { label: 'All Prompts', description: 'Complete library', icon: Layers },
  Business: { label: 'Business', description: 'Branding, B2B & pitch kits', icon: Briefcase },
  Art: { label: 'Art', description: 'Portraits, fine art & visuals', icon: Palette },
  Coding: { label: 'Coding', description: 'Dev prompts & ComfyUI workflows', icon: Code2 },
  Marketing: { label: 'Marketing', description: 'Ads, social & growth campaigns', icon: Megaphone },
};

const SPECIALIZED_CATEGORIES = PROMPT_CATEGORIES.filter(
  (c) => !['Business', 'Art', 'Coding', 'Marketing'].includes(c)
);

export const PromptsDirectoryPage: React.FC = () => {
  const { savedPromptIds } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const initialTag = searchParams.get('tag') || '';
  const initialSavedOnly = searchParams.get('saved') === 'true';

  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [savedOnly, setSavedOnly] = useState(initialSavedOnly);
  const [sort, setSort] = useState<PromptSortOption>('popular');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlCat = searchParams.get('category') || 'All';
    const urlSearch = searchParams.get('search') || '';
    const urlSaved = searchParams.get('saved') === 'true';
    setCategory(urlCat);
    setSearch(urlSearch);
    setSavedOnly(urlSaved);
  }, [searchParams]);

  const fetchPrompts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (category && category !== 'All') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());
      if (selectedTag) params.set('tag', selectedTag);
      if (savedOnly) {
        params.set('savedOnly', 'true');
        params.set('savedIds', savedPromptIds.join(','));
      }
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', '9');

      const res = await fetch(`/api/public/prompts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load prompts');
      const data = await res.json();
      setPrompts(data.items || []);
      setTags(data.tags || []);
      setCategoryCounts(data.categoryCounts || {});
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch {
      setError('Could not load the AI Prompt Library. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [category, search, selectedTag, savedOnly, savedPromptIds, sort, page]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (cat === 'All') next.delete('category');
    else next.set('category', cat);
    setSearchParams(next);
  };

  const handleToggleSavedLibrary = () => {
    const nextSaved = !savedOnly;
    setSavedOnly(nextSaved);
    setPage(1);
    const next = new URLSearchParams(searchParams);
    if (nextSaved) next.set('saved', 'true');
    else next.delete('saved');
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setCategory('All');
    setSearch('');
    setSelectedTag('');
    setSavedOnly(false);
    setSort('popular');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Search */}
      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-1">
              KEERTHI_DOT_EXE LIBRARY
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              AI Prompt Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl">
              Filter and sort copy-ready prompts across Business, Art, Coding, Marketing, and specialized creative categories.
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                role="searchbox"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search prompts, models, tags..."
                aria-label="Search prompts"
                className="w-full sm:w-64 pl-9 pr-8 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  aria-label="Clear prompt search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                aria-label="Sort prompts"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as PromptSortOption);
                  setPage(1);
                }}
                className="rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="popular">Sort: Most Copied</option>
                <option value="newest">Sort: Newest First</option>
                <option value="alphabetical">Sort: Alphabetical (A–Z)</option>
                <option value="category">Sort: Category (A–Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dedicated Category & Sort Filter Bar (Business, Art, Coding, Marketing) */}
        <div
          role="region"
          aria-label="Prompt Category Filter Bar"
          className="mt-6 pt-5 border-t border-slate-200/70 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Filter by Core Category
              </span>
              <button
                type="button"
                onClick={handleToggleSavedLibrary}
                aria-pressed={savedOnly}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                  savedOnly
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/20'
                    : 'bg-rose-50/80 hover:bg-rose-100/80 text-rose-700 border-rose-200'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${savedOnly ? 'fill-current' : ''}`} />
                <span>My Saved Library ({savedPromptIds.length})</span>
              </button>
            </div>
            <span className="text-xs font-medium text-slate-500 font-mono">
              Showing {prompts.length} of {totalCount} matching prompts
            </span>
          </div>

          <div className="prompt-category-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {PRIMARY_PROMPT_FILTERS.map((filterKey) => {
              const meta = PRIMARY_FILTER_META[filterKey];
              const IconComponent = meta.icon;
              const isSelected = category.toLowerCase() === filterKey.toLowerCase();
              const count =
                filterKey === 'All'
                  ? categoryCounts.All ?? totalCount
                  : categoryCounts[filterKey] ?? 0;

              return (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => handleCategoryChange(filterKey)}
                  aria-pressed={isSelected}
                    className={`prompt-category-option flex items-center justify-between gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white border-purple-500 shadow-md shadow-purple-500/20'
                      : 'bg-white/85 hover:bg-white text-slate-800 border-slate-200/80 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold truncate">{meta.label}</span>
                      <span
                        className={`block text-[10px] truncate ${
                          isSelected ? 'text-purple-100' : 'text-slate-500'
                        }`}
                      >
                        {meta.description}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Specialized Sub-Categories Row */}
          <div className="pt-2">
            <div className="prompt-specialized-list flex items-center gap-2 overflow-x-auto pb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0 mr-1">
                Specialized:
              </span>
              {SPECIALIZED_CATEGORIES.map((cat) => {
                const isSelected = category.toLowerCase() === cat.toLowerCase();
                const count = categoryCounts[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    aria-pressed={isSelected}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80'
                    }`}
                  >
                    {cat}
                    {typeof count === 'number' ? ` (${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tag Filters & Active Filter Reset */}
          {tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Filter by Tag:</span>
              {tags.slice(0, 10).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedTag((prev) => (prev === t ? '' : t));
                    setPage(1);
                  }}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    selectedTag === t
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  #{t}
                </button>
              ))}
              {(category !== 'All' || search || selectedTag || savedOnly || sort !== 'popular') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-semibold text-purple-600 hover:underline ml-2 cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>
      </GlassCard>

      {/* Prompt Grid */}
      {loading ? (
        <LoadingSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPrompts} />
      ) : prompts.length === 0 ? (
        <EmptyState
          title={
            savedOnly
              ? 'Your Saved Prompt Library is Empty'
              : 'No prompts matched your filter'
          }
          description={
            savedOnly
              ? 'Click the Save or Heart button on any AI prompt card to build your personal collection of favorite prompts.'
              : 'Try clearing your search keyword or switching to All Categories.'
          }
          actionLabel="Browse All Prompts"
          onAction={handleResetFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onCopied={(id) =>
                  setPrompts((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, copiesCount: p.copiesCount + 1 } : p))
                  )
                }
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <GlassButton
                type="button"
                variant="glass"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </GlassButton>
              <span className="text-xs font-semibold text-slate-700 font-mono tabular-nums">
                Page {page} of {totalPages}
              </span>
              <GlassButton
                type="button"
                variant="glass"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </GlassButton>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const PromptDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { showToast, isPromptSaved, toggleSavePrompt, user } = useApp();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState<PromptItem | null>(null);
  const [authorSpotlight, setAuthorSpotlight] = useState<AuthorSpotlightData | null>(null);
  const [related, setRelated] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [purchase, setPurchase] = useState<{ required: boolean; owned: boolean; amountInPaise: number; currency: string; checkoutEnabled?: boolean } | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/public/prompts/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setPrompt(data.prompt);
        setPurchase(data.purchase || null);
        setAuthorSpotlight(data.authorSpotlight || null);
        setRelated(data.relatedPrompts || []);
        document.title = `${data.prompt.title} — AI Prompt | Keerthi_dot_exe`;
      } catch {
        setError('Prompt could not be found.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  const handlePurchase = async () => {
    if (!prompt || !purchase || purchase.owned || isPaying) return;
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/prompts/${prompt.slug}`)}`);
      return;
    }
    setIsPaying(true);
    try {
      const configResponse = await fetch('/api/public/payments/config');
      const config = await configResponse.json();
      if (!config.enabled || !config.keyId) throw new Error('Checkout setup is pending. Please contact the creator.');
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Payment checkout could not load.'));
          document.body.appendChild(script);
        });
      }
      const orderResponse = await fetch('/api/public/payments/prompt-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ promptId: prompt.id }),
      });
      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.error || 'Could not start payment.');
      const RazorpayCheckout = window.Razorpay;
      if (!RazorpayCheckout) throw new Error('Payment checkout did not load. Please refresh and try again.');
      const checkout = new RazorpayCheckout({
        key: orderData.keyId,
        amount: orderData.order.amountInPaise,
        currency: 'INR',
        name: 'Keerthi_dot_exe',
        description: prompt.title,
        order_id: orderData.order.providerOrderId,
        prefill: { name: user.name, email: user.email },
        theme: { color: '#6658e8' },
        handler: (response) => {
          void (async () => {
            try {
              const verifyResponse = await fetch('/api/public/payments/verify', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(response),
              });
              const verified = await verifyResponse.json();
              if (!verifyResponse.ok || !verified.paid) throw new Error(verified.error || 'Payment confirmation is pending.');
              const promptResponse = await fetch(`/api/public/prompts/${prompt.slug}`, { credentials: 'include' });
              const promptData = await promptResponse.json();
              setPrompt(promptData.prompt);
              setPurchase(promptData.purchase);
              showToast({ type: 'success', title: 'Purchase complete', description: 'Your prompt is now unlocked on this account.' });
            } catch (error) {
              showToast({ type: 'error', title: 'Payment verification pending', description: error instanceof Error ? error.message : 'Refresh this page shortly to check access.' });
            }
          })();
        },
      });
      checkout.on('payment.failed', (event) => showToast({ type: 'error', title: 'Payment not completed', description: event.error?.description || 'Please try again.' }));
      checkout.open();
    } catch (error) {
      showToast({ type: 'error', title: 'Checkout unavailable', description: error instanceof Error ? error.message : 'Please try again later.' });
    } finally {
      setIsPaying(false);
    }
  };

  const handleCopyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt.promptText);
    } catch {
      // Fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
    fetch(`/api/public/prompts/${prompt.id}/copy`, { method: 'POST' }).catch(() => {});
    setPrompt((prev) => (prev ? { ...prev, copiesCount: prev.copiesCount + 1 } : prev));
    showToast({
      type: 'success',
      title: 'Full Prompt Copied!',
      description: 'Paste it directly into your AI image or video tool.',
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <LoadingSkeleton count={2} />
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState message={error || 'Prompt not found'} />
      </div>
    );
  }

  const saved = isPromptSaved(prompt.id);

  return (
    <div className="prompt-detail-page max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="flex items-center justify-between">
        <Link
          to="/prompts"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-purple-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to AI Prompt Library</span>
        </Link>
        <div className="text-xs text-slate-500">
          <span>{prompt.category}</span>
          <span className="mx-1.5" aria-hidden="true">·</span>
          <span>{prompt.language}</span>
        </div>
      </div>

      <GlassCard className="prompt-detail-card p-4 sm:p-7 lg:p-8">
        <header className="prompt-detail-heading">
          <div className="prompt-detail-eyebrow-row">
            <div className="prompt-detail-eyebrow"><Sparkles className="w-4 h-4" /><span>{prompt.category}</span><span className="prompt-detail-dot" /><span>{prompt.language}</span></div>
            <button type="button" onClick={() => toggleSavePrompt(prompt)} aria-pressed={saved}
              className={`prompt-save-button inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${saved ? 'bg-rose-500 text-white border-rose-500 shadow-xs' : 'bg-white/85 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border-white'}`}>
              <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
              <span>{saved ? 'Saved' : 'Save prompt'}</span>
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-display leading-tight tracking-tight">{prompt.title}</h1>
          <p className="prompt-detail-description text-sm sm:text-base text-slate-600 leading-relaxed">{prompt.shortDescription}</p>
          <div className="prompt-model-pill"><span>Recommended model</span><strong>{prompt.recommendedModel}</strong>{prompt.isPaid && <strong className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">₹{((purchase?.amountInPaise || prompt.priceInPaise || 0) / 100).toLocaleString('en-IN')}</strong>}</div>
        </header>

        <div className="prompt-detail-content">
          <aside className="prompt-preview-column">
            <div className="prompt-preview-image rounded-2xl overflow-hidden bg-slate-900 border border-white shadow-lg">
              <SmartImage src={prompt.previewImage} alt={prompt.title} className="w-full h-full object-cover" />
              <span className="prompt-preview-caption"><Sparkles className="w-3.5 h-3.5" /> Preview</span>
            </div>
            <div className="prompt-author-meta">
              <span>Created by <strong>{prompt.authorName}</strong></span>
              <span className="prompt-copy-count">{prompt.copiesCount.toLocaleString()} copies</span>
            </div>
            {prompt.tags.length > 0 && <div className="prompt-tag-list">{prompt.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
          </aside>

          <div className="prompt-detail-main">
            {purchase?.required ? (
              <div className="rounded-3xl border border-white/90 bg-gradient-to-br from-white/95 via-indigo-50/90 to-cyan-50/85 p-6 sm:p-8 text-center shadow-lg">
                <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-100 text-indigo-700"><LockKeyhole className="h-7 w-7" /></div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-indigo-600">Creator prompt · one-time purchase</p>
                <h2 className="mt-2 text-xl font-extrabold text-slate-900">Unlock the complete prompt</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">Get the full copy-ready prompt and keep access in your account after checkout.</p>
                <button type="button" onClick={handlePurchase} disabled={isPaying || purchase.checkoutEnabled === false} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60">
                  <ShoppingBag className="h-4 w-4" />{isPaying ? 'Preparing secure checkout…' : `Unlock for ₹${(purchase.amountInPaise / 100).toLocaleString('en-IN')}`}
                </button>
                {!purchase.checkoutEnabled && <p className="mt-3 text-[11px] text-slate-500">Checkout setup is pending. Please contact the creator.</p>}
                {!user && <p className="mt-2 text-[11px] text-slate-500">Sign in or create a free account to complete your purchase.</p>}
              </div>
            ) : <div className="prompt-code-panel rounded-2xl bg-[#0F172A] text-slate-100 p-4 sm:p-5 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-700/80">
                <div className="prompt-code-label"><span className="prompt-code-indicator" /><span>Ready-to-use prompt</span></div>
                <button type="button" onClick={handleCopyPrompt}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-md shadow-indigo-950/30'}`}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy prompt'}</span>
                </button>
              </div>
              <pre className="prompt-code-text font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words text-slate-100 select-all">{prompt.promptText}</pre>
            </div>}

            {prompt.usageInstructions && <div className="prompt-usage-note p-4 rounded-xl bg-purple-50/70 border border-purple-200/60">
              <h2 className="text-xs font-bold text-purple-950 uppercase tracking-wider mb-1">How to use this prompt</h2>
              <p className="text-xs text-slate-700 leading-relaxed">{prompt.usageInstructions}</p>
            </div>}

            {prompt.externalToolUrl && <a href={prompt.externalToolUrl} target="_blank" rel="noopener noreferrer" className="prompt-tool-link inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors">
              <span>Open {prompt.recommendedModel.split('/')[0]}</span><ExternalLink className="w-3.5 h-3.5" />
            </a>}
          </div>
        </div>
      </GlassCard>

      {/* Author Section */}
      {authorSpotlight && (
        <AuthorSpotlightSection author={authorSpotlight} contextType="prompt" />
      )}

      {/* Community Comments & Feedback Section */}
      <CommentSection
        targetType="prompt"
        targetId={prompt.id}
        targetSlug={prompt.slug}
        targetTitle={prompt.title}
      />

      {/* Related Prompts */}
      {related.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 font-display mb-4">Related Prompts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {related.map((item) => (
              <PromptCard key={item.id} prompt={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
