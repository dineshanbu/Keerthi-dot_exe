import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  Search,
  Clock,
  ArrowLeft,
  ArrowRight,
  Share2,
  Copy,
  Check,
  BookOpen,
} from 'lucide-react';
import type { BlogPost, PromptItem, AuthorSpotlightData } from '../shared/types';
import {
  GlassCard,
  BlogCard,
  PromptCard,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
  SmartImage,
  AuthorSpotlightSection,
} from '../components/ui/GlassComponents';
import { extractTableOfContents, injectHeadingIds } from '../utils/platformLogic';
import { useApp } from '../context/AppContext';

export const BlogDirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCat = searchParams.get('category') || 'All';
    setSearch(urlSearch);
    setSelectedCategory(urlCat);
  }, [searchParams]);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (selectedCategory !== 'All') params.set('category', selectedCategory);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/public/blogs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load blog posts');
      const data = await res.json();
      setBlogs(data.items || []);
      setFeaturedPost(data.featuredPost || null);
      setCategories(data.categories || []);
    } catch {
      setError('Failed to load blog articles.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header & Search */}
      <GlassCard className="p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-1">
              KEERTHI_DOT_EXE EDITORIAL
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              AI Tutorials, Guides & Workflows
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl">
              Practical articles on AI image generation, viral WhatsApp status design, video tools, ComfyUI workflows, and commercial branding.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tutorials & guides..."
              aria-label="Search blog articles"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-5 mt-5 border-t border-slate-200/70">
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Featured Article Banner */}
      {featuredPost && selectedCategory === 'All' && !search && (
        <GlassCard className="p-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 h-60 sm:h-72 rounded-2xl overflow-hidden bg-slate-900">
              <SmartImage
                src={featuredPost.featuredImage}
                alt={featuredPost.imageAlt || featuredPost.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-6 space-y-3.5">
              <div className="flex items-center gap-2 text-xs text-purple-700 font-semibold">
                <span>Featured Guide</span>
                <span aria-hidden="true">·</span>
                <span>{featuredPost.category}</span>
                <span aria-hidden="true">·</span>
                <span>{featuredPost.readingTimeMinutes} min read</span>
              </div>
              <Link to={`/blog/${featuredPost.slug}`} className="block group">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 group-hover:text-purple-700 transition-colors font-display leading-tight">
                  {featuredPost.title}
                </h2>
              </Link>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {featuredPost.excerpt}
              </p>
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                    <SmartImage
                      src={featuredPost.author.avatarUrl}
                      alt={featuredPost.author.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{featuredPost.author.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(featuredPost.publishAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/blog/${featuredPost.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all"
                >
                  <span>Read Full Article</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Articles Grid */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBlogs} />
      ) : blogs.length === 0 ? (
        <EmptyState
          title="No articles found"
          description="Try searching with a different keyword or selecting All Categories."
          actionLabel="Reset Search"
          onAction={() => {
            setSelectedCategory('All');
            setSearch('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export const BlogDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { showToast } = useApp();
  const [article, setArticle] = useState<BlogPost | null>(null);
  const [authorSpotlight, setAuthorSpotlight] = useState<AuthorSpotlightData | null>(null);
  const [relatedPrompts, setRelatedPrompts] = useState<PromptItem[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<BlogPost[]>([]);
  const [prevArticle, setPrevArticle] = useState<BlogPost | null>(null);
  const [nextArticle, setNextArticle] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/public/blogs/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setArticle(data.article);
        setAuthorSpotlight(data.authorSpotlight || null);
        setRelatedPrompts(data.relatedPrompts || []);
        setRelatedArticles(data.relatedArticles || []);
        setPrevArticle(data.previousArticle || null);
        setNextArticle(data.nextArticle || null);
        document.title = data.article.seoTitle || `${data.article.title} | Keerthi_dot_exe`;
      } catch {
        setError('Blog article not found.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <LoadingSkeleton count={2} />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ErrorState message={error || 'Article not found'} />
      </div>
    );
  }

  const toc = extractTableOfContents(article.content);
  const htmlWithIds = injectHeadingIds(article.content);

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Ignore
    }
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
    showToast({ type: 'success', title: 'Article Link Copied!' });
  };

  return (
    <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center justify-between text-xs text-slate-500">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-purple-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Articles</span>
        </Link>
        <div className="flex items-center gap-2">
          <span>{article.category}</span>
          <span aria-hidden="true">·</span>
          <span>{article.readingTimeMinutes} min read</span>
          <span aria-hidden="true">·</span>
          <span>{article.wordCount} words</span>
        </div>
      </nav>

      {/* Article Hero Header */}
      <GlassCard className="p-6 sm:p-10">
        <div className="max-w-3xl mx-auto space-y-4 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-700">
            {article.category}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display leading-tight">
            {article.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{article.excerpt}</p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200">
                <SmartImage
                  src={article.author.avatarUrl}
                  alt={article.author.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-semibold text-slate-800">{article.author.name}</span>
            </div>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
              <Clock className="w-3.5 h-3.5" />
              {new Date(article.publishAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleShareLink}
              className="inline-flex items-center gap-1 font-semibold text-purple-700 hover:underline cursor-pointer"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedShare ? 'Link Copied' : 'Share Article'}</span>
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl overflow-hidden bg-slate-900 max-h-96 border border-white shadow-lg">
          <SmartImage
            src={article.featuredImage}
            alt={article.imageAlt || article.title}
            className="w-full h-80 sm:h-96 object-cover"
          />
        </div>

        {/* Main Content + Table of Contents Sidebar */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {toc.length > 0 && (
            <aside className="lg:col-span-4 order-1 lg:order-2">
              <div className="sticky top-24 rounded-2xl bg-slate-50/90 border border-slate-200/80 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 font-display">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>Table of Contents</span>
                </div>
                <ul className="space-y-2 text-xs">
                  {toc.map((heading) => (
                    <li
                      key={heading.id}
                      className={heading.level === 3 ? 'pl-3' : ''}
                    >
                      <a
                        href={`#${heading.id}`}
                        className="text-slate-600 hover:text-purple-700 transition-colors block leading-snug"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          )}

          <div className={`${toc.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'} order-2 lg:order-1`}>
            <div
              className="article-prose"
              dangerouslySetInnerHTML={{ __html: htmlWithIds }}
            />

            {relatedPrompts.length > 0 && (
              <div className="mt-6 p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-purple-300">
                    Featured Prompt from this Guide ({relatedPrompts[0].recommendedModel})
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(relatedPrompts[0].promptText);
                      } catch {
                        // ignore
                      }
                      showToast({
                        type: 'success',
                        title: 'Prompt Copied from Article!',
                        description: relatedPrompts[0].title,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt</span>
                  </button>
                </div>
                <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap">
                  {relatedPrompts[0].promptText}
                </pre>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span>Topics: </span>
                <span className="font-semibold text-slate-800">{article.tags.join(' · ')}</span>
              </div>
              <button
                type="button"
                onClick={handleShareLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Direct Article URL</span>
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Author Section */}
      {authorSpotlight && (
        <AuthorSpotlightSection author={authorSpotlight} contextType="blog" />
      )}

      {/* Previous / Next Navigation */}
      {(prevArticle || nextArticle) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevArticle ? (
            <Link
              to={`/blog/${prevArticle.slug}`}
              className="glass-panel rounded-2xl p-4 hover:bg-white transition-colors"
            >
              <span className="text-[11px] text-slate-500">← Previous Article</span>
              <p className="text-sm font-bold text-slate-900 mt-1 font-display line-clamp-1">
                {prevArticle.title}
              </p>
            </Link>
          ) : (
            <div />
          )}
          {nextArticle && (
            <Link
              to={`/blog/${nextArticle.slug}`}
              className="glass-panel rounded-2xl p-4 text-right hover:bg-white transition-colors"
            >
              <span className="text-[11px] text-slate-500">Next Article →</span>
              <p className="text-sm font-bold text-slate-900 mt-1 font-display line-clamp-1">
                {nextArticle.title}
              </p>
            </Link>
          )}
        </div>
      )}

      {/* Related Prompts */}
      {relatedPrompts.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 font-display mb-4">
            Related AI Prompts from this Article
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {relatedPrompts.map((p) => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        </section>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-slate-900 font-display mb-4">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {relatedArticles.map((b) => (
              <BlogCard key={b.id} post={b} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
};
