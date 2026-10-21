import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Instagram,
  MessageCircle,
  Zap,
  Box,
  Camera,
  BookOpen,
  Users,
  Target,
  Image as ImageIcon,
  Video,
  Briefcase,
  Sparkles,
  Grid,
  ExternalLink,
  CheckCircle2,
  Palette,
  Share2,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  GlassCard,
  GlassButton,
  SectionHeading,
  PromptCard,
  BlogCard,
  SmartImage,
  LoadingSkeleton,
} from '../components/ui/GlassComponents';
import type { InstagramMediaItem } from '../shared/types';

export const HomePage: React.FC = () => {
  const { homeData, homeLoading, showToast, refreshNotifications } = useApp();
  const navigate = useNavigate();

  // Instagram Load More state
  const [igPage, setIgPage] = useState(1);
  const [igItems, setIgItems] = useState<InstagramMediaItem[]>([]);
  const [igHasMore, setIgHasMore] = useState(false);
  const [igLoadingMore, setIgLoadingMore] = useState(false);

  // Enquiry Form state
  const [enqName, setEnqName] = useState('');
  const [enqEmail, setEnqEmail] = useState('');
  const [enqPhone, setEnqPhone] = useState('');
  const [enqService, setEnqService] = useState('Custom AI Designs');
  const [enqSubject, setEnqSubject] = useState('');
  const [enqMessage, setEnqMessage] = useState('');
  const [enqConsent, setEnqConsent] = useState(true);
  const [enqSubmitting, setEnqSubmitting] = useState(false);
  const [enqError, setEnqError] = useState<string | null>(null);
  const [enqSuccess, setEnqSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (homeData?.instagramMedia) {
      setIgItems(homeData.instagramMedia.slice(0, 4));
      setIgHasMore(homeData.instagramMedia.length > 4);
    }
  }, [homeData]);

  const handleLoadMoreIg = async () => {
    try {
      setIgLoadingMore(true);
      const nextPage = igPage + 1;
      const res = await fetch(`/api/public/instagram?page=${nextPage}&limit=4`);
      if (res.ok) {
        const data = await res.json();
        setIgItems(data.items || []);
        setIgHasMore(Boolean(data.hasMore));
        setIgPage(nextPage);
      }
    } finally {
      setIgLoadingMore(false);
    }
  };

  const handleSelectServiceForEnquiry = (serviceTitle: string) => {
    setEnqService(serviceTitle);
    setEnqSubject(`Enquiry regarding ${serviceTitle}`);
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnqError(null);
    setEnqSuccess(null);

    if (enqName.trim().length < 2) {
      setEnqError('Please enter your full name.');
      return;
    }
    if (!enqEmail.includes('@')) {
      setEnqError('Please enter a valid email address.');
      return;
    }
    if (enqSubject.trim().length < 3) {
      setEnqError('Please enter a subject for your enquiry.');
      return;
    }
    if (enqMessage.trim().length < 10) {
      setEnqError('Please write at least 10 characters in your message.');
      return;
    }
    if (!enqConsent) {
      setEnqError('Please accept the privacy consent checkbox before sending.');
      return;
    }

    try {
      setEnqSubmitting(true);
      const res = await fetch('/api/public/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: enqName,
          email: enqEmail,
          phone: enqPhone,
          serviceCategory: enqService,
          subject: enqSubject,
          message: enqMessage,
          consentAccepted: enqConsent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEnqError(data.error || 'Failed to submit enquiry.');
        return;
      }

      setEnqSuccess(data.message);
      setEnqName('');
      setEnqEmail('');
      setEnqPhone('');
      setEnqSubject('');
      setEnqMessage('');
      refreshNotifications();
      showToast({
        type: 'success',
        title: 'Enquiry Sent!',
        description: 'We have received your message and notified the Keerthi_dot_exe team.',
      });
    } catch {
      setEnqError('Network error while submitting your enquiry. Please try again.');
    } finally {
      setEnqSubmitting(false);
    }
  };

  const settings = homeData?.settings;

  const promptQuickTiles = [
    {
      title: 'Image Prompts',
      subtitle: 'Realistic, Creative, Art & Portraits',
      category: 'Image Generation',
      color: 'from-purple-500 to-indigo-500',
      icon: ImageIcon,
    },
    {
      title: 'Video Prompts',
      subtitle: 'Cinematic, Reels, Storytelling & Ads',
      category: 'Video Generation',
      color: 'from-amber-500 to-orange-500',
      icon: Video,
    },
    {
      title: 'Business Prompts',
      subtitle: 'Posters, Ads, Branding & Marketing',
      category: 'Business Prompts',
      color: 'from-violet-500 to-purple-600',
      icon: Briefcase,
    },
    {
      title: 'WhatsApp Status',
      subtitle: 'Quotes, DP, Aesthetic & Festival Prompts',
      category: 'WhatsApp Status',
      color: 'from-emerald-500 to-teal-500',
      icon: MessageCircle,
    },
    {
      title: 'Logo & Branding',
      subtitle: 'Logos, Banners, Cards & Identity',
      category: 'Logo and Branding',
      color: 'from-rose-500 to-orange-500',
      icon: Palette,
    },
    {
      title: 'AI Tools & Tutorials',
      subtitle: 'Guides, Tips, Step-by-step',
      category: 'AI Tools and Tutorials',
      color: 'from-blue-500 to-cyan-500',
      icon: Zap,
    },
    {
      title: 'More Categories',
      subtitle: 'Trending & Latest Prompts',
      category: 'All',
      color: 'from-orange-500 to-red-500',
      icon: Grid,
    },
  ];

  return (
    <div className="home-page relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-16">
        {/* ================================================================
            1. HERO SECTION
        ================================================================ */}
        <section id="home" className="home-hero relative pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Headline & CTAs */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-purple-100/80 border border-purple-200/60 text-[11px] font-bold uppercase tracking-wider text-purple-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI CREATIVE COMMUNITY</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-slate-900 font-display leading-[1.08] tracking-tight">
                Create.
                <br />
                Design.
                <br />
                Prompt.
                <br />
                Grow{' '}
                <span className="home-title-gradient italic bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#38BDF8] bg-clip-text text-transparent">
                  with AI.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                Discover creative AI prompts, business templates, visual inspiration, and practical AI tutorials — all in one creative community.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <Link
                  to="/prompts"
                  className="hero-primary-action inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#6366F1] text-white text-sm font-semibold shadow-lg shadow-purple-500/25 hover:brightness-105 transition-all whitespace-nowrap shrink-0"
                >
                  <span>Explore AI Prompts</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#whatsapp-communities"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/90 hover:bg-white border border-slate-200/90 text-slate-800 text-sm font-semibold shadow-sm transition-all whitespace-nowrap shrink-0"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <MessageCircle className="w-3 h-3" />
                  </span>
                  <span>Join Our Community</span>
                </a>
              </div>
            </div>

            {/* Right Column: Frosted Glass Portrait Frame & Floating Prompt Cards */}
            <div className="hero-visual-stage lg:col-span-6 relative flex items-center justify-center min-h-[380px] sm:min-h-[430px]">
              {/* Decorative CSS Pearl Orbs */}
              <div aria-hidden="true" className="pearl-orb hero-pearl hero-pearl--one w-14 h-14 rounded-full absolute top-2 left-10 -z-10" />
              <div aria-hidden="true" className="pearl-orb hero-pearl hero-pearl--two w-20 h-20 rounded-full absolute bottom-4 right-8 -z-10" />
              <div aria-hidden="true" className="hero-orbit-icon hero-orbit-icon--one"><ImageIcon className="w-5 h-5" /></div>
              <div aria-hidden="true" className="hero-orbit-icon hero-orbit-icon--two"><Zap className="w-5 h-5" /></div>
              <div aria-hidden="true" className="hero-orbit-icon hero-orbit-icon--three"><Palette className="w-5 h-5" /></div>

              {/* Center Frosted Portrait Frame */}
              <div className="hero-portrait-frame relative w-64 sm:w-72 h-80 sm:h-88 rounded-[2rem] p-2.5 glass-panel shadow-2xl rotate-2">
                <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative bg-gradient-to-b from-purple-50 to-slate-100">
                  <SmartImage
                    src={settings?.creatorProfileImage || '/assets/media/keerthi-hero.png'}
                    alt="Keerthi — AI Creative Community Founder"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-3 font-signature text-2xl text-slate-800/90 drop-shadow-xs select-none">
                    Keerthi
                  </div>
                </div>
              </div>

              {/* Floating Card 1: AI Image Prompts */}
              <Link
                to="/prompts?category=Image+Generation"
                className="hero-float-card hero-float-card--image absolute left-0 sm:left-4 top-12 glass-panel rounded-2xl p-3.5 w-40 sm:w-44 -rotate-6 hover:rotate-0 transition-transform shadow-lg group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-2xs">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 font-display leading-tight">
                  AI Image
                  <br />
                  Prompts
                </p>
              </Link>

              {/* Floating Card 2: AI Video Prompts */}
              <Link
                to="/prompts?category=Video+Generation"
                className="hero-float-card hero-float-card--video absolute left-2 sm:left-8 bottom-4 glass-panel rounded-2xl p-3.5 w-40 sm:w-44 rotate-3 hover:rotate-0 transition-transform shadow-lg group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-sm">
                    <Video className="w-4 h-4" />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-2xs">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 font-display leading-tight">
                  AI Video
                  <br />
                  Prompts
                </p>
              </Link>

              {/* Floating Card 3: Turn Imagination into Reality */}
              <Link
                to="/prompts"
                className="hero-float-card hero-float-card--idea hidden sm:flex absolute right-0 top-4 glass-panel rounded-2xl p-4 w-44 items-start justify-between gap-2 hover:-translate-y-0.5 transition-transform"
              >
                <p className="text-xs font-semibold text-slate-800 leading-snug font-display">
                  Turn
                  <br />
                  Imagination
                  <br />
                  into Reality.
                </p>
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-purple-600 shrink-0 shadow-2xs">
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>

              {/* Floating Card 4: Business Templates */}
              <Link
                to="/prompts?category=Business+Prompts"
                className="hero-float-card hero-float-card--business absolute right-0 sm:right-2 bottom-10 glass-panel rounded-2xl p-3.5 w-40 sm:w-44 -rotate-3 hover:rotate-0 transition-transform shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white flex items-center justify-center shadow-sm">
                    <Briefcase className="w-4 h-4" />
                  </span>
                  <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-purple-600 shadow-2xs">
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 font-display leading-tight">
                  Business
                  <br />
                  Templates
                </p>
              </Link>
            </div>
          </div>

          {/* Clear, image-led prompt choices for phones; the desktop floating cards stay in the portrait stage. */}
          <div className="hero-mobile-prompt-grid" aria-label="Explore prompt collections">
            <Link to="/prompts?category=Image+Generation" className="hero-mobile-prompt-card hero-mobile-prompt-card--image">
              <div className="hero-mobile-prompt-visual">
                <SmartImage
                  src={(homeData?.featuredPrompts || []).find((prompt) => /image|portrait|art|photo/i.test(`${prompt.category} ${prompt.title}`))?.previewImage || '/assets/media/keerthi-about.png'}
                  alt="AI image prompt preview"
                  className="hero-mobile-prompt-image"
                />
                <span className="hero-mobile-prompt-badge"><ImageIcon className="w-3.5 h-3.5" /> IMAGE</span>
                <span className="hero-mobile-prompt-arrow"><ArrowRight className="w-4 h-4" /></span>
              </div>
              <div className="hero-mobile-prompt-copy">
                <span className="hero-mobile-prompt-kicker">Create a still</span>
                <span className="hero-mobile-prompt-title">AI Image Prompts</span>
              </div>
            </Link>
            <Link to="/prompts?category=Video+Generation" className="hero-mobile-prompt-card hero-mobile-prompt-card--video">
              <div className="hero-mobile-prompt-visual">
                <SmartImage
                  src={settings?.featuredCreations?.find((creation) => creation.mediaType === 'Video')?.previewUrl || '/assets/media/blog-video-tools.png'}
                  alt="AI video prompt preview"
                  className="hero-mobile-prompt-image"
                />
                <span className="hero-mobile-prompt-badge"><Video className="w-3.5 h-3.5" /> VIDEO</span>
                <span className="hero-mobile-prompt-arrow"><ArrowRight className="w-4 h-4" /></span>
              </div>
              <div className="hero-mobile-prompt-copy">
                <span className="hero-mobile-prompt-kicker">Bring ideas to life</span>
                <span className="hero-mobile-prompt-title">AI Video Prompts</span>
              </div>
            </Link>
          </div>

          {/* Community Statistics Strip */}
          <div className="community-stats mt-8 glass-panel rounded-2xl p-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/60">
            <div className="community-stat flex items-center gap-3.5 pt-2 sm:pt-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 font-display tabular-nums">
                  {settings?.stats.instagramFollowers || '41K+'}
                </p>
                <p className="text-xs text-slate-500">Instagram Family</p>
              </div>
            </div>

            <div className="community-stat flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 font-display tabular-nums">
                  {settings?.stats.promptLibraryCount || '1000+'}
                </p>
                <p className="text-xs text-slate-500">AI Prompts</p>
                <p className="community-stat-detail text-[10px] text-slate-400">{homeData?.counts.publishedPromptsCount || 13} featured live</p>
              </div>
            </div>

            <div className="community-stat flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 font-display tabular-nums">
                  {settings?.stats.whatsappGroupsCount || '3'}
                </p>
                <p className="text-xs text-slate-500">WhatsApp Groups</p>
              </div>
            </div>

            <div className="community-stat flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 font-display">
                  {settings?.stats.contentFrequency || 'Daily'}
                </p>
                <p className="text-xs text-slate-500">New Content</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            2. ABOUT US SECTION
        ================================================================ */}
        <section id="about" className="scroll-mt-20">
          <GlassCard className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Story */}
              <div className="lg:col-span-4 space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <span>ABOUT US</span>
                  <ArrowRight className="w-3 h-3 text-purple-600" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display leading-tight">
                  {settings?.aboutHeading || 'Creativity Meets Intelligence.'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {settings?.aboutDescription ||
                    'Keerthi_dot_exe explores the possibilities of AI through visual storytelling, practical prompts, creative templates, and community-driven inspiration.'}
                </p>
                <div className="pt-1">
                  <a
                    href="#services"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    <span>Know Our Story</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Center Creator Image Card */}
              <div className="lg:col-span-3 flex justify-center">
                <div className="relative w-56 h-60 rounded-3xl p-2 glass-panel shadow-xl">
                  <div className="w-full h-full rounded-2xl overflow-hidden">
                    <SmartImage
                      src={settings?.creatorAboutImage || '/assets/media/keerthi-about.png'}
                      alt="Keerthi Creator Portrait"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-3 -left-3 w-24 h-24 rounded-full glass-panel flex flex-col items-center justify-center text-center p-2 shadow-lg">
                    <span className="text-sm font-extrabold text-slate-900 font-display tabular-nums">
                      {settings?.stats.instagramFollowers || '41K+'}
                    </span>
                    <span className="text-[10px] text-slate-600 leading-tight">
                      Instagram Community
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Pillars */}
              <div className="lg:col-span-2 space-y-3.5">
                {[
                  { icon: Camera, title: 'AI Creative Content', sub: 'Images, Videos, Templates' },
                  { icon: BookOpen, title: 'Learning & Tutorials', sub: 'Tips, guides and workflows' },
                  { icon: Users, title: 'Community Driven', sub: 'Sharing ideas and growth' },
                  { icon: Target, title: 'Practical & Business Focus', sub: 'Real use templates and prompts' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 font-display">{item.title}</h3>
                      <p className="text-[11px] text-slate-500">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Creator Quote Glass Card */}
              <div className="lg:col-span-3">
                <div className="glass-panel rounded-2xl p-5 relative overflow-hidden">
                  <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                    “{settings?.creatorQuote || 'Exploring AI tools, creating beautiful content, and growing together.'}”
                  </p>
                  <div className="mt-4 font-signature text-2xl text-slate-800">
                    {settings?.creatorName || 'Keerthi'}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* ================================================================
            3. OUR SERVICES SECTION
        ================================================================ */}
        <section id="services" className="scroll-mt-20">
          <SectionHeading
            title="Our Services"
            subtitle="Creative solutions for individuals and businesses using AI."
            actionLabel="Enquire Now"
            onActionClick={() => handleSelectServiceForEnquiry('Custom AI Designs')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {(settings?.services || []).map((srv, idx) => {
              const iconColors = [
                'from-purple-500 to-indigo-600 shadow-purple-500/25',
                'from-blue-500 to-indigo-500 shadow-blue-500/25',
                'from-orange-500 to-rose-500 shadow-orange-500/25',
                'from-violet-500 to-purple-600 shadow-violet-500/25',
                'from-sky-500 to-blue-600 shadow-sky-500/25',
              ];
              return (
                <GlassCard
                  key={srv.id || idx}
                  className="p-5 flex flex-col justify-between text-center hover:-translate-y-0.5 transition-all"
                >
                  <div>
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                        iconColors[idx % iconColors.length]
                      } text-white flex items-center justify-center mx-auto mb-3.5 shadow-md`}
                    >
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 font-display">{srv.title}</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{srv.description}</p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSelectServiceForEnquiry(srv.title)}
                      aria-label={`Request ${srv.title}`}
                      className="w-7 h-7 rounded-full bg-white hover:bg-purple-600 text-purple-600 hover:text-white border border-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* ================================================================
            4. AI PROMPT LIBRARY HIGHLIGHTS
        ================================================================ */}
        <section id="prompts-preview" className="scroll-mt-20">
          <SectionHeading
            title="AI Prompt Library"
            subtitle="Explore 1000+ AI prompts for images, videos, business, status and more."
            actionLabel="Browse All Prompts"
            actionTo="/prompts"
          />

          {/* 7 Category Tiles matching reference design */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5 mb-8">
            {promptQuickTiles.map((tile) => (
              <button
                key={tile.title}
                type="button"
                onClick={() =>
                  navigate(
                    tile.category === 'All'
                      ? '/prompts'
                      : `/prompts?category=${encodeURIComponent(tile.category)}`
                  )
                }
                className="glass-panel rounded-2xl p-4 text-center hover:-translate-y-0.5 transition-all cursor-pointer group"
              >
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${tile.color} text-white flex items-center justify-center mx-auto mb-3 shadow-md group-hover:scale-105 transition-transform`}
                >
                  <tile.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-900 font-display">{tile.title}</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">{tile.subtitle}</p>
              </button>
            ))}
          </div>

          {/* Featured Copyable Prompts */}
          {homeLoading ? (
            <LoadingSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(homeData?.featuredPrompts || []).slice(0, 3).map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          )}
        </section>

        {/* ================================================================
            5. FEATURED CREATIONS SHOWCASE
        ================================================================ */}
        <section id="creations" className="scroll-mt-20">
          <SectionHeading
            title="Featured Creations"
            subtitle="Selected AI portraits, commercial product posters, and video reels crafted with our community prompts."
            actionLabel="Try These Prompts"
            actionTo="/prompts"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(settings?.featuredCreations || []).map((creation) => (
              <GlassCard key={creation.id} className="creation-showcase-card p-3 flex flex-col justify-between">
                <div>
                  <div className="relative h-40 rounded-xl overflow-hidden bg-slate-900 mb-3">
                    <SmartImage
                      src={creation.previewUrl}
                      alt={creation.title}
                      className="w-full h-full object-cover"
                    />
                    <img
                      src={creation.mediaType.toLowerCase().includes('video') ? '/assets/media/glass-orbit-loop.gif' : '/assets/media/glass-sparkle-loop.gif'}
                      alt=""
                      aria-hidden="true"
                      className="card-loop-gif card-loop-gif--sparkle"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="font-semibold text-purple-700">{creation.mediaType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{creation.toolUsed}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 font-display">
                    {creation.title}
                  </h3>
                </div>
                {creation.promptSlug && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                    <Link
                      to={`/prompts/${creation.promptSlug}`}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-800 inline-flex items-center gap-1"
                    >
                      <span>View Prompt Recipe</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ================================================================
            6. WHATSAPP COMMUNITIES SECTION
        ================================================================ */}
        <section id="whatsapp-communities" className="scroll-mt-20">
          <SectionHeading
            title="WhatsApp Creative Communities"
            subtitle="Join our three specialized WhatsApp groups for daily prompt drops, business templates, and AI workflows."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(settings?.whatsappGroups || []).map((group, idx) => {
              const hasLink = Boolean(group.inviteUrl && group.inviteUrl.trim().startsWith('http'));
              return (
                <GlassCard key={group.id || idx} className="p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-mono text-slate-500 tabular-nums">
                        {group.membersLabel}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 font-display">{group.name}</h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {group.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200/60">
                    {hasLink ? (
                      <a
                        href={group.inviteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{group.ctaLabel}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Invite Link Currently Full / Unavailable</span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* ================================================================
            7. INSTAGRAM FEED SECTION
        ================================================================ */}
        <section id="instagram" className="scroll-mt-20">
          <SectionHeading
            title={`Instagram Feed (@${settings?.instagramUsername || 'keerthi_dot_exe'})`}
            subtitle="Latest Reels, visual experiments, and carousel tutorials from our 41K+ Instagram community."
            actionLabel="Follow on Instagram"
            onActionClick={() =>
              window.open(
                settings?.instagramProfileUrl || 'https://www.instagram.com/keerthi_dot_exe/',
                '_blank',
                'noopener,noreferrer'
              )
            }
          />

          {igItems.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <Instagram className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900 font-display">
                Connect with @{settings?.instagramUsername || 'keerthi_dot_exe'} on Instagram
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Public media feed display is currently paused or awaiting sync in Admin settings.
              </p>
            </GlassCard>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {igItems.map((item) => (
                  <GlassCard key={item.id} className="p-3 flex flex-col justify-between">
                    <div>
                      <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900 mb-3">
                        <SmartImage
                          src={item.thumbnailUrl || item.mediaUrl}
                          alt={item.caption}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-mono uppercase">
                          {item.mediaType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                        {item.caption}
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono tabular-nums">
                        {new Date(item.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <a
                        href={item.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-purple-600 hover:text-purple-800 inline-flex items-center gap-1"
                      >
                        <span>View Post</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </GlassCard>
                ))}
              </div>

              {igHasMore && (
                <div className="mt-6 text-center">
                  <GlassButton
                    type="button"
                    variant="glass"
                    onClick={handleLoadMoreIg}
                    disabled={igLoadingMore}
                  >
                    {igLoadingMore ? 'Loading Older Posts...' : 'Load More Instagram Posts'}
                  </GlassButton>
                </div>
              )}
            </>
          )}
        </section>

        {/* ================================================================
            8. LATEST FROM BLOG SECTION
        ================================================================ */}
        <section id="blog-preview" className="scroll-mt-20">
          <SectionHeading
            title="Latest from Blog"
            subtitle="Stay updated with the latest AI tools, tips, tutorials and creative ideas."
            actionLabel="View All Blogs"
            actionTo="/blog"
          />

          {homeLoading ? (
            <LoadingSkeleton count={5} />
          ) : (
            <div className="blog-preview-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {(homeData?.latestBlogs || []).slice(0, 5).map((post) => (
                <BlogCard key={post.id} post={post} compact />
              ))}
            </div>
          )}
        </section>

        {/* ================================================================
            9. CONTACT US / ENQUIRY SECTION
        ================================================================ */}
        <section id="contact" className="scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Info Column */}
            <div className="lg:col-span-4 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  <span>CONTACT US</span>
                  <ArrowRight className="w-3 h-3 text-purple-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 font-display leading-tight">
                  Have Something
                  <br />
                  In Mind?
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Let’s explore what you can create with AI. Feel free to reach out for collaboration, custom branding prompts, workshops, or questions.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={settings?.instagramProfileUrl || 'https://www.instagram.com/keerthi_dot_exe/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-panel rounded-2xl p-3.5 flex items-center gap-3 hover:bg-white transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                    <Instagram className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      @{settings?.instagramUsername || 'keerthi_dot_exe'}
                    </p>
                    <p className="text-[11px] text-slate-500">Follow for updates</p>
                  </div>
                </a>

                <a
                  href="#whatsapp-communities"
                  className="glass-panel rounded-2xl p-3.5 flex items-center gap-3 hover:bg-white transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">Chat with us</p>
                    <p className="text-[11px] text-slate-500">For quick support</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Center Contact Form */}
            <div className="lg:col-span-5">
              <GlassCard className="p-6">
                <form onSubmit={handleEnquirySubmit} className="space-y-3.5" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="enq-name" className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Name
                      </label>
                      <input
                        id="enq-name"
                        type="text"
                        required
                        value={enqName}
                        onChange={(e) => setEnqName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full rounded-xl bg-white/90 border border-slate-200/90 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="enq-email" className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Email
                      </label>
                      <input
                        id="enq-email"
                        type="email"
                        required
                        value={enqEmail}
                        onChange={(e) => setEnqEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full rounded-xl bg-white/90 border border-slate-200/90 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="enq-service" className="block text-xs font-semibold text-slate-700 mb-1">
                        Service Category
                      </label>
                      <select
                        id="enq-service"
                        value={enqService}
                        onChange={(e) => setEnqService(e.target.value)}
                        className="w-full rounded-xl bg-white/90 border border-slate-200/90 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                      >
                        <option value="Custom AI Designs">Custom AI Designs</option>
                        <option value="Prompt Consultation">Prompt Consultation</option>
                        <option value="Business Branding">Business Branding</option>
                        <option value="AI Training & Workshops">AI Training & Workshops</option>
                        <option value="Social Media Content">Social Media Content</option>
                        <option value="General Collaboration">General Collaboration</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="enq-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone (Optional)
                      </label>
                      <input
                        id="enq-phone"
                        type="tel"
                        value={enqPhone}
                        onChange={(e) => setEnqPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full rounded-xl bg-white/90 border border-slate-200/90 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="enq-subject" className="block text-xs font-semibold text-slate-700 mb-1">
                      Subject
                    </label>
                    <input
                      id="enq-subject"
                      type="text"
                      required
                      value={enqSubject}
                      onChange={(e) => setEnqSubject(e.target.value)}
                      placeholder="Select or type a subject..."
                      className="w-full rounded-xl bg-white/90 border border-slate-200/90 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="enq-message" className="block text-xs font-semibold text-slate-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="enq-message"
                      rows={3}
                      required
                      value={enqMessage}
                      onChange={(e) => setEnqMessage(e.target.value)}
                      placeholder="Tell us about your idea..."
                      className="w-full rounded-xl bg-white/90 border border-slate-200/90 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <label className="flex items-start gap-2 text-[11px] text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enqConsent}
                      onChange={(e) => setEnqConsent(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>
                      I consent to Keerthi_dot_exe storing my enquiry details in accordance with the{' '}
                      <Link to="/privacy-policy" className="text-purple-700 underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  {enqError && (
                    <div role="alert" className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                      {enqError}
                    </div>
                  )}

                  {enqSuccess && (
                    <div role="status" className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{enqSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={enqSubmitting}
                    className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>{enqSubmitting ? 'Sending Message...' : 'Send Message'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </GlassCard>
            </div>

            {/* Right Decorative Glass Card matching reference screenshot */}
            <div className="lg:col-span-3 flex">
              <div className="w-full glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-end min-h-[240px]">
                <div aria-hidden="true" className="pearl-orb w-24 h-24 rounded-full absolute top-8 right-6" />
                <div aria-hidden="true" className="pearl-orb w-12 h-12 rounded-full absolute top-24 left-8" />
                <div className="relative z-10 font-signature text-3xl sm:text-4xl text-slate-800 leading-tight">
                  Let’s
                  <br />
                  Create
                  <br />
                  Together.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
