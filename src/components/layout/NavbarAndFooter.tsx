import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  X,
  ShieldCheck,
  User,
  LogOut,
  Instagram,
  Youtube,
  MessageCircle,
  Sparkles,
  BookOpen,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationBell, SmartImage } from '../ui/GlassComponents';
import type { PromptItem, BlogPost } from '../../shared/types';

type SearchScope = 'all' | 'prompts' | 'blogs';

const GLOBAL_SEARCH_CATEGORIES = [
  'All',
  'Business',
  'Art',
  'Coding',
  'Marketing',
  'Tutorial',
  'AI Tools',
  'WhatsApp Status',
] as const;

export const GlassNavbar: React.FC = () => {
  const { user, homeData, logout } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [searchLoading, setSearchLoading] = useState(false);
  const [promptResults, setPromptResults] = useState<PromptItem[]>([]);
  const [blogResults, setBlogResults] = useState<BlogPost[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const settings = homeData?.settings;

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut Cmd/Ctrl + K to focus header search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch live search results for AI prompts & blog articles by title or category
  useEffect(() => {
    if (!searchOpen && !mobileMenuOpen && !searchQuery.trim() && selectedCategory === 'All') return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const q = searchQuery.trim();
        const res = await fetch(
          `/api/public/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(
            selectedCategory
          )}&type=${searchScope}&limit=5`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setPromptResults(data.prompts || []);
          setBlogResults(data.blogs || []);
        }
      } catch {
        // Ignore aborted requests
      } finally {
        setSearchLoading(false);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, selectedCategory, searchScope, searchOpen, mobileMenuOpen]);

  const buildDirectoryUrl = (basePath: '/prompts' | '/blog') => {
    const params = new URLSearchParams();
    const q = searchQuery.trim();
    if (q) params.set('search', q);
    if (selectedCategory && selectedCategory !== 'All') {
      params.set('category', selectedCategory);
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setMobileMenuOpen(false);

    const targetIsBlog =
      searchScope === 'blogs' ||
      (searchScope === 'all' &&
        (location.pathname.startsWith('/blog') ||
          (blogResults.length > 0 && promptResults.length === 0)));

    navigate(buildDirectoryUrl(targetIsBlog ? '/blog' : '/prompts'));
  };

  const handleCategoryFilterSelect = (category: string) => {
    setSelectedCategory(category);
    setSearchOpen(true);
  };

  const handleAnchorNav = (hash: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/${hash}`);
    } else {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const showPrompts = searchScope === 'all' || searchScope === 'prompts';
  const showBlogs = searchScope === 'all' || searchScope === 'blogs';
  const totalDisplayed =
    (showPrompts ? promptResults.length : 0) + (showBlogs ? blogResults.length : 0);
  const hasActiveFilter = Boolean(searchQuery.trim()) || selectedCategory !== 'All';

  return (
    <header className="sticky top-0 z-40 glass-pill-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Identity */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm bg-purple-100 shrink-0">
            <SmartImage
              src={settings?.logoUrl || '/assets/media/keerthi-avatar.png'}
              alt="Keerthi_dot_exe"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="leading-tight">
            <span className="block text-sm sm:text-base font-bold text-slate-900 font-display tracking-tight whitespace-nowrap">
              {settings?.siteName || 'Keerthi_dot_exe'}
            </span>
            <span className="block text-[10px] font-semibold tracking-wider uppercase text-slate-500 whitespace-nowrap">
              {settings?.tagline || 'AI CREATIVE COMMUNITY'}
            </span>
          </div>
        </Link>

        {/* Primary Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs font-semibold text-slate-700" aria-label="Main Navigation">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 ${
              location.pathname === '/' ? 'bg-purple-100/80 text-purple-800' : 'hover:text-slate-900'
            }`}
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => handleAnchorNav('#about')}
            className="hover:text-purple-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            About
          </button>
          <button
            type="button"
            onClick={() => handleAnchorNav('#services')}
            className="hover:text-purple-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Services
          </button>
          <Link
            to="/prompts"
            className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 ${
              location.pathname.startsWith('/prompts') ? 'bg-purple-100/80 text-purple-800' : 'hover:text-purple-700'
            }`}
          >
            AI Prompts
          </Link>
          <Link
            to="/blog"
            className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0 ${
              location.pathname.startsWith('/blog') ? 'bg-purple-100/80 text-purple-800' : 'hover:text-purple-700'
            }`}
          >
            Blog
          </Link>
          <button
            type="button"
            onClick={() => handleAnchorNav('#contact')}
            className="hover:text-purple-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Contact
          </button>
        </nav>

        {/* Unified Global Search Bar & Account Actions */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          <div ref={searchContainerRef} className="relative">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                role="searchbox"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search prompts & blog posts by title or category..."
                aria-label="Global search for prompts and blog posts by title or category"
                aria-expanded={searchOpen}
                className="w-60 xl:w-80 pl-8 pr-14 py-1.5 rounded-full bg-white/90 border border-slate-200/90 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/15 transition-all"
              />
              {hasActiveFilter ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search query and category filter"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden xl:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100/90 border border-slate-200/80 rounded-md absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  ⌘K
                </kbd>
              )}
            </form>

            {/* Instant Global Search Results Popover */}
            {searchOpen && (
              <div
                role="region"
                aria-label="Global Search Results"
                className="absolute right-0 mt-2.5 w-[460px] max-w-[92vw] rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-xl shadow-slate-900/10 overflow-hidden z-50"
              >
                {/* Scope Filter Tabs */}
                <div className="px-3.5 pt-3 pb-2 border-b border-slate-100 space-y-2 bg-slate-50/70">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {(
                        [
                          { id: 'all', label: 'All Content' },
                          { id: 'prompts', label: 'AI Prompts' },
                          { id: 'blogs', label: 'Blog Posts' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSearchScope(tab.id)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                            searchScope === tab.id
                              ? 'bg-purple-600 text-white shadow-2xs'
                              : 'text-slate-600 hover:bg-white hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <span className="text-[11px] font-medium text-slate-500 tabular-nums whitespace-nowrap">
                      {totalDisplayed} {totalDisplayed === 1 ? 'match' : 'matches'}
                    </span>
                  </div>

                  {/* Category Filter Controls */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5" role="group" aria-label="Filter global search by category">
                    {GLOBAL_SEARCH_CATEGORIES.map((cat) => {
                      const active = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCategoryFilterSelect(cat)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                            active
                              ? 'bg-slate-900 text-white'
                              : 'bg-white/90 text-slate-600 hover:text-slate-900 border border-slate-200/70'
                          }`}
                        >
                          {cat === 'All' ? 'All Categories' : cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Results Body */}
                <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
                  {searchLoading && totalDisplayed === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Searching prompts and blog posts by title or category...
                    </div>
                  ) : totalDisplayed === 0 ? (
                    <div className="p-6 text-center space-y-2">
                      <p className="text-xs font-semibold text-slate-800">
                        No matching prompts or blog posts
                        {searchQuery.trim() ? ` for “${searchQuery.trim()}”` : ''}
                        {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Try searching by title or category such as{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            handleCategoryFilterSelect('Business');
                          }}
                          className="font-semibold text-purple-700 hover:underline cursor-pointer"
                        >
                          Business
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            handleCategoryFilterSelect('Art');
                          }}
                          className="font-semibold text-purple-700 hover:underline cursor-pointer"
                        >
                          Art
                        </button>
                        ,{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            handleCategoryFilterSelect('Coding');
                          }}
                          className="font-semibold text-purple-700 hover:underline cursor-pointer"
                        >
                          Coding
                        </button>
                        , or{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            handleCategoryFilterSelect('Tutorial');
                          }}
                          className="font-semibold text-purple-700 hover:underline cursor-pointer"
                        >
                          Tutorial
                        </button>
                        .
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* AI Prompts Matches */}
                      {showPrompts && promptResults.length > 0 && (
                        <div className="p-3 space-y-1.5">
                          <div className="flex items-center justify-between px-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700">
                              <Sparkles className="w-3 h-3" />
                              {hasActiveFilter ? 'Matching AI Prompts' : 'Popular AI Prompts'}
                            </span>
                            <Link
                              to={buildDirectoryUrl('/prompts')}
                              onClick={() => setSearchOpen(false)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900"
                            >
                              View all
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                          <div className="space-y-1">
                            {promptResults.map((prompt) => (
                              <Link
                                key={prompt.id}
                                to={`/prompts/${prompt.slug}`}
                                onClick={() => setSearchOpen(false)}
                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-purple-50/70 transition-colors group"
                              >
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/70">
                                  <SmartImage
                                    src={prompt.previewImage}
                                    alt={prompt.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700 truncate">
                                    {prompt.title}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                                    <span className="font-semibold text-purple-700">
                                      {prompt.category}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span className="truncate">{prompt.recommendedModel}</span>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Blog Articles Matches */}
                      {showBlogs && blogResults.length > 0 && (
                        <div className="p-3 space-y-1.5">
                          <div className="flex items-center justify-between px-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                              <BookOpen className="w-3 h-3" />
                              {hasActiveFilter ? 'Matching Blog Posts' : 'Latest Blog Posts'}
                            </span>
                            <Link
                              to={buildDirectoryUrl('/blog')}
                              onClick={() => setSearchOpen(false)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
                            >
                              View all
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                          <div className="space-y-1">
                            {blogResults.map((blog) => (
                              <Link
                                key={blog.id}
                                to={`/blog/${blog.slug}`}
                                onClick={() => setSearchOpen(false)}
                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-indigo-50/70 transition-colors group"
                              >
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/70">
                                  <SmartImage
                                    src={blog.featuredImage}
                                    alt={blog.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 truncate">
                                    {blog.title}
                                  </p>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                                    <span className="font-semibold text-indigo-700">
                                      {blog.category}
                                    </span>
                                    <span aria-hidden="true">·</span>
                                    <span className="inline-flex items-center gap-1 tabular-nums">
                                      <Clock className="w-2.5 h-2.5" />
                                      {blog.readingTimeMinutes} min read
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer Action Links */}
                {hasActiveFilter && (
                  <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2 text-[11px]">
                    <Link
                      to={buildDirectoryUrl('/prompts')}
                      onClick={() => setSearchOpen(false)}
                      className="font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 truncate"
                    >
                      Browse Prompts{selectedCategory !== 'All' ? ` (${selectedCategory})` : ''}
                      <ArrowRight className="w-3 h-3 shrink-0" />
                    </Link>
                    <Link
                      to={buildDirectoryUrl('/blog')}
                      onClick={() => setSearchOpen(false)}
                      className="font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 shrink-0"
                    >
                      Browse Blog Posts
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <NotificationBell />
              {user.role === 'Admin' && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin CMS</span>
                </Link>
              )}
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 border border-slate-200/80 text-xs font-semibold text-slate-800 hover:bg-white whitespace-nowrap shrink-0"
              >
                <User className="w-3.5 h-3.5 text-purple-600" />
                <span className="max-w-[96px] truncate">{user.name}</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                aria-label="Log out"
                className="p-2 rounded-full bg-white/80 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200/80 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-full bg-white/90 hover:bg-white border border-slate-200/80 text-xs font-semibold text-slate-800 shadow-2xs transition-all whitespace-nowrap shrink-0"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white text-xs font-semibold shadow-sm shadow-purple-500/25 hover:brightness-105 transition-all whitespace-nowrap shrink-0"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          className="lg:hidden p-2 rounded-xl bg-white/85 border border-slate-200/80 text-slate-700"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer with Global Search by Title or Category */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 pt-3 pb-5 space-y-3">
          <form onSubmit={handleSearchSubmit} className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                role="searchbox"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompts & blog posts by title or category..."
                aria-label="Search prompts and blog posts by title or category on mobile"
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  aria-label="Clear mobile search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {GLOBAL_SEARCH_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'All' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            {hasActiveFilter && (
              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 space-y-2 max-h-64 overflow-y-auto">
                {promptResults.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-purple-700 px-1">
                      AI Prompts
                    </p>
                    {promptResults.slice(0, 3).map((p) => (
                      <Link
                        key={p.id}
                        to={`/prompts/${p.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-purple-50 text-xs"
                      >
                        <span className="font-semibold text-slate-800 truncate">{p.title}</span>
                        <span className="text-[10px] text-purple-700 font-medium whitespace-nowrap shrink-0">
                          {p.category}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                {blogResults.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-indigo-700 px-1">
                      Blog Posts
                    </p>
                    {blogResults.slice(0, 3).map((b) => (
                      <Link
                        key={b.id}
                        to={`/blog/${b.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-indigo-50 text-xs"
                      >
                        <span className="font-semibold text-slate-800 truncate">{b.title}</span>
                        <span className="text-[10px] text-indigo-700 font-medium whitespace-nowrap shrink-0">
                          {b.category}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
                {promptResults.length === 0 && blogResults.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-2">
                    No matching prompts or blog posts found.
                  </p>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/70 text-[11px] font-semibold">
                  <Link
                    to={buildDirectoryUrl('/prompts')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-purple-700"
                  >
                    All Prompts →
                  </Link>
                  <Link
                    to={buildDirectoryUrl('/blog')}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-indigo-700"
                  >
                    All Blog Posts →
                  </Link>
                </div>
              </div>
            )}
          </form>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-slate-100">
              Home
            </Link>
            <button
              type="button"
              onClick={() => handleAnchorNav('#about')}
              className="p-2 text-left rounded-lg hover:bg-slate-100"
            >
              About
            </button>
            <button
              type="button"
              onClick={() => handleAnchorNav('#services')}
              className="p-2 text-left rounded-lg hover:bg-slate-100"
            >
              Services
            </button>
            <Link
              to="/prompts"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              AI Prompts
            </Link>
            <Link
              to="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100"
            >
              Blog
            </Link>
            <button
              type="button"
              onClick={() => handleAnchorNav('#contact')}
              className="p-2 text-left rounded-lg hover:bg-slate-100"
            >
              Contact
            </button>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            {user ? (
              <>
                {user.role === 'Admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold"
                >
                  Profile ({user.name})
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export const GlassFooter: React.FC = () => {
  const { homeData } = useApp();
  const settings = homeData?.settings;

  return (
    <footer className="mt-16 border-t border-white/90 bg-white/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row items-center justify-between gap-5 text-xs text-slate-600">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
            <SmartImage
              src={settings?.logoUrl || '/assets/media/keerthi-avatar.png'}
              alt="Keerthi_dot_exe"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="block text-sm font-bold text-slate-900 font-display">
              {settings?.siteName || 'Keerthi_dot_exe'}
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-slate-500">
              {settings?.tagline || 'AI CREATIVE COMMUNITY'}
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium text-slate-700">
          <Link to="/" className="hover:text-purple-700 transition-colors">
            Home
          </Link>
          <a href="/#about" className="hover:text-purple-700 transition-colors">
            About
          </a>
          <a href="/#services" className="hover:text-purple-700 transition-colors">
            Services
          </a>
          <Link to="/prompts" className="hover:text-purple-700 transition-colors">
            AI Prompts
          </Link>
          <Link to="/blog" className="hover:text-purple-700 transition-colors">
            Blog
          </Link>
          <a href="/#contact" className="hover:text-purple-700 transition-colors">
            Contact
          </a>
          <span className="text-slate-300" aria-hidden="true">|</span>
          <Link to="/privacy-policy" className="hover:text-purple-700 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms-and-conditions" className="hover:text-purple-700 transition-colors">
            Terms & Conditions
          </Link>
        </div>

        {/* Social & Copyright */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <a
              href={settings?.instagramProfileUrl || 'https://www.instagram.com/keerthi_dot_exe/'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Keerthi_dot_exe Instagram"
              className="p-2 rounded-full bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href={settings?.youtubeUrl || 'https://www.youtube.com/@keerthi_dot_exe'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Keerthi_dot_exe YouTube"
              className="p-2 rounded-full bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 transition-colors"
            >
              <Youtube className="w-3.5 h-3.5" />
            </a>
            <a
              href={settings?.whatsappChannelUrl || '#whatsapp-communities'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Keerthi_dot_exe WhatsApp Community"
              className="p-2 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          </div>
          <span className="text-slate-500 whitespace-nowrap">
            © 2026 {settings?.siteName || 'Keerthi_dot_exe'}. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};
