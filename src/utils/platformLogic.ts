/**
 * Pure domain logic for Keerthi_dot_exe:
 * - Slug generation & validation
 * - Word count & reading time estimation
 * - Table of Contents extraction from HTML
 * - Safe URL validation & rich-text HTML sanitization
 * - Password strength & enquiry validation helpers
 */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 100;
}

export function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateReadingMetrics(content: string): {
  wordCount: number;
  readingTimeMinutes: number;
} {
  const plain = stripHtmlTags(content);
  if (!plain) {
    return { wordCount: 0, readingTimeMinutes: 1 };
  }
  const words = plain.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
  return { wordCount, readingTimeMinutes };
}

export interface TocHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

export function extractTableOfContents(html: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const regex = /<h([1-3])(?:\s+[^>]*)?>([\s\S]*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  const seenIds = new Set<string>();

  while ((match = regex.exec(html)) !== null) {
    const level = Number(match[1]) as 1 | 2 | 3;
    const rawText = stripHtmlTags(match[2]);
    if (!rawText) continue;
    let id = slugify(rawText) || `section-${headings.length + 1}`;
    if (seenIds.has(id)) {
      id = `${id}-${headings.length + 1}`;
    }
    seenIds.add(id);
    headings.push({ id, text: rawText, level });
  }
  return headings;
}

export function injectHeadingIds(html: string): string {
  let index = 0;
  const seenIds = new Set<string>();
  return html.replace(/<h([1-3])(\s+[^>]*)?>([\s\S]*?)<\/h\1>/gi, (_full, level, attrs = '', inner) => {
    index += 1;
    const rawText = stripHtmlTags(inner);
    let id = slugify(rawText) || `section-${index}`;
    if (seenIds.has(id)) {
      id = `${id}-${index}`;
    }
    seenIds.add(id);
    if (/id=["'][^"']+["']/i.test(attrs)) {
      return `<h${level}${attrs}>${inner}</h${level}>`;
    }
    return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
  });
}

export function sanitizeRichHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>/gi, '')
    .replace(/<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:');
}

export function isValidSafeExternalUrl(url: string): boolean {
  if (!url) return true;
  if (url.startsWith('/')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  message?: string;
} {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number.' };
  }
  return { valid: true };
}

export function deduplicateInstagramMedia<T extends { externalMediaId: string; timestamp: string }>(
  existing: T[],
  incoming: T[]
): { merged: T[]; addedCount: number; updatedCount: number } {
  const map = new Map<string, T>();
  for (const item of existing) {
    map.set(item.externalMediaId, item);
  }
  let addedCount = 0;
  let updatedCount = 0;
  for (const item of incoming) {
    if (map.has(item.externalMediaId)) {
      const current = map.get(item.externalMediaId)!;
      map.set(item.externalMediaId, { ...current, ...item });
      updatedCount += 1;
    } else {
      map.set(item.externalMediaId, item);
      addedCount += 1;
    }
  }
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return { merged, addedCount, updatedCount };
}

export interface SearchablePrompt {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  promptText: string;
  category: string;
  recommendedModel: string;
  tags: string[];
  previewImage: string;
  status: string;
}

export interface SearchableBlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  featuredImage: string;
  readingTimeMinutes: number;
  status: string;
}

export function matchesBlogCategory(
  blog: { category: string; tags?: string[] },
  selectedCategory: string
): boolean {
  const target = (selectedCategory || '').trim().toLowerCase();
  if (!target || target === 'all') return true;

  const itemCat = blog.category.trim().toLowerCase();
  if (itemCat === target || itemCat.includes(target) || target.includes(itemCat)) return true;

  const mappedCategories = BROAD_CATEGORY_MAP[target];
  if (mappedCategories && mappedCategories.some((c) => itemCat.includes(c) || c.includes(itemCat))) {
    return true;
  }

  if (blog.tags && blog.tags.some((t) => t.trim().toLowerCase().includes(target))) {
    return true;
  }

  return false;
}

export function searchContentByKeyword<
  P extends SearchablePrompt,
  B extends SearchableBlog
>(
  rawQuery: string,
  prompts: P[],
  blogs: B[],
  limit = 6,
  categoryFilter = 'All'
): { prompts: P[]; blogs: B[]; matchedCategories: string[]; totalMatches: number } {
  const q = rawQuery.toLowerCase().trim();
  const normalizedCategory = (categoryFilter || 'All').trim();
  const hasCategoryFilter =
    normalizedCategory !== '' && normalizedCategory.toLowerCase() !== 'all';

  if (!q && !hasCategoryFilter) {
    return { prompts: [], blogs: [], matchedCategories: [], totalMatches: 0 };
  }

  if (!q && hasCategoryFilter) {
    const filteredPrompts = prompts.filter(
      (p) => p.status === 'Published' && matchesPromptCategory(p, normalizedCategory)
    );
    const filteredBlogs = blogs.filter(
      (b) => b.status === 'Published' && matchesBlogCategory(b, normalizedCategory)
    );
    const matchedCategories = Array.from(
      new Set([
        ...filteredPrompts.map((p) => p.category),
        ...filteredBlogs.map((b) => b.category),
      ])
    );
    return {
      prompts: filteredPrompts.slice(0, limit),
      blogs: filteredBlogs.slice(0, limit),
      matchedCategories,
      totalMatches: filteredPrompts.length + filteredBlogs.length,
    };
  }

  const tokens = q.split(/\s+/).filter(Boolean);

  const scorePrompt = (p: P): number => {
    if (p.status !== 'Published') return 0;
    if (hasCategoryFilter && !matchesPromptCategory(p, normalizedCategory)) return 0;

    const title = p.title.toLowerCase();
    const desc = p.shortDescription.toLowerCase();
    const body = p.promptText.toLowerCase();
    const cat = p.category.toLowerCase();
    const model = p.recommendedModel.toLowerCase();
    const tags = p.tags.map((t) => t.toLowerCase()).join(' ');

    let score = 0;
    if (title === q || title.startsWith(q)) score += 6;
    if (cat === q || matchesPromptCategory(p, q)) score += 5;

    for (const token of tokens) {
      let tokenMatched = false;
      if (title.includes(token)) {
        score += 12;
        tokenMatched = true;
      }
      if (cat.includes(token) || matchesPromptCategory(p, token)) {
        score += 9;
        tokenMatched = true;
      }
      if (tags.includes(token)) {
        score += 6;
        tokenMatched = true;
      }
      if (model.includes(token)) {
        score += 5;
        tokenMatched = true;
      }
      if (desc.includes(token)) {
        score += 4;
        tokenMatched = true;
      }
      if (body.includes(token)) {
        score += 2;
        tokenMatched = true;
      }
      if (!tokenMatched) return 0;
    }
    return score;
  };

  const scoreBlog = (b: B): number => {
    if (b.status !== 'Published') return 0;
    if (hasCategoryFilter && !matchesBlogCategory(b, normalizedCategory)) return 0;

    const title = b.title.toLowerCase();
    const excerpt = b.excerpt.toLowerCase();
    const content = stripHtmlTags(b.content).toLowerCase();
    const cat = b.category.toLowerCase();
    const tags = b.tags.map((t) => t.toLowerCase()).join(' ');

    let score = 0;
    if (title === q || title.startsWith(q)) score += 6;
    if (cat === q || matchesBlogCategory(b, q)) score += 5;

    for (const token of tokens) {
      let tokenMatched = false;
      if (title.includes(token)) {
        score += 12;
        tokenMatched = true;
      }
      if (cat.includes(token) || matchesBlogCategory(b, token)) {
        score += 9;
        tokenMatched = true;
      }
      if (tags.includes(token)) {
        score += 6;
        tokenMatched = true;
      }
      if (excerpt.includes(token)) {
        score += 4;
        tokenMatched = true;
      }
      if (content.includes(token)) {
        score += 2;
        tokenMatched = true;
      }
      if (!tokenMatched) return 0;
    }
    return score;
  };

  const matchedPrompts = prompts
    .map((item) => ({ item, score: scorePrompt(item) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);

  const matchedBlogs = blogs
    .map((item) => ({ item, score: scoreBlog(item) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);

  const matchedCategories = Array.from(
    new Set([
      ...matchedPrompts.map((p) => p.category),
      ...matchedBlogs.map((b) => b.category),
    ])
  );

  return {
    prompts: matchedPrompts.slice(0, limit),
    blogs: matchedBlogs.slice(0, limit),
    matchedCategories,
    totalMatches: matchedPrompts.length + matchedBlogs.length,
  };
}

const BROAD_CATEGORY_MAP: Record<string, string[]> = {
  business: ['business', 'business prompts', 'logo and branding'],
  art: [
    'art',
    'aesthetic portraits',
    'image generation',
    'personal profile pictures',
    'video generation',
  ],
  coding: ['coding', 'ai tools and tutorials'],
  marketing: [
    'marketing',
    'product advertisements',
    'food and restaurant marketing',
    'social media',
    'festival creatives',
    'whatsapp status',
  ],
};

export function matchesPromptCategory(
  prompt: { category: string; tags?: string[] },
  selectedCategory: string
): boolean {
  const target = (selectedCategory || '').trim().toLowerCase();
  if (!target || target === 'all') return true;

  const itemCat = prompt.category.trim().toLowerCase();
  if (itemCat === target) return true;

  const mappedCategories = BROAD_CATEGORY_MAP[target];
  if (mappedCategories && mappedCategories.includes(itemCat)) {
    return true;
  }

  if (prompt.tags && prompt.tags.some((t) => t.trim().toLowerCase() === target)) {
    return true;
  }

  return false;
}

export function sortPromptsList<
  T extends { title: string; category: string; copiesCount: number; createdAt: string }
>(items: T[], sortBy: 'popular' | 'newest' | 'alphabetical' | 'category' | string): T[] {
  const copy = [...items];
  if (sortBy === 'newest') {
    return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  if (sortBy === 'alphabetical') {
    return copy.sort((a, b) => a.title.localeCompare(b.title));
  }
  if (sortBy === 'category') {
    return copy.sort(
      (a, b) => a.category.localeCompare(b.category) || b.copiesCount - a.copiesCount
    );
  }
  return copy.sort((a, b) => b.copiesCount - a.copiesCount);
}

export function toggleSavedPromptId(
  currentSavedIds: string[],
  promptId: string
): { savedIds: string[]; isSaved: boolean } {
  const normalizedId = promptId.trim();
  if (!normalizedId) {
    return { savedIds: [...currentSavedIds], isSaved: false };
  }
  const unique = Array.from(new Set(currentSavedIds));
  if (unique.includes(normalizedId)) {
    return {
      savedIds: unique.filter((id) => id !== normalizedId),
      isSaved: false,
    };
  }
  return {
    savedIds: [normalizedId, ...unique],
    isSaved: true,
  };
}

export function filterSavedPrompts<T extends { id: string }>(
  prompts: T[],
  savedIds: string[]
): T[] {
  const idSet = new Set(savedIds);
  return prompts.filter((p) => idSet.has(p.id));
}

export function buildAuthorContentPortfolio<
  P extends { id: string; authorName: string; status: string },
  B extends { id: string; author: { name: string }; status: string }
>(params: {
  authorName: string;
  currentPromptId?: string;
  currentBlogId?: string;
  prompts: P[];
  blogs: B[];
  limit?: number;
}): {
  otherPrompts: P[];
  otherBlogs: B[];
  totalPublishedPrompts: number;
  totalPublishedBlogs: number;
} {
  const { authorName, currentPromptId, currentBlogId, prompts, blogs, limit = 3 } = params;
  const normalizedTarget = authorName.toLowerCase().trim();

  const matchesAuthor = (candidateName: string): boolean => {
    const c = candidateName.toLowerCase().trim();
    if (!normalizedTarget || !c) return true;
    return (
      c === normalizedTarget ||
      c.includes(normalizedTarget) ||
      normalizedTarget.includes(c) ||
      (c.includes('keerthi') && normalizedTarget.includes('keerthi'))
    );
  };

  const authorPrompts = prompts.filter(
    (p) => p.status === 'Published' && matchesAuthor(p.authorName)
  );
  const authorBlogs = blogs.filter(
    (b) => b.status === 'Published' && matchesAuthor(b.author?.name || '')
  );

  return {
    otherPrompts: authorPrompts.filter((p) => p.id !== currentPromptId).slice(0, limit),
    otherBlogs: authorBlogs.filter((b) => b.id !== currentBlogId).slice(0, limit),
    totalPublishedPrompts: authorPrompts.length,
    totalPublishedBlogs: authorBlogs.length,
  };
}




