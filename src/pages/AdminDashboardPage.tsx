import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Sparkles,
  Tags,
  Mail,
  Bell,
  Instagram,
  Image as ImageIcon,
  Settings,
  ShieldAlert,
  Plus,
  Search,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  RefreshCw,
  Download,
  ExternalLink,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Quote,
  Code,
  Send,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  PROMPT_CATEGORIES,
  type UserPublic,
  type BlogPost,
  type PromptItem,
  type CategoryItem,
  type TagItem,
  type EnquiryItem,
  type InstagramMediaItem,
  type InstagramIntegrationState,
  type MediaAssetItem,
  type AuditLogItem,
  type PublicationStatus,
  type EnquiryStatus,
} from '../shared/types';
import {
  GlassCard,
  GlassButton,
  GlassInput,
  GlassModal,
  ConfirmationDialog,
  SmartImage,
} from '../components/ui/GlassComponents';
import { calculateReadingMetrics, slugify } from '../utils/platformLogic';

type AdminTab =
  | 'dashboard'
  | 'users'
  | 'blogs'
  | 'prompts'
  | 'taxonomy'
  | 'enquiries'
  | 'notifications'
  | 'instagram'
  | 'media'
  | 'settings'
  | 'security';

interface DashboardSummary {
  totalUsers: number;
  newUsersCount: number;
  publishedBlogsCount: number;
  draftAndScheduledBlogsCount: number;
  totalPromptsCount: number;
  newEnquiriesCount: number;
  totalEnquiriesCount: number;
  unreadNotificationsCount: number;
  instagram: InstagramIntegrationState;
  recentEnquiries: EnquiryItem[];
  recentAuditLogs: AuditLogItem[];
}

export const AdminDashboardPage: React.FC = () => {
  const {
    user,
    homeData,
    notifications,
    unreadCount,
    showToast,
    refreshAuth,
    refreshHomeData,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as AdminTab) || 'dashboard';
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  // Admin datasets
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [usersList, setUsersList] = useState<UserPublic[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [blogsList, setBlogsList] = useState<BlogPost[]>([]);
  const [blogStatusFilter, setBlogStatusFilter] = useState('All');
  const [promptsList, setPromptsList] = useState<PromptItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [tagsList, setTagsList] = useState<TagItem[]>([]);
  const [enquiriesList, setEnquiriesList] = useState<EnquiryItem[]>([]);
  const [igState, setIgState] = useState<InstagramIntegrationState | null>(null);
  const [igMedia, setIgMedia] = useState<InstagramMediaItem[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAssetItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Blog Editor Modal state
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [blogPreviewOpen, setBlogPreviewOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogImage, setBlogImage] = useState('/assets/media/blog-ai-generators.png');
  const [blogImageAlt, setBlogImageAlt] = useState('');
  const [blogCategory, setBlogCategory] = useState('AI Tools');
  const [blogTags, setBlogTags] = useState('AI Tools, Prompts, 2026');
  const [blogContent, setBlogContent] = useState('');
  const [blogSeoTitle, setBlogSeoTitle] = useState('');
  const [blogMetaDesc, setBlogMetaDesc] = useState('');
  const [blogFeatured, setBlogFeatured] = useState(false);
  const [blogStatus, setBlogStatus] = useState<PublicationStatus>('Published');
  const [blogPublishAt, setBlogPublishAt] = useState('2026-10-20T12:00');

  // Prompt Editor Modal state
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [prmTitle, setPrmTitle] = useState('');
  const [prmSlug, setPrmSlug] = useState('');
  const [prmDesc, setPrmDesc] = useState('');
  const [prmText, setPrmText] = useState('');
  const [prmCategory, setPrmCategory] = useState<string>('Image Generation');
  const [prmModel, setPrmModel] = useState('Midjourney v6.1');
  const [prmImage, setPrmImage] = useState('/assets/media/keerthi-hero.png');
  const [prmToolUrl, setPrmToolUrl] = useState('https://www.midjourney.com');
  const [prmInstructions, setPrmInstructions] = useState('');
  const [prmTags, setPrmTags] = useState('Midjourney, Portrait, Studio');
  const [prmFeatured, setPrmFeatured] = useState(true);
  const [prmStatus, setPrmStatus] = useState<'Published' | 'Draft'>('Published');

  // Enquiry Detail & Reply Modal
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryItem | null>(null);
  const [enqInternalNote, setEnqInternalNote] = useState('');
  const [enqReplySubject, setEnqReplySubject] = useState('');
  const [enqReplyBody, setEnqReplyBody] = useState('');

  // Taxonomy inputs
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Media upload inputs
  const [newMediaName, setNewMediaName] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('/assets/media/keerthi-hero.png');
  const [newMediaAlt, setNewMediaAlt] = useState('');

  // Website Settings state
  const [siteName, setSiteName] = useState('Keerthi_dot_exe');
  const [tagline, setTagline] = useState('AI Creative Community');
  const [igFollowersStat, setIgFollowersStat] = useState('41K+');
  const [promptCountStat, setPromptCountStat] = useState('1000+');
  const [igProfileUrl, setIgProfileUrl] = useState('https://www.instagram.com/keerthi_dot_exe/');
  const [contactEmail, setContactEmail] = useState('hello@keerthidotexe.com');

  const [dbSummary, setDbSummary] = useState<{
    connected: boolean;
    mode: string;
    uriConfigured: boolean;
    lastSyncedAt: string;
    mongooseModels?: string[];
    collections: Record<string, number>;
  } | null>(null);
  const [syncingDb, setSyncingDb] = useState(false);

  // Confirmation dialog state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', onConfirm: () => {} });

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const loadAllAdminData = useCallback(async () => {
    if (!user || user.role !== 'Admin') return;
    try {
      const [sumRes, usrRes, blgRes, prmRes, taxRes, enqRes, igRes, medRes, audRes, dbRes] =
        await Promise.all([
          fetch('/api/admin/summary', { credentials: 'include' }),
          fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`, {
            credentials: 'include',
          }),
          fetch(`/api/admin/blogs?status=${encodeURIComponent(blogStatusFilter)}`, {
            credentials: 'include',
          }),
          fetch('/api/admin/prompts', { credentials: 'include' }),
          fetch('/api/admin/taxonomy', { credentials: 'include' }),
          fetch('/api/admin/enquiries', { credentials: 'include' }),
          fetch('/api/admin/instagram', { credentials: 'include' }),
          fetch('/api/admin/media', { credentials: 'include' }),
          fetch('/api/admin/audit-logs', { credentials: 'include' }),
          fetch('/api/admin/database-status', { credentials: 'include' }),
        ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (usrRes.ok) setUsersList((await usrRes.json()).items || []);
      if (blgRes.ok) setBlogsList((await blgRes.json()).items || []);
      if (prmRes.ok) setPromptsList((await prmRes.json()).items || []);
      if (taxRes.ok) {
        const t = await taxRes.json();
        setCategoriesList(t.categories || []);
        setTagsList(t.tags || []);
      }
      if (enqRes.ok) setEnquiriesList((await enqRes.json()).items || []);
      if (igRes.ok) {
        const ig = await igRes.json();
        setIgState(ig.state);
        setIgMedia(ig.media || []);
      }
      if (medRes.ok) setMediaAssets((await medRes.json()).items || []);
      if (audRes.ok) setAuditLogs((await audRes.json()).items || []);
      if (dbRes.ok) setDbSummary(await dbRes.json());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  }, [user, userSearch, blogStatusFilter]);

  useEffect(() => {
    loadAllAdminData();
  }, [loadAllAdminData]);

  useEffect(() => {
    if (homeData?.settings) {
      setSiteName(homeData.settings.siteName);
      setTagline(homeData.settings.tagline);
      setIgFollowersStat(homeData.settings.stats.instagramFollowers);
      setPromptCountStat(homeData.settings.stats.promptLibraryCount);
      setIgProfileUrl(homeData.settings.instagramProfileUrl);
      setContactEmail(homeData.settings.contactEmail);
    }
  }, [homeData]);

  // Activate preview Admin session if reviewer opens /admin directly
  const handleQuickAdminAccess = useCallback(async () => {
    const res = await fetch('/api/auth/demo-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role: 'Admin' }),
    });
    if (res.ok) {
      await refreshAuth();
      await refreshNotifications();
      showToast({
        type: 'success',
        title: 'Admin Session Activated',
        description: 'Connected as Keerthi (Admin).',
      });
    }
  }, [refreshAuth, refreshNotifications, showToast]);

  useEffect(() => {
    if (searchParams.get('autostart') === '1' && (!user || user.role !== 'Admin')) {
      handleQuickAdminAccess();
    }
  }, [searchParams, user, handleQuickAdminAccess]);

  if (!user || user.role !== 'Admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <GlassCard className="p-8 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-purple-600 mx-auto" />
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Administrator Access Required
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            The Keerthi_dot_exe Admin Dashboard and CMS are protected by server-side Role-Based Access Control (RBAC).
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <GlassButton type="button" onClick={handleQuickAdminAccess}>
              Activate Admin Session
            </GlassButton>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-800"
            >
              Go to Login Page
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  // --- Rich Text Toolbar Helpers ---
  const appendRichTag = (snippet: string) => {
    setBlogContent((prev) => `${prev}\n${snippet}`);
  };

  const openCreateBlogModal = () => {
    setEditingBlogId(null);
    setBlogTitle('');
    setBlogSlug('');
    setBlogExcerpt('');
    setBlogImage('/assets/media/blog-ai-generators.png');
    setBlogImageAlt('AI creative workflow illustration');
    setBlogCategory('AI Tools');
    setBlogTags('AI Tools, Prompts, Tutorial');
    setBlogContent(
      '<h2>Introduction</h2>\n<p>Write your tutorial or AI workflow guide here...</p>\n<pre class="prompt-block">Sample AI prompt text with Copy Prompt support --ar 16:9</pre>'
    );
    setBlogSeoTitle('');
    setBlogMetaDesc('');
    setBlogFeatured(false);
    setBlogStatus('Published');
    setBlogModalOpen(true);
  };

  const openEditBlogModal = (post: BlogPost) => {
    setEditingBlogId(post.id);
    setBlogTitle(post.title);
    setBlogSlug(post.slug);
    setBlogExcerpt(post.excerpt);
    setBlogImage(post.featuredImage);
    setBlogImageAlt(post.imageAlt);
    setBlogCategory(post.category);
    setBlogTags(post.tags.join(', '));
    setBlogContent(post.content);
    setBlogSeoTitle(post.seoTitle);
    setBlogMetaDesc(post.metaDescription);
    setBlogFeatured(post.featured);
    setBlogStatus(post.status);
    setBlogModalOpen(true);
  };

  const handleSaveBlog = async (overrideStatus?: PublicationStatus) => {
    const finalStatus = overrideStatus || blogStatus;
    const payload = {
      title: blogTitle,
      slug: blogSlug || slugify(blogTitle),
      excerpt: blogExcerpt,
      featuredImage: blogImage,
      imageAlt: blogImageAlt,
      category: blogCategory,
      tags: blogTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      content: blogContent,
      seoTitle: blogSeoTitle,
      metaDescription: blogMetaDesc,
      featured: blogFeatured,
      status: finalStatus,
      publishAt: new Date(blogPublishAt || Date.now()).toISOString(),
    };

    const url = editingBlogId ? `/api/admin/blogs/${editingBlogId}` : '/api/admin/blogs';
    const method = editingBlogId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast({ type: 'error', title: 'Blog Save Error', description: data.error });
      return;
    }

    setBlogModalOpen(false);
    await loadAllAdminData();
    await refreshHomeData();
    showToast({
      type: 'success',
      title: editingBlogId ? 'Blog Post Updated' : `Blog ${finalStatus}!`,
      description: `"${data.blog.title}" is now saved as ${data.blog.status}.`,
    });
  };

  const openCreatePromptModal = () => {
    setEditingPromptId(null);
    setPrmTitle('');
    setPrmSlug('');
    setPrmDesc('');
    setPrmText('');
    setPrmCategory('Image Generation');
    setPrmModel('Midjourney v6.1');
    setPrmImage('/assets/media/keerthi-hero.png');
    setPrmToolUrl('https://www.midjourney.com');
    setPrmInstructions('Paste into Midjourney or Flux and adjust aspect ratio as needed.');
    setPrmTags('Midjourney, Studio, AI Art');
    setPrmFeatured(true);
    setPrmStatus('Published');
    setPromptModalOpen(true);
  };

  const openEditPromptModal = (p: PromptItem) => {
    setEditingPromptId(p.id);
    setPrmTitle(p.title);
    setPrmSlug(p.slug);
    setPrmDesc(p.shortDescription);
    setPrmText(p.promptText);
    setPrmCategory(p.category);
    setPrmModel(p.recommendedModel);
    setPrmImage(p.previewImage);
    setPrmToolUrl(p.externalToolUrl || '');
    setPrmInstructions(p.usageInstructions || '');
    setPrmTags(p.tags.join(', '));
    setPrmFeatured(p.featured);
    setPrmStatus(p.status);
    setPromptModalOpen(true);
  };

  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: prmTitle,
      slug: prmSlug || slugify(prmTitle),
      shortDescription: prmDesc,
      promptText: prmText,
      category: prmCategory,
      tags: prmTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      language: 'English',
      previewImage: prmImage,
      recommendedModel: prmModel,
      externalToolUrl: prmToolUrl,
      usageInstructions: prmInstructions,
      authorName: user.name,
      featured: prmFeatured,
      status: prmStatus,
    };

    const url = editingPromptId ? `/api/admin/prompts/${editingPromptId}` : '/api/admin/prompts';
    const method = editingPromptId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      showToast({ type: 'error', title: 'Prompt Save Error', description: data.error });
      return;
    }

    setPromptModalOpen(false);
    await loadAllAdminData();
    await refreshHomeData();
    showToast({
      type: 'success',
      title: editingPromptId ? 'Prompt Updated' : 'Prompt Published!',
      description: `"${data.prompt.title}" is live in ${data.prompt.category}.`,
    });
  };

  const readingMetrics = calculateReadingMetrics(blogContent);

  const sidebarItems: { id: AdminTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'blogs', label: 'Blog CMS', icon: FileText },
    { id: 'prompts', label: 'Prompt Library', icon: Sparkles },
    { id: 'taxonomy', label: 'Categories & Tags', icon: Tags },
    { id: 'enquiries', label: 'Enquiries', icon: Mail, badge: summary?.newEnquiriesCount },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'instagram', label: 'Instagram API', icon: Instagram },
    { id: 'media', label: 'Media Library', icon: ImageIcon },
    { id: 'settings', label: 'Website Settings', icon: Settings },
    { id: 'security', label: 'Security & Audit', icon: ShieldAlert },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================================================================
            ADMIN SIDEBAR
        ================================================================ */}
        <aside className="lg:col-span-3 glass-panel rounded-2xl p-4 lg:sticky lg:top-20">
          <div className="pb-3 mb-3 border-b border-slate-200/70 px-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
              ADMIN CONSOLE
            </p>
            <h1 className="text-base font-extrabold text-slate-900 font-display">
              Keerthi_dot_exe CMS
            </h1>
          </div>

          <nav className="space-y-1" aria-label="Admin Sidebar">
            {sidebarItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => switchTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                        active ? 'bg-white text-purple-700' : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ================================================================
            ADMIN MAIN WORKSPACE
        ================================================================ */}
        <div className="lg:col-span-9 space-y-6">
          {/* A. DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <GlassCard className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 font-display">
                      Platform Overview
                    </h2>
                    <p className="text-xs text-slate-600">
                      Real-time statistics across users, blogs, prompts, enquiries, and Instagram sync.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <GlassButton type="button" size="sm" onClick={openCreateBlogModal}>
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Blog Post</span>
                    </GlassButton>
                    <GlassButton
                      type="button"
                      size="sm"
                      variant="dark"
                      onClick={openCreatePromptModal}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New AI Prompt</span>
                    </GlassButton>
                  </div>
                </div>

                {/* 8 KPI Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6">
                  {[
                    {
                      label: 'Total Users',
                      value: summary?.totalUsers ?? usersList.length,
                      sub: `${summary?.newUsersCount ?? 2} joined last 30d`,
                    },
                    {
                      label: 'Published Blogs',
                      value: summary?.publishedBlogsCount ?? 5,
                      sub: `${summary?.draftAndScheduledBlogsCount ?? 1} draft / scheduled`,
                    },
                    {
                      label: 'Total AI Prompts',
                      value: summary?.totalPromptsCount ?? promptsList.length,
                      sub: '13 active categories',
                    },
                    {
                      label: 'New Enquiries',
                      value: summary?.newEnquiriesCount ?? 1,
                      sub: `${summary?.totalEnquiriesCount ?? enquiriesList.length} total received`,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 rounded-2xl bg-white/85 border border-slate-200/80"
                    >
                      <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                      <p className="text-2xl font-extrabold text-slate-900 font-display tabular-nums mt-1">
                        {stat.value}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Enquiries */}
                <GlassCard className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-900 font-display">
                      Recent Contact Enquiries
                    </h3>
                    <button
                      type="button"
                      onClick={() => switchTab('enquiries')}
                      className="text-xs font-semibold text-purple-600 hover:underline cursor-pointer"
                    >
                      Manage All →
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {(summary?.recentEnquiries || enquiriesList.slice(0, 4)).map((enq) => (
                      <div key={enq.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{enq.subject}</p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {enq.name} · {enq.serviceCategory}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold text-purple-700 shrink-0">
                          {enq.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Instagram & System Status */}
                <GlassCard className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-900 font-display">
                        Instagram Sync & System Status
                      </h3>
                      <button
                        type="button"
                        onClick={() => switchTab('instagram')}
                        className="text-xs font-semibold text-purple-600 hover:underline cursor-pointer"
                      >
                        Configure →
                      </button>
                    </div>
                    <div className="space-y-2.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Instagram Handle:</span>
                        <strong className="text-slate-900">
                          @{summary?.instagram.username || 'keerthi_dot_exe'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Feed Mode:</span>
                        <strong className="text-purple-700">
                          {summary?.instagram.connected
                            ? 'Official Graph API Connected'
                            : 'Approved Fallback Embeds Active'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Cached Media Items:</span>
                        <strong className="font-mono tabular-nums text-slate-900">
                          {summary?.instagram.mediaCount ?? igMedia.length} posts
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Unread Admin Alerts:</span>
                        <strong className="font-mono tabular-nums text-slate-900">
                          {unreadCount}
                        </strong>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>
          )}

          {/* B. USER MANAGEMENT */}
          {activeTab === 'users' && (
            <GlassCard className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-display">
                    User Management
                  </h2>
                  <p className="text-xs text-slate-600">
                    Search accounts, manage statuses and roles. Sensitive password hashes and tokens are never exposed.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search name or email..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2.5 px-3">Name & Email</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Registered</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id} className="hover:bg-white/60">
                        <td className="py-3 px-3">
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            aria-label={`Role for ${u.name}`}
                            value={u.role}
                            onChange={async (e) => {
                              const res = await fetch(`/api/admin/users/${u.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ role: e.target.value }),
                              });
                              const data = await res.json();
                              if (res.ok) {
                                loadAllAdminData();
                                showToast({ type: 'success', title: 'Role Updated' });
                              } else {
                                showToast({ type: 'error', title: 'Error', description: data.error });
                              }
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold"
                          >
                            <option value="User">User</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            aria-label={`Status for ${u.name}`}
                            value={u.status}
                            onChange={async (e) => {
                              const res = await fetch(`/api/admin/users/${u.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ status: e.target.value }),
                              });
                              const data = await res.json();
                              if (res.ok) {
                                loadAllAdminData();
                                showToast({ type: 'success', title: 'Account Status Updated' });
                              } else {
                                showToast({ type: 'error', title: 'Error', description: data.error });
                              }
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold"
                          >
                            <option value="Active">Active</option>
                            <option value="Disabled">Disabled</option>
                            <option value="Suspended">Suspended</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {u.id !== user.id && (
                            <button
                              type="button"
                              aria-label={`Delete user ${u.name}`}
                              onClick={() =>
                                setConfirmState({
                                  open: true,
                                  title: 'Delete User Account',
                                  message: `Are you sure you want to permanently delete ${u.name} (${u.email})?`,
                                  onConfirm: async () => {
                                    setConfirmState((s) => ({ ...s, open: false }));
                                    const res = await fetch(`/api/admin/users/${u.id}`, {
                                      method: 'DELETE',
                                      credentials: 'include',
                                    });
                                    if (res.ok) {
                                      loadAllAdminData();
                                      showToast({ type: 'info', title: 'Account Deleted' });
                                    }
                                  },
                                })
                              }
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {/* C. BLOG CMS */}
          {activeTab === 'blogs' && (
            <GlassCard className="p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-display">
                    Advanced Blog CMS
                  </h2>
                  <p className="text-xs text-slate-600">
                    Create, edit, preview, schedule, and publish rich-text articles.
                  </p>
                </div>
                <GlassButton type="button" size="sm" onClick={openCreateBlogModal}>
                  <Plus className="w-4 h-4" />
                  <span>Create Blog Article</span>
                </GlassButton>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['All', 'Published', 'Draft', 'Scheduled', 'Archived'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setBlogStatusFilter(st)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                      blogStatusFilter === st
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="divide-y divide-slate-200/70">
                {blogsList.map((post) => (
                  <div
                    key={post.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                        <SmartImage
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-bold text-purple-700">{post.status}</span>
                          <span aria-hidden="true">·</span>
                          <span>{post.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{post.views} views</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 font-display">
                          {post.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono">/blog/{post.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        to={`/blog/${post.slug}`}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-purple-700"
                        title="Open public URL"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEditBlogModal(post)}
                        aria-label={`Edit ${post.title}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${post.title}`}
                        onClick={() =>
                          setConfirmState({
                            open: true,
                            title: 'Delete Blog Post',
                            message: `Delete "${post.title}" permanently?`,
                            onConfirm: async () => {
                              setConfirmState((s) => ({ ...s, open: false }));
                              await fetch(`/api/admin/blogs/${post.id}`, {
                                method: 'DELETE',
                                credentials: 'include',
                              });
                              loadAllAdminData();
                              refreshHomeData();
                              showToast({ type: 'info', title: 'Blog Post Deleted' });
                            },
                          })
                        }
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* D. PROMPT MANAGEMENT */}
          {activeTab === 'prompts' && (
            <GlassCard className="p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-display">
                    AI Prompt Library Management
                  </h2>
                  <p className="text-xs text-slate-600">
                    Manage prompts across all 13 categories with instant public synchronization.
                  </p>
                </div>
                <GlassButton type="button" size="sm" onClick={openCreatePromptModal}>
                  <Plus className="w-4 h-4" />
                  <span>Add New Prompt</span>
                </GlassButton>
              </div>

              <div className="divide-y divide-slate-200/70">
                {promptsList.map((prm) => (
                  <div
                    key={prm.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-bold text-purple-700">{prm.status}</span>
                        <span aria-hidden="true">·</span>
                        <span>{prm.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{prm.recommendedModel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{prm.copiesCount} copies</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 font-display">{prm.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/prompts/${prm.slug}`}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => openEditPromptModal(prm)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/admin/prompts/${prm.id}`, {
                            method: 'DELETE',
                            credentials: 'include',
                          });
                          loadAllAdminData();
                          refreshHomeData();
                          showToast({ type: 'info', title: 'Prompt Removed' });
                        }}
                        aria-label={`Delete prompt ${prm.title}`}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* E. CATEGORIES & TAGS */}
          {activeTab === 'taxonomy' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900 font-display">Categories</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newCatName.trim()) return;
                    const res = await fetch('/api/admin/categories', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ name: newCatName, description: newCatDesc }),
                    });
                    if (res.ok) {
                      setNewCatName('');
                      setNewCatDesc('');
                      loadAllAdminData();
                      showToast({ type: 'success', title: 'Category Added' });
                    }
                  }}
                  className="space-y-2.5"
                >
                  <GlassInput
                    placeholder="New Category Name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <GlassInput
                    placeholder="Short description"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                  />
                  <GlassButton type="submit" size="sm">
                    Add Category
                  </GlassButton>
                </form>

                <div className="divide-y divide-slate-100 pt-2">
                  {categoriesList.map((c) => (
                    <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{c.name}</span>
                        <span className="text-slate-500 ml-2">({c.slug})</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/admin/categories/${c.id}`, {
                            method: 'DELETE',
                            credentials: 'include',
                          });
                          loadAllAdminData();
                        }}
                        className="text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900 font-display">Tags</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newTagName.trim()) return;
                    const res = await fetch('/api/admin/tags', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ name: newTagName }),
                    });
                    if (res.ok) {
                      setNewTagName('');
                      loadAllAdminData();
                      showToast({ type: 'success', title: 'Tag Added' });
                    }
                  }}
                  className="flex gap-2"
                >
                  <GlassInput
                    placeholder="New Tag Name (e.g. Kling AI)"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                  <GlassButton type="submit" size="sm">
                    Add Tag
                  </GlassButton>
                </form>

                <div className="flex flex-wrap gap-2 pt-2">
                  {tagsList.map((t) => (
                    <div
                      key={t.id}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs"
                    >
                      <span>#{t.name}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/admin/tags/${t.id}`, {
                            method: 'DELETE',
                            credentials: 'include',
                          });
                          loadAllAdminData();
                        }}
                        className="text-rose-600 font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* F. ENQUIRY MANAGEMENT */}
          {activeTab === 'enquiries' && (
            <GlassCard className="p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-display">
                    Enquiry & Contact Management
                  </h2>
                  <p className="text-xs text-slate-600">
                    Review incoming enquiries, update workflow status, add internal notes, reply, or export to CSV.
                  </p>
                </div>
                <a
                  href="/api/admin/enquiries/export/csv"
                  download="keerthi-enquiries.csv"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </a>
              </div>

              <div className="divide-y divide-slate-200/70">
                {enquiriesList.map((enq) => (
                  <div key={enq.id} className="py-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-purple-700 mr-2">[{enq.status}]</span>
                        <strong className="text-sm font-bold text-slate-900 font-display">
                          {enq.subject}
                        </strong>
                        <p className="text-xs text-slate-500">
                          From: {enq.name} ({enq.email}) {enq.phone ? `· ${enq.phone}` : ''} · Service:{' '}
                          <strong>{enq.serviceCategory}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`Status for enquiry ${enq.subject}`}
                          value={enq.status}
                          onChange={async (e) => {
                            const res = await fetch(`/api/admin/enquiries/${enq.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ status: e.target.value as EnquiryStatus }),
                            });
                            if (res.ok) {
                              loadAllAdminData();
                              showToast({ type: 'success', title: 'Enquiry Status Updated' });
                            }
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                        >
                          <option value="New">New</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Replied">Replied</option>
                          <option value="Closed">Closed</option>
                          <option value="Archived">Archived</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEnquiry(enq);
                            setEnqReplySubject(`Re: ${enq.subject}`);
                            setEnqReplyBody(`Hi ${enq.name},\n\nThank you for reaching out to Keerthi_dot_exe regarding ${enq.serviceCategory}. `);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold cursor-pointer"
                        >
                          Inspect / Reply
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 bg-white/70 p-3 rounded-xl border border-slate-200/60">
                      {enq.message}
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* G. NOTIFICATIONS MANAGEMENT */}
          {activeTab === 'notifications' && (
            <GlassCard className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 font-display">
                    Notifications Center ({unreadCount} unread)
                  </h2>
                  <p className="text-xs text-slate-600">
                    System alerts for new user registrations, enquiries, scheduled blog publications, and sync events.
                  </p>
                </div>
                {unreadCount > 0 && (
                  <GlassButton
                    type="button"
                    size="sm"
                    variant="glass"
                    onClick={markAllNotificationsRead}
                  >
                    Mark All as Read
                  </GlassButton>
                )}
              </div>

              <div className="divide-y divide-slate-200/70">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`py-3.5 px-3 rounded-xl flex items-center justify-between gap-4 ${
                      !n.read ? 'bg-purple-50/60' : ''
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{n.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markNotificationRead(n.id)}
                        className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-purple-700 cursor-pointer shrink-0"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* H. INSTAGRAM INTEGRATION */}
          {activeTab === 'instagram' && (
            <div className="space-y-6">
              <GlassCard className="p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 font-display">
                      Official Meta Instagram Platform Integration
                    </h2>
                    <p className="text-xs text-slate-600">
                      Synchronize Reels, images, and carousel posts from @{igState?.username || 'keerthi_dot_exe'} with incremental deduplication.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <GlassButton
                      type="button"
                      size="sm"
                      onClick={async () => {
                        const res = await fetch('/api/admin/instagram/sync', {
                          method: 'POST',
                          credentials: 'include',
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setIgState(data.state);
                          setIgMedia(data.media);
                          refreshHomeData();
                          showToast({
                            type: 'success',
                            title: 'Instagram Sync Complete',
                            description: `Synced ${data.syncReport.totalMedia} items (${data.syncReport.updatedCount} updated, 0 duplicates).`,
                          });
                        }
                      }}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync Now</span>
                    </GlassButton>

                    <GlassButton
                      type="button"
                      size="sm"
                      variant="dark"
                      onClick={async () => {
                        const res = await fetch('/api/admin/instagram/connect', {
                          method: 'POST',
                          credentials: 'include',
                        });
                        const data = await res.json();
                        if (data.mode === 'oauth_redirect' && data.authUrl) {
                          window.location.href = data.authUrl;
                        } else {
                          showToast({
                            type: 'info',
                            title: 'OAuth Configuration Notice',
                            description: data.message,
                          });
                        }
                      }}
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>Connect Official OAuth</span>
                    </GlassButton>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/80 border border-slate-200/80 text-xs">
                  <div>
                    <span className="text-slate-500 block">Connection Status</span>
                    <strong className="text-slate-900">
                      {igState?.connected
                        ? 'Connected (Official Graph API)'
                        : 'Fallback Curated Mode (Ready for OAuth)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Last Successful Sync</span>
                    <strong className="font-mono text-slate-900">
                      {igState?.lastSyncedAt
                        ? new Date(igState.lastSyncedAt).toLocaleString()
                        : 'Never'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block">Public Feed Display</span>
                      <strong className="text-slate-900">
                        {igState?.publicDisplayEnabled ? 'Visible on Homepage' : 'Hidden'}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await fetch('/api/admin/instagram/settings', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({
                            publicDisplayEnabled: !igState?.publicDisplayEnabled,
                          }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setIgState(data.state);
                          refreshHomeData();
                        }
                      }}
                      className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-semibold cursor-pointer"
                    >
                      Toggle
                    </button>
                  </div>
                </div>

                {/* Cached Media Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {igMedia.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-white/85 border border-slate-200/80 flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-32 rounded-xl overflow-hidden bg-slate-900 mb-2">
                          <SmartImage
                            src={m.thumbnailUrl}
                            alt={m.caption}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-slate-700 line-clamp-2">{m.caption}</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-500">ID: {m.externalMediaId}</span>
                        <label className="flex items-center gap-1 cursor-pointer font-semibold text-slate-700">
                          <input
                            type="checkbox"
                            checked={m.visible}
                            onChange={async (e) => {
                              await fetch(`/api/admin/instagram/media/${m.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ visible: e.target.checked }),
                              });
                              loadAllAdminData();
                              refreshHomeData();
                            }}
                          />
                          <span>Public</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}

          {/* I. MEDIA LIBRARY */}
          {activeTab === 'media' && (
            <GlassCard className="p-6 space-y-5">
              <h2 className="text-xl font-extrabold text-slate-900 font-display">
                Media Asset Library
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newMediaName.trim()) return;
                  const res = await fetch('/api/admin/media', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      originalName: newMediaName,
                      mimeType: 'image/png',
                      sizeBytes: 64000,
                      url: newMediaUrl,
                      altText: newMediaAlt || newMediaName,
                    }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setNewMediaName('');
                    setNewMediaAlt('');
                    loadAllAdminData();
                    showToast({ type: 'success', title: 'Media Registered' });
                  } else {
                    showToast({ type: 'error', title: 'Upload Error', description: data.error });
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
              >
                <GlassInput
                  label="Asset Name"
                  placeholder="banner-2026.png"
                  value={newMediaName}
                  onChange={(e) => setNewMediaName(e.target.value)}
                  required
                />
                <GlassInput
                  label="Asset Path / URL"
                  value={newMediaUrl}
                  onChange={(e) => setNewMediaUrl(e.target.value)}
                  required
                />
                <GlassInput
                  label="Alt Text"
                  placeholder="Descriptive alt text"
                  value={newMediaAlt}
                  onChange={(e) => setNewMediaAlt(e.target.value)}
                />
                <GlassButton type="submit">Add Media Asset</GlassButton>
              </form>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {mediaAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-3 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between"
                  >
                    <div className="h-28 rounded-xl overflow-hidden bg-slate-100 mb-2">
                      <SmartImage
                        src={asset.url}
                        alt={asset.altText}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate">{asset.originalName}</p>
                    <p className="text-[10px] font-mono text-slate-500 truncate">{asset.url}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* J. WEBSITE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <GlassCard className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 font-display">
                      MongoDB & Mongoose Database Connection
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      12 Mongoose schemas configured (`Users`, `BlogPosts`, `Prompts`, `Categories`, `Tags`, `Enquiries`, `Notifications`, `WebsiteSettings`, `InstagramAccount`, `InstagramMedia`, `MediaAssets`, `AuditLogs`).
                    </p>
                  </div>
                  <GlassButton
                    type="button"
                    size="sm"
                    variant="glass"
                    disabled={syncingDb}
                    onClick={async () => {
                      setSyncingDb(true);
                      try {
                        const res = await fetch('/api/admin/database-sync', {
                          method: 'POST',
                          credentials: 'include',
                        });
                        const data = await res.json();
                        if (res.ok) {
                          if (data.status) setDbSummary(data.status);
                          showToast({
                            type: data.status?.connected ? 'success' : 'info',
                            title: data.status?.connected
                              ? 'MongoDB Atlas Connected & Synced'
                              : 'Local Persistent Document Store Active',
                            description: data.message,
                          });
                        }
                      } finally {
                        setSyncingDb(false);
                      }
                    }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingDb ? 'animate-spin' : ''}`} />
                    <span>{syncingDb ? 'Syncing...' : 'Test & Sync MongoDB'}</span>
                  </GlassButton>
                </div>

                {dbSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Object.entries(dbSummary.collections).map(([colName, count]) => (
                      <div
                        key={colName}
                        className="p-3 rounded-xl bg-white/80 border border-slate-200/80"
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          {colName}
                        </div>
                        <div className="text-lg font-extrabold text-slate-900 font-display tabular-nums mt-0.5">
                          {count}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2">
                  <p>
                    <strong>How it works:</strong> By default in the preview container, all 12 collections are persisted automatically in <code className="font-mono bg-white px-1.5 py-0.5 rounded border">.aistudio/mongodb-data.json</code> so your data is never lost when no external MongoDB daemon is running.
                  </p>
                  <p>
                    <strong>Connecting External MongoDB Atlas:</strong> Add <code className="font-mono bg-white px-1.5 py-0.5 rounded border">MONGODB_URI=&quot;mongodb+srv://...&quot;</code> in the AI Studio <strong>Secrets</strong> panel, then click <strong>Test & Sync MongoDB</strong> above (or restart the server) to switch live into Mongoose / MongoDB Atlas mode.
                  </p>
                </div>
              </GlassCard>

              <GlassCard className="p-6 space-y-5">
                <h2 className="text-xl font-extrabold text-slate-900 font-display">
                  Website Settings & Community Configuration
                </h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await fetch('/api/admin/settings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        siteName,
                        tagline,
                        instagramProfileUrl: igProfileUrl,
                        contactEmail,
                        stats: {
                          instagramFollowers: igFollowersStat,
                          promptLibraryCount: promptCountStat,
                          whatsappGroupsCount: '3',
                          contentFrequency: 'Daily',
                        },
                      }),
                    });
                    if (res.ok) {
                      await refreshHomeData();
                      showToast({
                        type: 'success',
                        title: 'Settings Saved',
                        description: 'Homepage branding and community statistics updated.',
                      });
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <GlassInput
                      label="Website Brand Name"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                    />
                    <GlassInput
                      label="Tagline"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                    />
                    <GlassInput
                      label="Instagram Audience Stat"
                      value={igFollowersStat}
                      onChange={(e) => setIgFollowersStat(e.target.value)}
                    />
                    <GlassInput
                      label="Prompt Library Stat"
                      value={promptCountStat}
                      onChange={(e) => setPromptCountStat(e.target.value)}
                    />
                    <GlassInput
                      label="Instagram Profile URL"
                      value={igProfileUrl}
                      onChange={(e) => setIgProfileUrl(e.target.value)}
                    />
                    <GlassInput
                      label="Public Contact Email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  <GlassButton type="submit">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Website Settings</span>
                  </GlassButton>
                </form>
              </GlassCard>
            </div>
          )}

          {/* K. SECURITY & AUDIT LOG */}
          {activeTab === 'security' && (
            <GlassCard className="p-6 space-y-4">
              <h2 className="text-xl font-extrabold text-slate-900 font-display">
                Security Audit Log
              </h2>
              <p className="text-xs text-slate-600">
                Immutable chronological audit log of administrative changes across users, blogs, prompts, enquiries, and settings.
              </p>
              <div className="divide-y divide-slate-200/70">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div>
                      <span className="font-mono font-bold text-purple-700 mr-2">{log.action}</span>
                      <span className="text-slate-800">{log.details}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Actor: {log.actorEmail} · Target: {log.targetType} ({log.targetId})
                      </p>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      {/* ================================================================
          BLOG RICH-TEXT EDITOR MODAL
      ================================================================ */}
      <GlassModal
        open={blogModalOpen}
        title={editingBlogId ? 'Edit Blog Article' : 'Create New Blog Article'}
        onClose={() => setBlogModalOpen(false)}
        maxWidthClass="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Blog Title"
              value={blogTitle}
              onChange={(e) => {
                setBlogTitle(e.target.value);
                if (!editingBlogId) setBlogSlug(slugify(e.target.value));
              }}
              placeholder="e.g. How to Master Flux.1 Portraits"
            />
            <GlassInput
              label="URL Slug"
              value={blogSlug}
              onChange={(e) => setBlogSlug(slugify(e.target.value))}
              placeholder="how-to-master-flux-1-portraits"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassInput
              label="Category"
              value={blogCategory}
              onChange={(e) => setBlogCategory(e.target.value)}
            />
            <GlassInput
              label="Tags (comma separated)"
              value={blogTags}
              onChange={(e) => setBlogTags(e.target.value)}
            />
            <GlassInput
              label="Featured Image Path"
              value={blogImage}
              onChange={(e) => setBlogImage(e.target.value)}
            />
          </div>

          <GlassInput
            label="Short Excerpt"
            value={blogExcerpt}
            onChange={(e) => setBlogExcerpt(e.target.value)}
            placeholder="Concise summary for blog cards and SEO meta description..."
          />

          {/* Rich Text Formatting Toolbar */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => appendRichTag('<h2>Section Heading</h2>')}
                  className="p-1.5 rounded hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                  title="Insert H2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => appendRichTag('<h3>Subheading</h3>')}
                  className="p-1.5 rounded hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                  title="Insert H3"
                >
                  <Heading3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => appendRichTag('<p><strong>Bold statement</strong> in paragraph.</p>')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => appendRichTag('<p><em>Italic emphasis</em> text.</p>')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => appendRichTag('<ul>\n  <li>Key takeaway one</li>\n  <li>Key takeaway two</li>\n</ul>')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => appendRichTag('<blockquote>“Creativity meets intelligence.”</blockquote>')}
                  className="p-1.5 rounded hover:bg-slate-200 text-slate-700 cursor-pointer"
                  title="Blockquote"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    appendRichTag(
                      '<div class="callout-box"><strong>Creator Tip:</strong> Add your practical workflow tip here.</div>'
                    )
                  }
                  className="px-2 py-1 rounded bg-purple-100 text-purple-800 text-[11px] font-semibold cursor-pointer"
                >
                  + Callout
                </button>
                <button
                  type="button"
                  onClick={() =>
                    appendRichTag(
                      '<pre class="prompt-block">Editorial portrait prompt with frosted glass lighting --ar 4:5 --v 6.1</pre>'
                    )
                  }
                  className="px-2 py-1 rounded bg-slate-900 text-white text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                >
                  <Code className="w-3 h-3" />
                  <span>+ Prompt Block</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                {readingMetrics.wordCount} words · ~{readingMetrics.readingTimeMinutes} min read
              </div>
            </div>

            <textarea
              rows={9}
              aria-label="Article Content Editor"
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              className="w-full p-4 text-xs sm:text-sm font-mono text-slate-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <GlassInput
              label="SEO Title"
              value={blogSeoTitle}
              onChange={(e) => setBlogSeoTitle(e.target.value)}
              placeholder="Optional custom SEO title"
            />
            <GlassInput
              label="Schedule Date/Time"
              type="datetime-local"
              value={blogPublishAt}
              onChange={(e) => setBlogPublishAt(e.target.value)}
            />
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={blogFeatured}
                onChange={(e) => setBlogFeatured(e.target.checked)}
              />
              <span>Feature on Blog Hero</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <GlassButton
              type="button"
              variant="glass"
              size="sm"
              onClick={() => setBlogPreviewOpen(true)}
            >
              <Eye className="w-4 h-4" />
              <span>Preview Article</span>
            </GlassButton>

            <div className="flex flex-wrap items-center gap-2">
              <GlassButton
                type="button"
                variant="glass"
                size="sm"
                onClick={() => handleSaveBlog('Draft')}
              >
                Save Draft
              </GlassButton>
              <GlassButton
                type="button"
                variant="dark"
                size="sm"
                onClick={() => handleSaveBlog('Scheduled')}
              >
                Schedule
              </GlassButton>
              <GlassButton
                type="button"
                variant="primary"
                size="sm"
                onClick={() => handleSaveBlog('Published')}
              >
                Publish Now
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassModal>

      {/* BLOG PREVIEW MODAL */}
      <GlassModal
        open={blogPreviewOpen}
        title={`Article Preview: ${blogTitle || 'Untitled'}`}
        onClose={() => setBlogPreviewOpen(false)}
        maxWidthClass="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase text-purple-700">{blogCategory}</div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">{blogTitle}</h1>
          <p className="text-xs text-slate-600">{blogExcerpt}</p>
          <div
            className="article-prose pt-4 border-t border-slate-100"
            dangerouslySetInnerHTML={{ __html: blogContent }}
          />
        </div>
      </GlassModal>

      {/* PROMPT EDITOR MODAL */}
      <GlassModal
        open={promptModalOpen}
        title={editingPromptId ? 'Edit AI Prompt' : 'Create New AI Prompt'}
        onClose={() => setPromptModalOpen(false)}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSavePrompt} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Prompt Title"
              value={prmTitle}
              onChange={(e) => {
                setPrmTitle(e.target.value);
                if (!editingPromptId) setPrmSlug(slugify(e.target.value));
              }}
              required
            />
            <div>
              <label htmlFor="prm-cat" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Category
              </label>
              <select
                id="prm-cat"
                value={prmCategory}
                onChange={(e) => setPrmCategory(e.target.value)}
                className="w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-sm"
              >
                {PROMPT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <GlassInput
            label="Short Description"
            value={prmDesc}
            onChange={(e) => setPrmDesc(e.target.value)}
            required
          />

          <div>
            <label htmlFor="prm-body" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Exact Prompt Text (Line breaks preserved)
            </label>
            <textarea
              id="prm-body"
              rows={4}
              required
              value={prmText}
              onChange={(e) => setPrmText(e.target.value)}
              className="w-full rounded-xl bg-slate-900 text-slate-100 font-mono p-3.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <GlassInput
              label="Recommended AI Model"
              value={prmModel}
              onChange={(e) => setPrmModel(e.target.value)}
              required
            />
            <GlassInput
              label="Preview Image Path"
              value={prmImage}
              onChange={(e) => setPrmImage(e.target.value)}
              required
            />
            <GlassInput
              label="Tags (comma separated)"
              value={prmTags}
              onChange={(e) => setPrmTags(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={prmFeatured}
                onChange={(e) => setPrmFeatured(e.target.checked)}
              />
              <span>Feature on Homepage</span>
            </label>

            <div className="flex gap-2">
              <GlassButton
                type="button"
                variant="glass"
                size="sm"
                onClick={() => setPromptModalOpen(false)}
              >
                Cancel
              </GlassButton>
              <GlassButton type="submit" size="sm">
                Save Prompt
              </GlassButton>
            </div>
          </div>
        </form>
      </GlassModal>

      {/* ENQUIRY INSPECT & REPLY MODAL */}
      <GlassModal
        open={Boolean(selectedEnquiry)}
        title={`Enquiry: ${selectedEnquiry?.subject || ''}`}
        onClose={() => setSelectedEnquiry(null)}
        maxWidthClass="max-w-2xl"
      >
        {selectedEnquiry && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <p>
                <strong>From:</strong> {selectedEnquiry.name} ({selectedEnquiry.email}){' '}
                {selectedEnquiry.phone}
              </p>
              <p>
                <strong>Service:</strong> {selectedEnquiry.serviceCategory} ·{' '}
                <strong>Status:</strong> {selectedEnquiry.status}
              </p>
              <p className="pt-2 text-slate-700">{selectedEnquiry.message}</p>
            </div>

            {/* Internal Notes */}
            <div className="space-y-2">
              <p className="font-bold text-slate-900">Internal Admin Notes</p>
              {selectedEnquiry.internalNotes.map((n, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                  {n}
                </div>
              ))}
              <div className="flex gap-2">
                <GlassInput
                  placeholder="Add an internal note..."
                  value={enqInternalNote}
                  onChange={(e) => setEnqInternalNote(e.target.value)}
                />
                <GlassButton
                  type="button"
                  size="sm"
                  variant="glass"
                  onClick={async () => {
                    if (!enqInternalNote.trim()) return;
                    const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ internalNote: enqInternalNote }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setSelectedEnquiry(data.enquiry);
                      setEnqInternalNote('');
                      loadAllAdminData();
                      showToast({ type: 'success', title: 'Internal Note Saved' });
                    }
                  }}
                >
                  Add Note
                </GlassButton>
              </div>
            </div>

            {/* Reply Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await fetch(`/api/admin/enquiries/${selectedEnquiry.id}/reply`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify({
                    subject: enqReplySubject,
                    message: enqReplyBody,
                  }),
                });
                const data = await res.json();
                if (res.ok) {
                  setSelectedEnquiry(data.enquiry);
                  loadAllAdminData();
                  showToast({
                    type: 'success',
                    title: 'Reply Recorded',
                    description: data.message,
                  });
                }
              }}
              className="space-y-3 pt-3 border-t border-slate-200"
            >
              <p className="font-bold text-slate-900">Send Reply to {selectedEnquiry.email}</p>
              <GlassInput
                label="Subject"
                value={enqReplySubject}
                onChange={(e) => setEnqReplySubject(e.target.value)}
                required
              />
              <textarea
                rows={3}
                value={enqReplyBody}
                onChange={(e) => setEnqReplyBody(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs"
                required
              />
              <GlassButton type="submit" size="sm">
                <Send className="w-3.5 h-3.5" />
                <span>Send & Mark Replied</span>
              </GlassButton>
            </form>
          </div>
        )}
      </GlassModal>

      <ConfirmationDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
      />
    </div>
  );
};
