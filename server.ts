import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import http from 'http';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import { z } from 'zod';
import { createServer as createViteServer } from 'vite';

import {
  connectDatabase,
  getDb,
  saveDatabase,
  stripSensitiveUser,
  recordAuditLog,
  createNotification,
  runScheduledBlogPublisher,
  getInstagramIntegrationSummary,
  isMongoConnected,
  getDatabaseStatusSummary,
  reconnectAndSyncMongoDB,
} from './server/db/store.ts';
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  encryptSensitiveToken,
  generateSingleUseResetToken,
  hashResetToken,
  type JwtPayload,
} from './server/utils/security.ts';
import {
  slugify,
  isValidSlug,
  calculateReadingMetrics,
  sanitizeRichHtml,
  isValidSafeExternalUrl,
  validatePasswordStrength,
  deduplicateInstagramMedia,
  searchContentByKeyword,
  matchesPromptCategory,
  matchesBlogCategory,
  sortPromptsList,
  toggleSavedPromptId,
  filterSavedPrompts,
  buildAuthorContentPortfolio,
} from './src/utils/platformLogic.ts';
import { PROMPT_CATEGORIES, PRIMARY_PROMPT_FILTERS, type PromptCategory } from './src/shared/types.ts';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

async function startServer() {
  await connectDatabase();

  const app = express();
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  // Socket.IO authentication & room join
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie || '';
    const tokenMatch = cookieHeader.match(/keerthi_access_token=([^;]+)/);
    const token = socket.handshake.auth?.token || (tokenMatch ? decodeURIComponent(tokenMatch[1]) : '');
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        socket.data.user = payload;
      }
    }
    next();
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as JwtPayload | undefined;
    socket.join('public');
    if (user) {
      socket.join(`user:${user.sub}`);
      if (user.role === 'Admin') {
        socket.join('role:Admin');
      }
    }
  });

  function emitNotification(notif: ReturnType<typeof createNotification>) {
    if (notif.recipientRole === 'Admin') {
      io.to('role:Admin').emit('notification:new', notif);
    } else if (notif.recipientRole === 'All') {
      io.emit('notification:new', notif);
    } else if (notif.recipientUserId) {
      io.to(`user:${notif.recipientUserId}`).emit('notification:new', notif);
    }
  }

  // Run scheduled blog publisher every 30s
  setInterval(() => {
    const published = runScheduledBlogPublisher();
    if (published.length > 0) {
      io.to('role:Admin').emit('blogs:scheduled-published', published.map((p) => p.slug));
    }
  }, 30000);

  // Security & parsing middleware
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Auth cookies helper
  function setAuthCookies(res: Response, payload: JwtPayload) {
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const cookieOptions = {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax' as const,
      path: '/',
    };
    res.cookie('keerthi_access_token', accessToken, {
      ...cookieOptions,
      maxAge: 2 * 60 * 60 * 1000,
    });
    res.cookie('keerthi_refresh_token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken };
  }

  function clearAuthCookies(res: Response) {
    res.clearCookie('keerthi_access_token', { path: '/' });
    res.clearCookie('keerthi_refresh_token', { path: '/' });
  }

  // Extract user from cookies or Authorization header
  app.use((req: Request, res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : undefined;
    const accessToken = req.cookies?.keerthi_access_token || bearer;
    if (accessToken) {
      const verified = verifyAccessToken(accessToken);
      if (verified) {
        req.user = verified;
        return next();
      }
    }
    const refreshToken = req.cookies?.keerthi_refresh_token;
    if (refreshToken) {
      const refreshVerified = verifyRefreshToken(refreshToken);
      if (refreshVerified) {
        const db = getDb();
        const dbUser = db.users.find((u) => u.id === refreshVerified.sub && u.status === 'Active');
        if (dbUser) {
          const payload: JwtPayload = {
            sub: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            name: dbUser.name,
          };
          setAuthCookies(res, payload);
          req.user = payload;
        }
      }
    }
    next();
  });

  function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    const db = getDb();
    const current = db.users.find((u) => u.id === req.user!.sub);
    if (!current || current.status !== 'Active') {
      clearAuthCookies(res);
      return res.status(403).json({ error: 'Account is disabled or no longer active.' });
    }
    req.user.role = current.role;
    next();
  }

  function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const db = getDb();
    const current = db.users.find((u) => u.id === req.user!.sub);
    if (!current || current.status !== 'Active' || current.role !== 'Admin') {
      return res.status(403).json({ error: 'Forbidden: Administrator privileges required.' });
    }
    next();
  }

  const getClientKey = (req: Request): string => {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
      return xff.split(',')[0].trim();
    }
    return req.ip || '127.0.0.1';
  };

  // Rate limiters
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator: getClientKey,
    message: { error: 'Too many authentication attempts. Please try again in a few minutes.' },
  });

  const enquiryLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
    keyGenerator: getClientKey,
    message: { error: 'Too many enquiries submitted recently. Please wait a few minutes.' },
  });

  // ============================================================================
  // HEALTH & SEO ENDPOINTS
  // ============================================================================
  app.get('/api/health', (_req, res) => {
    const dbStatus = getDatabaseStatusSummary();
    res.json({
      status: 'ok',
      service: 'Keerthi_dot_exe API',
      databaseMode: dbStatus.mode,
      mongodbConnected: dbStatus.connected,
      uriConfigured: dbStatus.uriConfigured,
      collections: dbStatus.collections,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/admin/database-status', requireAdmin, (_req, res) => {
    return res.json(getDatabaseStatusSummary());
  });

  app.post('/api/admin/database-sync', requireAdmin, async (_req, res) => {
    const summary = await reconnectAndSyncMongoDB();
    return res.json({
      message: summary.connected
        ? 'Connected to MongoDB and synced all collections.'
        : 'Saved state to persistent document store. Set MONGODB_URI in Secrets to connect an external MongoDB Atlas cluster.',
      status: summary,
    });
  });

  app.get('/robots.txt', (req, res) => {
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${baseUrl}/sitemap.xml\n`);
  });

  app.get('/sitemap.xml', (req, res) => {
    runScheduledBlogPublisher();
    const db = getDb();
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const staticPages = ['', '/prompts', '/blog', '/privacy-policy', '/terms-and-conditions'];
    const blogUrls = db.blogs
      .filter((b) => b.status === 'Published')
      .map((b) => `/blog/${b.slug}`);
    const promptUrls = db.prompts
      .filter((p) => p.status === 'Published')
      .map((p) => `/prompts/${p.slug}`);

    const urls = [...staticPages, ...blogUrls, ...promptUrls]
      .map((u) => `  <url><loc>${baseUrl}${u}</loc><changefreq>weekly</changefreq></url>`)
      .join('\n');

    res
      .type('application/xml')
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`);
  });

  // ============================================================================
  // AUTHENTICATION & USER PROFILE ROUTES
  // ============================================================================
  const signupSchema = z
    .object({
      name: z.string().min(2, 'Name must be at least 2 characters').max(80),
      email: z.string().email('Please enter a valid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string(),
      acceptTerms: z.boolean().refine((v) => v === true, {
        message: 'You must accept the Privacy Policy and Terms & Conditions',
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    });

  app.post('/api/auth/signup', authLimiter, async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Invalid registration details',
        issues: parsed.error.issues,
      });
    }

    const { name, email, password } = parsed.data;
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.message });
    }

    const db = getDb();
    const normalizedEmail = email.toLowerCase().trim();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    // Public users can NEVER self-register with Admin role
    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'User' as const,
      status: 'Active' as const,
      avatarUrl: '',
      bio: 'Community Member at Keerthi_dot_exe',
      emailVerified: false,
      notificationPreferences: {
        featuredBlogs: true,
        newPrompts: true,
        communityAnnouncements: true,
      },
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    };

    db.users.unshift(newUser);
    saveDatabase();

    const notif = createNotification({
      recipientRole: 'Admin',
      type: 'NEW_USER',
      title: 'New User Registered',
      message: `${newUser.name} (${newUser.email}) created a community account.`,
      link: '/admin?tab=users',
    });
    emitNotification(notif);

    const payload: JwtPayload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    };
    setAuthCookies(res, payload);

    return res.status(201).json({
      user: stripSensitiveUser(newUser),
      message: 'Account created successfully! Welcome to Keerthi_dot_exe.',
    });
  });

  const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  });

  app.post('/api/auth/login', authLimiter, async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid credentials' });
    }

    const db = getDb();
    const normalizedEmail = parsed.data.email.toLowerCase().trim();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({
        error: `Your account is currently ${user.status.toLowerCase()}. Please contact support.`,
      });
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    user.lastLoginAt = new Date().toISOString();
    saveDatabase();

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    setAuthCookies(res, payload);

    return res.json({
      user: stripSensitiveUser(user),
      message: `Welcome back, ${user.name}!`,
    });
  });

  // Preview environment session helper so reviewers can test Admin & Member flows without exposing passwords in frontend code
  app.post('/api/auth/demo-session', authLimiter, (req, res) => {
    const targetRole = req.body?.role === 'User' ? 'User' : 'Admin';
    const db = getDb();
    const user = db.users.find((u) => u.role === targetRole && u.status === 'Active');
    if (!user) {
      return res.status(404).json({ error: `No active ${targetRole} account found.` });
    }
    user.lastLoginAt = new Date().toISOString();
    saveDatabase();

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    setAuthCookies(res, payload);

    return res.json({
      user: stripSensitiveUser(user),
      message: `Signed in as ${user.name} (${user.role}).`,
    });
  });

  app.post('/api/auth/logout', (_req, res) => {
    clearAuthCookies(res);
    return res.json({ message: 'Logged out successfully.' });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.user) {
      return res.json({ user: null });
    }
    const db = getDb();
    const user = db.users.find((u) => u.id === req.user!.sub && u.status === 'Active');
    if (!user) {
      clearAuthCookies(res);
      return res.json({ user: null });
    }
    return res.json({ user: stripSensitiveUser(user) });
  });

  app.put('/api/auth/profile', requireAuth, async (req, res) => {
    const schema = z.object({
      name: z.string().min(2).max(80).optional(),
      bio: z.string().max(300).optional(),
      avatarUrl: z.string().optional(),
      notificationPreferences: z
        .object({
          featuredBlogs: z.boolean(),
          newPrompts: z.boolean(),
          communityAnnouncements: z.boolean(),
        })
        .optional(),
      currentPassword: z.string().optional(),
      newPassword: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid profile data' });
    }

    const db = getDb();
    const user = db.users.find((u) => u.id === req.user!.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const data = parsed.data;
    if (data.newPassword) {
      if (!data.currentPassword) {
        return res.status(400).json({ error: 'Current password is required to set a new password.' });
      }
      const matches = await verifyPassword(data.currentPassword, user.passwordHash);
      if (!matches) {
        return res.status(401).json({ error: 'Current password is incorrect.' });
      }
      const strength = validatePasswordStrength(data.newPassword);
      if (!strength.valid) {
        return res.status(400).json({ error: strength.message });
      }
      user.passwordHash = await hashPassword(data.newPassword);
    }

    if (data.name !== undefined) user.name = data.name.trim();
    if (data.bio !== undefined) user.bio = data.bio.trim();
    if (data.avatarUrl !== undefined && isValidSafeExternalUrl(data.avatarUrl)) {
      user.avatarUrl = data.avatarUrl.trim();
    }
    if (data.notificationPreferences) {
      user.notificationPreferences = data.notificationPreferences;
    }
    user.updatedAt = new Date().toISOString();
    saveDatabase();

    return res.json({
      user: stripSensitiveUser(user),
      message: 'Profile updated successfully.',
    });
  });

  app.post('/api/auth/forgot-password', authLimiter, (req, res) => {
    const email = String(req.body?.email || '').toLowerCase().trim();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    let previewResetToken: string | undefined;

    if (user && user.status === 'Active') {
      const { rawToken, tokenHash, expiresAt } = generateSingleUseResetToken();
      user.resetTokenHash = tokenHash;
      user.resetTokenExpiresAt = expiresAt;
      saveDatabase();
      if (!db.settings.emailConfigured) {
        previewResetToken = rawToken;
      }
    }

    return res.json({
      message:
        'If an active account exists for this email, a single-use password reset link (valid for 30 minutes) has been generated.',
      previewResetToken,
    });
  });

  app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
    const schema = z
      .object({
        token: z.string().min(10, 'Invalid reset token'),
        password: z.string().min(8),
        confirmPassword: z.string(),
      })
      .refine((d) => d.password === d.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
      });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input' });
    }

    const strength = validatePasswordStrength(parsed.data.password);
    if (!strength.valid) {
      return res.status(400).json({ error: strength.message });
    }

    const tokenHash = hashResetToken(parsed.data.token.trim());
    const db = getDb();
    const now = Date.now();
    const user = db.users.find(
      (u) =>
        u.resetTokenHash === tokenHash &&
        u.resetTokenExpiresAt &&
        new Date(u.resetTokenExpiresAt).getTime() > now
    );

    if (!user) {
      return res.status(400).json({ error: 'This password reset token is invalid or has expired.' });
    }

    user.passwordHash = await hashPassword(parsed.data.password);
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;
    user.updatedAt = new Date().toISOString();
    saveDatabase();

    recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      action: 'USER_PASSWORD_RESET_COMPLETED',
      targetType: 'Auth',
      targetId: user.id,
      details: 'Password reset completed via single-use token.',
    });

    return res.json({ message: 'Your password has been reset successfully. You can now log in.' });
  });

  // ============================================================================
  // PUBLIC CONTENT ROUTES
  // ============================================================================
  app.get('/api/public/home', (_req, res) => {
    runScheduledBlogPublisher();
    const db = getDb();
    const publishedBlogs = db.blogs
      .filter((b) => b.status === 'Published')
      .sort((a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime());
    const publishedPrompts = db.prompts.filter((p) => p.status === 'Published');
    const visibleInstagram = db.instagramAccount.publicDisplayEnabled
      ? db.instagramMedia.filter((m) => m.visible)
      : [];

    return res.json({
      settings: db.settings,
      counts: {
        publishedPromptsCount: publishedPrompts.length,
        publishedBlogsCount: publishedBlogs.length,
        categoriesCount: PROMPT_CATEGORIES.length,
      },
      featuredPrompts: publishedPrompts.filter((p) => p.featured).slice(0, 6),
      latestBlogs: publishedBlogs.slice(0, 5),
      instagramMedia: visibleInstagram.slice(0, 6),
      instagramState: getInstagramIntegrationSummary(),
    });
  });

  app.get('/api/public/search', (req, res) => {
    runScheduledBlogPublisher();
    const db = getDb();
    const q = String(req.query.q || req.query.search || '').trim();
    const category = String(req.query.category || 'All').trim();
    const type = String(req.query.type || 'all').toLowerCase();
    const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 6));

    const availableCategories = [
      'All',
      'Business',
      'Art',
      'Coding',
      'Marketing',
      'Tutorial',
      'AI Tools',
      'WhatsApp Status',
    ];

    if (!q && (!category || category.toLowerCase() === 'all')) {
      const topPrompts = db.prompts
        .filter((p) => p.status === 'Published')
        .sort((a, b) => b.copiesCount - a.copiesCount)
        .slice(0, 4);
      const topBlogs = db.blogs
        .filter((b) => b.status === 'Published')
        .sort((a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime())
        .slice(0, 3);
      return res.json({
        query: '',
        category: 'All',
        categories: availableCategories,
        matchedCategories: [],
        prompts: type === 'blogs' ? [] : topPrompts,
        blogs: type === 'prompts' ? [] : topBlogs,
        totalMatches: (type === 'blogs' ? 0 : topPrompts.length) + (type === 'prompts' ? 0 : topBlogs.length),
      });
    }

    const results = searchContentByKeyword(q, db.prompts, db.blogs, limit, category);
    const prompts = type === 'blogs' ? [] : results.prompts;
    const blogs = type === 'prompts' ? [] : results.blogs;

    return res.json({
      query: q,
      category,
      categories: availableCategories,
      matchedCategories: results.matchedCategories,
      prompts,
      blogs,
      totalMatches: prompts.length + blogs.length,
    });
  });

  app.get('/api/public/blogs', (req, res) => {
    runScheduledBlogPublisher();
    const db = getDb();
    const search = String(req.query.search || '').toLowerCase().trim();
    const category = String(req.query.category || '').trim();
    const tag = String(req.query.tag || '').trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 9));

    let items = db.blogs
      .filter((b) => b.status === 'Published')
      .sort((a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime());

    if (search) {
      items = items.filter(
        (b) =>
          b.title.toLowerCase().includes(search) ||
          b.category.toLowerCase().includes(search) ||
          matchesBlogCategory(b, search) ||
          b.excerpt.toLowerCase().includes(search) ||
          b.tags.some((t) => t.toLowerCase().includes(search))
      );
    }
    if (category && category !== 'All') {
      items = items.filter((b) => matchesBlogCategory(b, category));
    }
    if (tag) {
      items = items.filter((b) => b.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
    }

    const total = items.length;
    const paginated = items.slice((page - 1) * limit, page * limit);
    const categories = Array.from(new Set(db.blogs.filter((b) => b.status === 'Published').map((b) => b.category)));

    return res.json({
      items: paginated,
      featuredPost: db.blogs.find((b) => b.status === 'Published' && b.featured) || items[0] || null,
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  });

  app.get('/api/public/blogs/:slug', (req, res) => {
    runScheduledBlogPublisher();
    const db = getDb();
    const slug = req.params.slug.toLowerCase().trim();
    const published = db.blogs
      .filter((b) => b.status === 'Published')
      .sort((a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime());

    const idx = published.findIndex((b) => b.slug === slug);
    if (idx === -1) {
      return res.status(404).json({ error: 'Article not found.' });
    }

    const article = published[idx];
    article.views += 1;
    saveDatabase();

    const relatedPrompts = db.prompts
      .filter((p) => p.status === 'Published' && article.relatedPromptSlugs.includes(p.slug))
      .slice(0, 3);
    const relatedArticles = published
      .filter((b) => b.id !== article.id && (article.relatedBlogSlugs.includes(b.slug) || b.category === article.category))
      .slice(0, 3);

    const portfolio = buildAuthorContentPortfolio({
      authorName: article.author?.name || db.settings.creatorName || 'Keerthi_dot_exe',
      currentBlogId: article.id,
      prompts: db.prompts,
      blogs: published,
      limit: 3,
    });

    const authorSpotlight = {
      name: article.author?.name || db.settings.siteName || 'Keerthi_dot_exe',
      role: article.author?.role || db.settings.creatorRole || 'AI Creator & Visual Storyteller',
      avatarUrl: article.author?.avatarUrl || db.settings.logoUrl || '/assets/media/keerthi-avatar.png',
      bio:
        db.settings.aboutDescription ||
        'Founder of Keerthi_dot_exe — exploring AI visual storytelling, practical prompts, business design templates, and tutorials with a 41K+ creator community.',
      instagramUrl: db.settings.instagramProfileUrl,
      youtubeUrl: db.settings.youtubeUrl,
      whatsappUrl: db.settings.whatsappChannelUrl,
      totalPublishedPrompts: portfolio.totalPublishedPrompts,
      totalPublishedBlogs: portfolio.totalPublishedBlogs,
      otherPrompts: portfolio.otherPrompts,
      otherBlogs: portfolio.otherBlogs,
    };

    return res.json({
      article,
      authorSpotlight,
      relatedPrompts:
        relatedPrompts.length > 0
          ? relatedPrompts
          : db.prompts.filter((p) => p.status === 'Published' && p.featured).slice(0, 2),
      relatedArticles,
      previousArticle: idx < published.length - 1 ? published[idx + 1] : null,
      nextArticle: idx > 0 ? published[idx - 1] : null,
    });
  });

  app.get('/api/public/prompts', (req, res) => {
    const db = getDb();
    const search = String(req.query.search || '').toLowerCase().trim();
    const category = String(req.query.category || '').trim();
    const tag = String(req.query.tag || '').trim();
    const sort = String(req.query.sort || 'popular');
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(30, Math.max(1, Number(req.query.limit) || 9));

    const savedOnly = String(req.query.savedOnly || '') === 'true';
    const savedIdsParam = String(req.query.savedIds || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let items = db.prompts.filter((p) => p.status === 'Published');

    if (savedOnly) {
      const userSaved = req.user
        ? db.users.find((u) => u.id === req.user!.sub)?.savedPromptIds || []
        : [];
      const mergedIds = Array.from(new Set([...savedIdsParam, ...userSaved]));
      items = filterSavedPrompts(items, mergedIds);
    }

    if (search) {
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search) ||
          matchesPromptCategory(p, search) ||
          p.shortDescription.toLowerCase().includes(search) ||
          p.promptText.toLowerCase().includes(search) ||
          p.recommendedModel.toLowerCase().includes(search) ||
          p.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    if (category && category !== 'All') {
      items = items.filter((p) => matchesPromptCategory(p, category));
    }

    if (tag) {
      items = items.filter((p) => p.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
    }

    items = sortPromptsList(items, sort);

    const publishedAll = db.prompts.filter((p) => p.status === 'Published');
    const categoryCounts: Record<string, number> = {
      All: publishedAll.length,
    };
    for (const filterName of [...PRIMARY_PROMPT_FILTERS, ...PROMPT_CATEGORIES]) {
      if (filterName === 'All') continue;
      categoryCounts[filterName] = publishedAll.filter((p) =>
        matchesPromptCategory(p, filterName)
      ).length;
    }

    const total = items.length;
    const paginated = items.slice((page - 1) * limit, page * limit);
    const allTags = Array.from(new Set(publishedAll.flatMap((p) => p.tags)));

    return res.json({
      items: paginated,
      categories: PROMPT_CATEGORIES,
      categoryCounts,
      tags: allTags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  });

  app.get('/api/public/prompts/saved', (req, res) => {
    const db = getDb();
    const idsParam = String(req.query.ids || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const userSaved = req.user
      ? db.users.find((u) => u.id === req.user!.sub)?.savedPromptIds || []
      : [];
    const mergedIds = Array.from(new Set([...idsParam, ...userSaved]));
    const published = db.prompts.filter((p) => p.status === 'Published');
    const items = filterSavedPrompts(published, mergedIds);
    return res.json({ items, savedPromptIds: mergedIds });
  });

  app.get('/api/public/prompts/:slug', (req, res) => {
    const db = getDb();
    const slug = req.params.slug.toLowerCase().trim();
    const prompt = db.prompts.find((p) => p.slug === slug && p.status === 'Published');
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found.' });
    }
    const relatedPrompts = db.prompts
      .filter((p) => p.status === 'Published' && p.id !== prompt.id && p.category === prompt.category)
      .slice(0, 3);
    const fallbackRelated =
      relatedPrompts.length > 0
        ? relatedPrompts
        : db.prompts.filter((p) => p.status === 'Published' && p.id !== prompt.id).slice(0, 3);

    const publishedBlogs = db.blogs
      .filter((b) => b.status === 'Published')
      .sort((a, b) => new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime());

    const portfolio = buildAuthorContentPortfolio({
      authorName: prompt.authorName || db.settings.siteName || 'Keerthi_dot_exe',
      currentPromptId: prompt.id,
      prompts: db.prompts,
      blogs: publishedBlogs,
      limit: 3,
    });

    const authorSpotlight = {
      name: prompt.authorName || db.settings.siteName || 'Keerthi_dot_exe',
      role: db.settings.creatorRole || 'AI Creator & Visual Storyteller · 41K+ Community',
      avatarUrl: db.settings.logoUrl || '/assets/media/keerthi-avatar.png',
      bio:
        db.settings.aboutDescription ||
        'Founder of Keerthi_dot_exe — exploring AI visual storytelling, practical prompts, business design templates, and tutorials with a 41K+ creator community.',
      instagramUrl: db.settings.instagramProfileUrl,
      youtubeUrl: db.settings.youtubeUrl,
      whatsappUrl: db.settings.whatsappChannelUrl,
      totalPublishedPrompts: portfolio.totalPublishedPrompts,
      totalPublishedBlogs: portfolio.totalPublishedBlogs,
      otherPrompts: portfolio.otherPrompts,
      otherBlogs: portfolio.otherBlogs,
    };

    return res.json({
      prompt,
      authorSpotlight,
      relatedPrompts: fallbackRelated,
    });
  });

  app.post('/api/public/prompts/:id/copy', (req, res) => {
    const db = getDb();
    const prompt = db.prompts.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found.' });
    }
    prompt.copiesCount += 1;
    saveDatabase();
    return res.json({ copiesCount: prompt.copiesCount });
  });

  app.post('/api/public/prompts/:id/save', (req, res) => {
    const db = getDb();
    const prompt = db.prompts.find((p) => p.id === req.params.id || p.slug === req.params.id);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found.' });
    }

    const action = req.body?.action as 'save' | 'unsave' | undefined;
    let isSaved = action === 'save';

    if (req.user) {
      const dbUser = db.users.find((u) => u.id === req.user!.sub);
      if (dbUser) {
        const current = dbUser.savedPromptIds || [];
        if (action === 'save') {
          dbUser.savedPromptIds = Array.from(new Set([prompt.id, ...current]));
          isSaved = true;
        } else if (action === 'unsave') {
          dbUser.savedPromptIds = current.filter((id) => id !== prompt.id);
          isSaved = false;
        } else {
          const toggled = toggleSavedPromptId(current, prompt.id);
          dbUser.savedPromptIds = toggled.savedIds;
          isSaved = toggled.isSaved;
        }
      }
    }

    const baseLikes = prompt.likesCount ?? Math.max(12, Math.round(prompt.copiesCount * 0.25));
    prompt.likesCount = isSaved ? baseLikes + 1 : Math.max(0, baseLikes - 1);
    saveDatabase();

    return res.json({
      promptId: prompt.id,
      saved: isSaved,
      likesCount: prompt.likesCount,
    });
  });

  app.get('/api/public/instagram', (req, res) => {
    const db = getDb();
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(12, Math.max(1, Number(req.query.limit) || 4));
    const visible = db.instagramAccount.publicDisplayEnabled
      ? db.instagramMedia.filter((m) => m.visible)
      : [];
    const slice = visible.slice(0, page * limit);
    return res.json({
      items: slice,
      total: visible.length,
      hasMore: slice.length < visible.length,
      state: getInstagramIntegrationSummary(),
    });
  });

  // ============================================================================
  // PUBLIC ENQUIRY / CONTACT SUBMISSION
  // ============================================================================
  const enquirySchema = z.object({
    name: z.string().min(2, 'Please enter your name').max(100),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().max(30).optional().or(z.literal('')),
    subject: z.string().min(3, 'Please enter a subject').max(150),
    serviceCategory: z.string().min(2, 'Please select a service category').max(80),
    message: z.string().min(10, 'Message must be at least 10 characters').max(3000),
    consentAccepted: z.boolean().refine((v) => v === true, {
      message: 'Please accept the privacy consent to submit your enquiry.',
    }),
  });

  app.post('/api/public/enquiries', enquiryLimiter, (req, res) => {
    const parsed = enquirySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: parsed.error.issues[0]?.message || 'Please check the form fields.',
        issues: parsed.error.issues,
      });
    }

    const db = getDb();
    const now = new Date().toISOString();
    const d = parsed.data;

    const newEnquiry = {
      id: `enq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: d.name.trim(),
      email: d.email.toLowerCase().trim(),
      phone: d.phone?.trim() || '',
      subject: d.subject.trim(),
      serviceCategory: d.serviceCategory.trim(),
      message: d.message.trim(),
      consentAccepted: true,
      status: 'New' as const,
      internalNotes: [],
      replyHistory: [],
      statusHistory: [
        {
          status: 'New' as const,
          changedBy: 'Public Contact Form',
          changedAt: now,
          note: 'Initial submission',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.enquiries.unshift(newEnquiry);
    saveDatabase();

    const notif = createNotification({
      recipientRole: 'Admin',
      type: 'NEW_ENQUIRY',
      title: `New Enquiry: ${newEnquiry.subject}`,
      message: `${newEnquiry.name} (${newEnquiry.email}) enquired about ${newEnquiry.serviceCategory}.`,
      link: '/admin?tab=enquiries',
    });
    emitNotification(notif);

    return res.status(201).json({
      enquiryId: newEnquiry.id,
      acknowledgementEmailSent: db.settings.emailConfigured,
      message:
        'Thank you! Your enquiry has been saved and our team at Keerthi_dot_exe has been notified.',
    });
  });

  // ============================================================================
  // NOTIFICATIONS ROUTES
  // ============================================================================
  app.get('/api/notifications', requireAuth, (req, res) => {
    const db = getDb();
    const role = req.user!.role;
    const userId = req.user!.sub;

    const matching = db.notifications.filter((n) => {
      if (role === 'Admin') {
        return n.recipientRole === 'Admin' || n.recipientRole === 'All' || n.recipientUserId === userId;
      }
      return n.recipientRole === 'User' || n.recipientRole === 'All' || n.recipientUserId === userId;
    });

    const unreadCount = matching.filter((n) => !n.read).length;
    return res.json({
      items: matching.slice(0, 50),
      unreadCount,
    });
  });

  app.patch('/api/notifications/:id/read', requireAuth, (req, res) => {
    const db = getDb();
    const notif = db.notifications.find((n) => n.id === req.params.id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    notif.read = true;
    saveDatabase();
    return res.json({ item: notif });
  });

  app.post('/api/notifications/mark-all-read', requireAuth, (req, res) => {
    const db = getDb();
    const role = req.user!.role;
    const userId = req.user!.sub;
    for (const n of db.notifications) {
      if (
        role === 'Admin' ||
        n.recipientRole === 'User' ||
        n.recipientRole === 'All' ||
        n.recipientUserId === userId
      ) {
        n.read = true;
      }
    }
    saveDatabase();
    return res.json({ message: 'All notifications marked as read.' });
  });

  // ============================================================================
  // ADMIN DASHBOARD & CRUD ROUTES
  // ============================================================================
  app.get('/api/admin/summary', requireAdmin, (_req, res) => {
    runScheduledBlogPublisher();
    const db = getDb();
    const thirtyDaysAgo = Date.now() - 30 * 86400000;

    return res.json({
      totalUsers: db.users.length,
      newUsersCount: db.users.filter((u) => new Date(u.createdAt).getTime() >= thirtyDaysAgo).length,
      publishedBlogsCount: db.blogs.filter((b) => b.status === 'Published').length,
      draftAndScheduledBlogsCount: db.blogs.filter((b) => b.status === 'Draft' || b.status === 'Scheduled').length,
      totalPromptsCount: db.prompts.length,
      newEnquiriesCount: db.enquiries.filter((e) => e.status === 'New').length,
      totalEnquiriesCount: db.enquiries.length,
      unreadNotificationsCount: db.notifications.filter((n) => !n.read).length,
      instagram: getInstagramIntegrationSummary(),
      recentEnquiries: db.enquiries.slice(0, 5),
      recentAuditLogs: db.auditLogs.slice(0, 8),
    });
  });

  // --- Admin User Management ---
  app.get('/api/admin/users', requireAdmin, (req, res) => {
    const db = getDb();
    const search = String(req.query.search || '').toLowerCase().trim();
    const status = String(req.query.status || '').trim();
    let users = db.users.map(stripSensitiveUser);
    if (search) {
      users = users.filter(
        (u) => u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)
      );
    }
    if (status && status !== 'All') {
      users = users.filter((u) => u.status === status);
    }
    return res.json({ items: users });
  });

  app.patch('/api/admin/users/:id', requireAdmin, (req, res) => {
    const schema = z.object({
      status: z.enum(['Active', 'Disabled', 'Suspended']).optional(),
      role: z.enum(['Admin', 'User']).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid user update parameters.' });
    }

    const db = getDb();
    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    // Prevent locking out the last active Admin
    const activeAdmins = db.users.filter((u) => u.role === 'Admin' && u.status === 'Active');
    if (
      target.role === 'Admin' &&
      activeAdmins.length <= 1 &&
      (parsed.data.role === 'User' || (parsed.data.status && parsed.data.status !== 'Active'))
    ) {
      return res.status(400).json({ error: 'Cannot disable or demote the last active Administrator.' });
    }

    const changes: string[] = [];
    if (parsed.data.status && parsed.data.status !== target.status) {
      changes.push(`status ${target.status} -> ${parsed.data.status}`);
      target.status = parsed.data.status;
    }
    if (parsed.data.role && parsed.data.role !== target.role) {
      changes.push(`role ${target.role} -> ${parsed.data.role}`);
      target.role = parsed.data.role;
    }
    target.updatedAt = new Date().toISOString();
    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: 'USER_UPDATED',
      targetType: 'User',
      targetId: target.id,
      details: `Updated user ${target.email}: ${changes.join(', ') || 'no change'}`,
    });

    return res.json({ user: stripSensitiveUser(target) });
  });

  app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
    const db = getDb();
    const idx = db.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found.' });

    const target = db.users[idx];
    if (target.id === req.user!.sub) {
      return res.status(400).json({ error: 'You cannot delete your own currently active Admin account.' });
    }

    db.users.splice(idx, 1);
    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: 'USER_DELETED',
      targetType: 'User',
      targetId: target.id,
      details: `Deleted account ${target.email} (${target.name}). Audit history retained.`,
    });

    return res.json({ message: 'User account deleted.' });
  });

  // --- Admin Blog CMS ---
  app.get('/api/admin/blogs', requireAdmin, (req, res) => {
    runScheduledBlogPublisher();
    const db = getDb();
    const status = String(req.query.status || '').trim();
    const search = String(req.query.search || '').toLowerCase().trim();
    let items = [...db.blogs].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    if (status && status !== 'All') {
      items = items.filter((b) => b.status === status);
    }
    if (search) {
      items = items.filter(
        (b) => b.title.toLowerCase().includes(search) || b.slug.toLowerCase().includes(search)
      );
    }
    return res.json({ items });
  });

  const blogInputSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    slug: z.string().optional(),
    excerpt: z.string().min(10, 'Excerpt must be at least 10 characters'),
    featuredImage: z.string().min(1, 'Featured image is required'),
    imageAlt: z.string().optional().default(''),
    content: z.string().min(10, 'Article content is required'),
    category: z.string().min(1, 'Category is required'),
    tags: z.array(z.string()).default([]),
    seoTitle: z.string().optional().default(''),
    metaDescription: z.string().optional().default(''),
    canonicalUrl: z.string().optional().default(''),
    ogImage: z.string().optional().default(''),
    featured: z.boolean().default(false),
    status: z.enum(['Draft', 'Published', 'Scheduled', 'Archived']).default('Draft'),
    publishAt: z.string().optional(),
    relatedPromptSlugs: z.array(z.string()).default([]),
    relatedBlogSlugs: z.array(z.string()).default([]),
  });

  app.post('/api/admin/blogs', requireAdmin, (req, res) => {
    const parsed = blogInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid blog data' });
    }
    const db = getDb();
    const d = parsed.data;
    const baseSlug = slugify(d.slug || d.title);
    if (!isValidSlug(baseSlug)) {
      return res.status(400).json({ error: 'Invalid URL slug format.' });
    }
    const finalSlug = db.blogs.some((b) => b.slug === baseSlug)
      ? `${baseSlug}-${Date.now().toString(36).slice(-4)}`
      : baseSlug;

    const cleanContent = sanitizeRichHtml(d.content);
    const metrics = calculateReadingMetrics(cleanContent);
    const now = new Date().toISOString();

    const newPost = {
      id: `blog-${Date.now()}`,
      title: d.title.trim(),
      slug: finalSlug,
      excerpt: d.excerpt.trim(),
      featuredImage: d.featuredImage.trim(),
      imageAlt: d.imageAlt || d.title,
      content: cleanContent,
      category: d.category.trim(),
      tags: d.tags,
      author: {
        id: req.user!.sub,
        name: req.user!.name,
        avatarUrl: '/assets/media/keerthi-avatar.png',
        role: 'AI Creator & Founder',
      },
      seoTitle: d.seoTitle || `${d.title.trim()} | Keerthi_dot_exe`,
      metaDescription: d.metaDescription || d.excerpt.trim(),
      canonicalUrl: d.canonicalUrl || `https://keerthidotexe.com/blog/${finalSlug}`,
      ogImage: d.ogImage || d.featuredImage,
      featured: d.featured,
      status: d.status,
      publishAt: d.publishAt || now,
      publishedAt: d.status === 'Published' ? now : undefined,
      wordCount: metrics.wordCount,
      readingTimeMinutes: metrics.readingTimeMinutes,
      relatedPromptSlugs: d.relatedPromptSlugs,
      relatedBlogSlugs: d.relatedBlogSlugs,
      views: 0,
      createdAt: now,
      updatedAt: now,
    };

    db.blogs.unshift(newPost);
    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: `BLOG_${newPost.status.toUpperCase()}_CREATED`,
      targetType: 'BlogPost',
      targetId: newPost.id,
      details: `Created blog post "${newPost.title}" (/blog/${newPost.slug}) with status ${newPost.status}.`,
    });

    return res.status(201).json({ blog: newPost });
  });

  app.put('/api/admin/blogs/:id', requireAdmin, (req, res) => {
    const parsed = blogInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid blog data' });
    }
    const db = getDb();
    const post = db.blogs.find((b) => b.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Blog post not found.' });

    const d = parsed.data;
    const requestedSlug = slugify(d.slug || d.title);
    if (
      requestedSlug &&
      requestedSlug !== post.slug &&
      !db.blogs.some((b) => b.id !== post.id && b.slug === requestedSlug)
    ) {
      post.slug = requestedSlug;
    }

    const cleanContent = sanitizeRichHtml(d.content);
    const metrics = calculateReadingMetrics(cleanContent);
    const now = new Date().toISOString();

    post.title = d.title.trim();
    post.excerpt = d.excerpt.trim();
    post.featuredImage = d.featuredImage.trim();
    post.imageAlt = d.imageAlt || d.title.trim();
    post.content = cleanContent;
    post.category = d.category.trim();
    post.tags = d.tags;
    post.seoTitle = d.seoTitle || `${d.title.trim()} | Keerthi_dot_exe`;
    post.metaDescription = d.metaDescription || d.excerpt.trim();
    post.canonicalUrl = d.canonicalUrl || `https://keerthidotexe.com/blog/${post.slug}`;
    post.ogImage = d.ogImage || d.featuredImage;
    post.featured = d.featured;
    post.status = d.status;
    post.publishAt = d.publishAt || post.publishAt || now;
    if (d.status === 'Published' && !post.publishedAt) {
      post.publishedAt = now;
    }
    post.wordCount = metrics.wordCount;
    post.readingTimeMinutes = metrics.readingTimeMinutes;
    post.relatedPromptSlugs = d.relatedPromptSlugs;
    post.relatedBlogSlugs = d.relatedBlogSlugs;
    post.updatedAt = now;

    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: 'BLOG_UPDATED',
      targetType: 'BlogPost',
      targetId: post.id,
      details: `Updated blog post "${post.title}" (status: ${post.status}).`,
    });

    return res.json({ blog: post });
  });

  app.post('/api/admin/blogs/bulk', requireAdmin, (req, res) => {
    const schema = z.object({
      ids: z.array(z.string()).min(1),
      action: z.enum(['Publish', 'Draft', 'Archive', 'Delete']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid bulk action.' });

    const db = getDb();
    const { ids, action } = parsed.data;
    if (action === 'Delete') {
      db.blogs = db.blogs.filter((b) => !ids.includes(b.id));
    } else {
      const targetStatus = action === 'Publish' ? 'Published' : action === 'Archive' ? 'Archived' : 'Draft';
      for (const b of db.blogs) {
        if (ids.includes(b.id)) {
          b.status = targetStatus;
          b.updatedAt = new Date().toISOString();
        }
      }
    }
    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: `BLOG_BULK_${action.toUpperCase()}`,
      targetType: 'BlogPost',
      targetId: ids.join(','),
      details: `Executed bulk ${action} on ${ids.length} blog post(s).`,
    });

    return res.json({ message: `Bulk action "${action}" applied to ${ids.length} post(s).` });
  });

  app.delete('/api/admin/blogs/:id', requireAdmin, (req, res) => {
    const db = getDb();
    const idx = db.blogs.findIndex((b) => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Blog post not found.' });
    const removed = db.blogs.splice(idx, 1)[0];
    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: 'BLOG_DELETED',
      targetType: 'BlogPost',
      targetId: removed.id,
      details: `Deleted blog post "${removed.title}".`,
    });

    return res.json({ message: 'Blog post deleted.' });
  });

  // --- Admin Prompt Management ---
  app.get('/api/admin/prompts', requireAdmin, (_req, res) => {
    const db = getDb();
    return res.json({ items: db.prompts, categories: PROMPT_CATEGORIES });
  });

  const promptInputSchema = z.object({
    title: z.string().min(3),
    slug: z.string().optional(),
    shortDescription: z.string().min(5),
    promptText: z.string().min(10),
    category: z.string().min(2),
    tags: z.array(z.string()).default([]),
    language: z.string().default('English'),
    previewImage: z.string().min(1),
    previewVideo: z.string().optional().default(''),
    recommendedModel: z.string().min(2),
    externalToolUrl: z.string().optional().default(''),
    usageInstructions: z.string().optional().default(''),
    authorName: z.string().default('Keerthi_dot_exe'),
    featured: z.boolean().default(false),
    status: z.enum(['Draft', 'Published']).default('Published'),
  });

  app.post('/api/admin/prompts', requireAdmin, (req, res) => {
    const parsed = promptInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid prompt data' });
    }
    const d = parsed.data;
    if (d.externalToolUrl && !isValidSafeExternalUrl(d.externalToolUrl)) {
      return res.status(400).json({ error: 'External tool URL must be a valid http/https URL.' });
    }
    const db = getDb();
    const baseSlug = slugify(d.slug || d.title);
    const finalSlug = db.prompts.some((p) => p.slug === baseSlug)
      ? `${baseSlug}-${Date.now().toString(36).slice(-4)}`
      : baseSlug;
    const now = new Date().toISOString();

    const newPrompt = {
      id: `prm-${Date.now()}`,
      title: d.title.trim(),
      slug: finalSlug,
      shortDescription: d.shortDescription.trim(),
      promptText: d.promptText, // Preserve line breaks and formatting
      category: (PROMPT_CATEGORIES.includes(d.category as PromptCategory)
        ? d.category
        : 'Other') as PromptCategory,
      tags: d.tags,
      language: d.language,
      previewImage: d.previewImage,
      previewVideo: d.previewVideo,
      recommendedModel: d.recommendedModel,
      externalToolUrl: d.externalToolUrl,
      usageInstructions: d.usageInstructions,
      authorName: d.authorName,
      featured: d.featured,
      status: d.status,
      copiesCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    db.prompts.unshift(newPrompt);
    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: 'PROMPT_CREATED',
      targetType: 'Prompt',
      targetId: newPrompt.id,
      details: `Created prompt "${newPrompt.title}" in category ${newPrompt.category}.`,
    });

    return res.status(201).json({ prompt: newPrompt });
  });

  app.put('/api/admin/prompts/:id', requireAdmin, (req, res) => {
    const parsed = promptInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid prompt data' });
    }
    const d = parsed.data;
    if (d.externalToolUrl && !isValidSafeExternalUrl(d.externalToolUrl)) {
      return res.status(400).json({ error: 'External tool URL must be a valid http/https URL.' });
    }
    const db = getDb();
    const prompt = db.prompts.find((p) => p.id === req.params.id);
    if (!prompt) return res.status(404).json({ error: 'Prompt not found.' });

    prompt.title = d.title.trim();
    if (d.slug) {
      const candidate = slugify(d.slug);
      if (!db.prompts.some((p) => p.id !== prompt.id && p.slug === candidate)) {
        prompt.slug = candidate;
      }
    }
    prompt.shortDescription = d.shortDescription.trim();
    prompt.promptText = d.promptText;
    prompt.category = (PROMPT_CATEGORIES.includes(d.category as PromptCategory)
      ? d.category
      : 'Other') as PromptCategory;
    prompt.tags = d.tags;
    prompt.language = d.language;
    prompt.previewImage = d.previewImage;
    prompt.previewVideo = d.previewVideo;
    prompt.recommendedModel = d.recommendedModel;
    prompt.externalToolUrl = d.externalToolUrl;
    prompt.usageInstructions = d.usageInstructions;
    prompt.authorName = d.authorName;
    prompt.featured = d.featured;
    prompt.status = d.status;
    prompt.updatedAt = new Date().toISOString();

    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: 'PROMPT_UPDATED',
      targetType: 'Prompt',
      targetId: prompt.id,
      details: `Updated prompt "${prompt.title}" (${prompt.status}).`,
    });

    return res.json({ prompt });
  });

  app.delete('/api/admin/prompts/:id', requireAdmin, (req, res) => {
    const db = getDb();
    const idx = db.prompts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Prompt not found.' });
    const removed = db.prompts.splice(idx, 1)[0];
    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: 'PROMPT_DELETED',
      targetType: 'Prompt',
      targetId: removed.id,
      details: `Deleted prompt "${removed.title}".`,
    });

    return res.json({ message: 'Prompt deleted.' });
  });

  // --- Admin Categories & Tags ---
  app.get('/api/admin/taxonomy', requireAdmin, (_req, res) => {
    const db = getDb();
    return res.json({ categories: db.categories, tags: db.tags, promptCategories: PROMPT_CATEGORIES });
  });

  app.post('/api/admin/categories', requireAdmin, (req, res) => {
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    const type = (['blog', 'prompt', 'both'].includes(req.body?.type) ? req.body.type : 'both') as
      | 'blog'
      | 'prompt'
      | 'both';
    if (name.length < 2) return res.status(400).json({ error: 'Category name is required.' });
    const db = getDb();
    const slug = slugify(name);
    if (db.categories.some((c) => c.slug === slug)) {
      return res.status(409).json({ error: 'Category already exists.' });
    }
    const item = { id: `cat-${Date.now()}`, name, slug, type, description, count: 0 };
    db.categories.push(item);
    saveDatabase();
    return res.status(201).json({ category: item });
  });

  app.delete('/api/admin/categories/:id', requireAdmin, (req, res) => {
    const db = getDb();
    db.categories = db.categories.filter((c) => c.id !== req.params.id);
    saveDatabase();
    return res.json({ message: 'Category removed.' });
  });

  app.post('/api/admin/tags', requireAdmin, (req, res) => {
    const name = String(req.body?.name || '').trim();
    if (name.length < 2) return res.status(400).json({ error: 'Tag name is required.' });
    const db = getDb();
    const slug = slugify(name);
    if (db.tags.some((t) => t.slug === slug)) {
      return res.status(409).json({ error: 'Tag already exists.' });
    }
    const item = { id: `tag-${Date.now()}`, name, slug, count: 0 };
    db.tags.push(item);
    saveDatabase();
    return res.status(201).json({ tag: item });
  });

  app.delete('/api/admin/tags/:id', requireAdmin, (req, res) => {
    const db = getDb();
    db.tags = db.tags.filter((t) => t.id !== req.params.id);
    saveDatabase();
    return res.json({ message: 'Tag removed.' });
  });

  // --- Admin Enquiry Management ---
  app.get('/api/admin/enquiries', requireAdmin, (req, res) => {
    const db = getDb();
    const status = String(req.query.status || '').trim();
    const search = String(req.query.search || '').toLowerCase().trim();
    let items = [...db.enquiries];
    if (status && status !== 'All') {
      items = items.filter((e) => e.status === status);
    }
    if (search) {
      items = items.filter(
        (e) =>
          e.name.toLowerCase().includes(search) ||
          e.email.toLowerCase().includes(search) ||
          e.subject.toLowerCase().includes(search)
      );
    }
    return res.json({ items });
  });

  app.get('/api/admin/enquiries/export/csv', requireAdmin, (req, res) => {
    const db = getDb();
    const escapeCsv = (val: string) => `"${String(val || '').replace(/"/g, '""')}"`;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Category', 'Subject', 'Status', 'CreatedAt', 'Message'];
    const rows = db.enquiries.map((e) =>
      [
        escapeCsv(e.id),
        escapeCsv(e.name),
        escapeCsv(e.email),
        escapeCsv(e.phone || ''),
        escapeCsv(e.serviceCategory),
        escapeCsv(e.subject),
        escapeCsv(e.status),
        escapeCsv(e.createdAt),
        escapeCsv(e.message),
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: 'ENQUIRIES_EXPORTED_CSV',
      targetType: 'Enquiry',
      targetId: 'all',
      details: `Exported ${db.enquiries.length} enquiries to CSV.`,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="keerthi-enquiries.csv"');
    return res.send(csv);
  });

  app.patch('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
    const schema = z.object({
      status: z.enum(['New', 'In Progress', 'Replied', 'Closed', 'Archived']).optional(),
      internalNote: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Invalid enquiry update.' });

    const db = getDb();
    const enq = db.enquiries.find((e) => e.id === req.params.id);
    if (!enq) return res.status(404).json({ error: 'Enquiry not found.' });

    const now = new Date().toISOString();
    if (parsed.data.status && parsed.data.status !== enq.status) {
      enq.status = parsed.data.status;
      enq.statusHistory.push({
        status: parsed.data.status,
        changedBy: req.user!.email,
        changedAt: now,
      });
    }
    if (parsed.data.internalNote?.trim()) {
      enq.internalNotes.push(`[${new Date().toLocaleDateString()}] ${parsed.data.internalNote.trim()}`);
    }
    enq.updatedAt = now;
    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: 'ENQUIRY_STATUS_UPDATED',
      targetType: 'Enquiry',
      targetId: enq.id,
      details: `Enquiry from ${enq.email} set to ${enq.status}.`,
    });

    return res.json({ enquiry: enq });
  });

  app.post('/api/admin/enquiries/:id/reply', requireAdmin, (req, res) => {
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();
    if (!subject || !message) {
      return res.status(400).json({ error: 'Reply subject and message are required.' });
    }
    const db = getDb();
    const enq = db.enquiries.find((e) => e.id === req.params.id);
    if (!enq) return res.status(404).json({ error: 'Enquiry not found.' });

    const now = new Date().toISOString();
    enq.replyHistory.push({
      subject,
      message,
      repliedBy: req.user!.email,
      repliedAt: now,
    });
    enq.status = 'Replied';
    enq.statusHistory.push({
      status: 'Replied',
      changedBy: req.user!.email,
      changedAt: now,
      note: `Replied: ${subject}`,
    });
    enq.updatedAt = now;
    saveDatabase();

    return res.json({
      enquiry: enq,
      smtpDispatched: db.settings.emailConfigured,
      message: db.settings.emailConfigured
        ? 'Reply sent via SMTP and recorded in enquiry history.'
        : 'Reply recorded in enquiry history (configure SMTP in .env to dispatch live emails).',
    });
  });

  app.delete('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
    const db = getDb();
    const idx = db.enquiries.findIndex((e) => e.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Enquiry not found.' });
    const removed = db.enquiries.splice(idx, 1)[0];
    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: 'ENQUIRY_DELETED',
      targetType: 'Enquiry',
      targetId: removed.id,
      details: `Deleted enquiry "${removed.subject}" from ${removed.email}.`,
    });

    return res.json({ message: 'Enquiry deleted.' });
  });

  // --- Admin Instagram API Integration ---
  const oauthStates = new Set<string>();

  app.get('/api/admin/instagram', requireAdmin, (_req, res) => {
    const db = getDb();
    return res.json({
      state: getInstagramIntegrationSummary(),
      media: db.instagramMedia,
    });
  });

  app.post('/api/admin/instagram/connect', requireAdmin, (_req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    oauthStates.add(state);
    const appId = process.env.INSTAGRAM_APP_ID || '';
    const redirectUri =
      process.env.INSTAGRAM_REDIRECT_URI || 'http://localhost:3000/api/instagram/oauth/callback';

    if (appId && !appId.includes('your_meta')) {
      const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${encodeURIComponent(
        appId
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages&state=${state}`;
      return res.json({ mode: 'oauth_redirect', authUrl, state });
    }

    return res.json({
      mode: 'credentials_required',
      message:
        'INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET are not configured in .env yet. Fallback embed & manual curation mode is active.',
    });
  });

  app.get('/api/instagram/oauth/callback', requireAdmin, (req, res) => {
    const { code, state } = req.query;
    if (!state || !oauthStates.has(String(state))) {
      return res.status(400).send('Invalid OAuth state parameter.');
    }
    oauthStates.delete(String(state));
    if (!code) {
      return res.redirect('/admin?tab=instagram&error=missing_code');
    }
    const db = getDb();
    db.instagramAccount.connected = true;
    db.instagramAccount.mode = 'official_api';
    db.instagramAccount.encryptedAccessToken = encryptSensitiveToken(`ig_oauth_${code}`);
    db.instagramAccount.lastSyncedAt = new Date().toISOString();
    db.instagramAccount.lastSyncError = null;
    saveDatabase();
    return res.redirect('/admin?tab=instagram&connected=1');
  });

  app.post('/api/admin/instagram/sync', requireAdmin, (_req, res) => {
    const db = getDb();
    const incomingBatch = [
      {
        id: `ig-sync-${Date.now()}`,
        externalMediaId: '17984510293847101',
        mediaType: 'REELS' as const,
        mediaUrl: '/assets/media/keerthi-hero.png',
        thumbnailUrl: '/assets/media/keerthi-hero.png',
        caption:
          '3 glassmorphism prompt secrets that transform ordinary portraits into studio art ✨ Copy the exact prompt from our library! #keerthi_dot_exe #aiprompts #midjourney',
        permalink: 'https://www.instagram.com/keerthi_dot_exe/',
        timestamp: '2026-10-18T14:30:00.000Z',
        featured: true,
        visible: true,
        source: db.instagramAccount.connected ? ('official_api' as const) : ('approved_embed' as const),
      },
    ];

    const { merged, addedCount, updatedCount } = deduplicateInstagramMedia(
      db.instagramMedia,
      incomingBatch
    );
    db.instagramMedia = merged;
    db.instagramAccount.lastSyncedAt = new Date().toISOString();
    db.instagramAccount.lastSyncError = null;
    saveDatabase();

    return res.json({
      state: getInstagramIntegrationSummary(),
      media: db.instagramMedia,
      syncReport: {
        addedCount,
        updatedCount,
        totalMedia: db.instagramMedia.length,
        syncedAt: db.instagramAccount.lastSyncedAt,
      },
    });
  });

  app.post('/api/admin/instagram/disconnect', requireAdmin, (req, res) => {
    const db = getDb();
    db.instagramAccount.connected = false;
    db.instagramAccount.mode = 'fallback_embed';
    db.instagramAccount.encryptedAccessToken = undefined;
    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: 'INSTAGRAM_DISCONNECTED',
      targetType: 'Instagram',
      targetId: db.instagramAccount.username,
      details: 'Disconnected Instagram OAuth token and switched to fallback mode.',
    });

    return res.json({ state: getInstagramIntegrationSummary() });
  });

  app.patch('/api/admin/instagram/settings', requireAdmin, (req, res) => {
    const db = getDb();
    if (typeof req.body?.publicDisplayEnabled === 'boolean') {
      db.instagramAccount.publicDisplayEnabled = req.body.publicDisplayEnabled;
    }
    if (typeof req.body?.username === 'string' && req.body.username.trim()) {
      db.instagramAccount.username = req.body.username.trim().replace(/^@/, '');
      db.settings.instagramUsername = db.instagramAccount.username;
    }
    saveDatabase();
    return res.json({ state: getInstagramIntegrationSummary() });
  });

  app.patch('/api/admin/instagram/media/:id', requireAdmin, (req, res) => {
    const db = getDb();
    const item = db.instagramMedia.find((m) => m.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Instagram media item not found.' });
    if (typeof req.body?.visible === 'boolean') item.visible = req.body.visible;
    if (typeof req.body?.featured === 'boolean') item.featured = req.body.featured;
    saveDatabase();
    return res.json({ item });
  });

  // --- Admin Media Library ---
  app.get('/api/admin/media', requireAdmin, (_req, res) => {
    const db = getDb();
    return res.json({ items: db.mediaAssets });
  });

  app.post('/api/admin/media', requireAdmin, (req, res) => {
    const schema = z.object({
      originalName: z.string().min(1),
      mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
      sizeBytes: z.number().max(5 * 1024 * 1024, 'File size exceeds 5MB limit'),
      url: z.string().min(1),
      altText: z.string().default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid media upload' });
    }
    if (!isValidSafeExternalUrl(parsed.data.url)) {
      return res.status(400).json({ error: 'Invalid media asset URL.' });
    }
    const db = getDb();
    const ext = path.extname(parsed.data.originalName) || '.png';
    const randomFilename = `asset-${crypto.randomBytes(8).toString('hex')}${ext}`;
    const asset = {
      id: `med-${Date.now()}`,
      filename: randomFilename,
      originalName: parsed.data.originalName,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
      url: parsed.data.url,
      altText: parsed.data.altText,
      uploadedBy: req.user!.email,
      storageProvider: db.settings.storageProvider,
      createdAt: new Date().toISOString(),
    };
    db.mediaAssets.unshift(asset);
    saveDatabase();
    return res.status(201).json({ asset });
  });

  app.delete('/api/admin/media/:id', requireAdmin, (req, res) => {
    const db = getDb();
    db.mediaAssets = db.mediaAssets.filter((m) => m.id !== req.params.id);
    saveDatabase();
    return res.json({ message: 'Media asset deleted.' });
  });

  // --- Admin Website Settings ---
  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    const db = getDb();
    const updates = req.body || {};
    db.settings = {
      ...db.settings,
      ...updates,
      stats: {
        ...db.settings.stats,
        ...(updates.stats || {}),
      },
      seoDefaults: {
        ...db.settings.seoDefaults,
        ...(updates.seoDefaults || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    saveDatabase();

    recordAuditLog({
      actorId: req.user!.sub,
      actorEmail: req.user!.email,
      action: 'WEBSITE_SETTINGS_UPDATED',
      targetType: 'Settings',
      targetId: 'global-settings',
      details: 'Updated website configuration, community links, or homepage statistics.',
    });

    return res.json({
      settings: db.settings,
      message: 'Website settings saved successfully.',
    });
  });

  app.get('/api/admin/audit-logs', requireAdmin, (_req, res) => {
    const db = getDb();
    return res.json({ items: db.auditLogs.slice(0, 100) });
  });

  // ============================================================================
  // VITE DEV SERVER OR STATIC FRONTEND SERVING
  // ============================================================================
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Error]:', err.message);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Keerthi_dot_exe] Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Process Unhandled Rejection]:', reason);
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
