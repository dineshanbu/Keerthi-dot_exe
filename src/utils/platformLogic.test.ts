import test from 'node:test';
import assert from 'node:assert/strict';
import {
  slugify,
  isValidSlug,
  calculateReadingMetrics,
  extractTableOfContents,
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
} from './platformLogic.ts';

test('buildAuthorContentPortfolio aggregates other published prompts and blogs by the same author', () => {
  const prompts = [
    { id: 'p1', authorName: 'Keerthi_dot_exe', status: 'Published' },
    { id: 'p2', authorName: 'Keerthi_dot_exe', status: 'Published' },
    { id: 'p3', authorName: 'Keerthi_dot_exe', status: 'Draft' },
  ];
  const blogs = [
    { id: 'b1', author: { name: 'Keerthi' }, status: 'Published' },
    { id: 'b2', author: { name: 'Keerthi_dot_exe' }, status: 'Published' },
  ];

  const portfolio = buildAuthorContentPortfolio({
    authorName: 'Keerthi_dot_exe',
    currentPromptId: 'p1',
    prompts,
    blogs,
    limit: 3,
  });

  assert.equal(portfolio.totalPublishedPrompts, 2);
  assert.equal(portfolio.totalPublishedBlogs, 2);
  assert.equal(portfolio.otherPrompts.length, 1);
  assert.equal(portfolio.otherPrompts[0].id, 'p2');
  assert.equal(portfolio.otherBlogs.length, 2);
});

test('toggleSavedPromptId and filterSavedPrompts manage personal prompt library state accurately', () => {
  const initial: string[] = [];
  const afterSave = toggleSavedPromptId(initial, 'prm-1');
  assert.equal(afterSave.isSaved, true);
  assert.deepEqual(afterSave.savedIds, ['prm-1']);

  const afterSecondSave = toggleSavedPromptId(afterSave.savedIds, 'prm-2');
  assert.equal(afterSecondSave.isSaved, true);
  assert.deepEqual(afterSecondSave.savedIds, ['prm-2', 'prm-1']);

  const filtered = filterSavedPrompts(
    [{ id: 'prm-1' }, { id: 'prm-2' }, { id: 'prm-3' }],
    afterSecondSave.savedIds
  );
  assert.equal(filtered.length, 2);

  const afterUnsave = toggleSavedPromptId(afterSecondSave.savedIds, 'prm-1');
  assert.equal(afterUnsave.isSaved, false);
  assert.deepEqual(afterUnsave.savedIds, ['prm-2']);
});

test('matchesPromptCategory and sortPromptsList filter and sort prompts across Business, Art, Coding, and Marketing', () => {
  const sample = [
    {
      title: 'Full-Stack React & TypeScript Clean Architecture Prompt',
      category: 'Coding',
      tags: ['Coding', 'TypeScript'],
      copiesCount: 950,
      createdAt: '2026-10-18T10:00:00Z',
    },
    {
      title: 'Aesthetic Glass Portrait',
      category: 'Aesthetic Portraits',
      tags: ['Portrait'],
      copiesCount: 1400,
      createdAt: '2026-10-12T10:00:00Z',
    },
    {
      title: 'B2B Executive Brand Pitch Deck System',
      category: 'Business Prompts',
      tags: ['B2B', 'Pitch'],
      copiesCount: 620,
      createdAt: '2026-10-15T10:00:00Z',
    },
    {
      title: 'D2C Product Launch Ad Creative',
      category: 'Product Advertisements',
      tags: ['Ads'],
      copiesCount: 1120,
      createdAt: '2026-10-16T10:00:00Z',
    },
  ];

  assert.equal(sample.filter((p) => matchesPromptCategory(p, 'Coding')).length, 1);
  assert.equal(sample.filter((p) => matchesPromptCategory(p, 'Art')).length, 1);
  assert.equal(sample.filter((p) => matchesPromptCategory(p, 'Business')).length, 1);
  assert.equal(sample.filter((p) => matchesPromptCategory(p, 'Marketing')).length, 1);
  assert.equal(sample.filter((p) => matchesPromptCategory(p, 'All')).length, 4);

  const byPopular = sortPromptsList(sample, 'popular');
  assert.equal(byPopular[0].title, 'Aesthetic Glass Portrait');

  const byAlpha = sortPromptsList(sample, 'alphabetical');
  assert.equal(byAlpha[0].title, 'Aesthetic Glass Portrait');
  assert.equal(byAlpha[1].title, 'B2B Executive Brand Pitch Deck System');
});

test('searchContentByKeyword finds and ranks matching published prompts and blogs by title or category', () => {
  const samplePrompts = [
    {
      id: 'p1',
      title: 'Viral Golden Hour WhatsApp Status Quote',
      slug: 'viral-whatsapp-status',
      shortDescription: 'Vertical 9:16 sunset status prompt',
      promptText: 'Golden hour cliff --ar 9:16',
      category: 'WhatsApp Status',
      recommendedModel: 'Ideogram 2.0',
      tags: ['WhatsApp', 'Status'],
      previewImage: '/assets/media/blog-whatsapp-status.png',
      status: 'Published',
    },
    {
      id: 'p2',
      title: 'Draft ComfyUI Workflow',
      slug: 'draft-comfyui',
      shortDescription: 'Unpublished draft',
      promptText: 'WhatsApp test',
      category: 'Other',
      recommendedModel: 'ComfyUI',
      tags: [],
      previewImage: '/assets/media/blog-comfyui-guide.png',
      status: 'Draft',
    },
    {
      id: 'p3',
      title: 'Luxury Minimalist Brand Identity',
      slug: 'luxury-minimalist-brand',
      shortDescription: 'Executive corporate logo prompt',
      promptText: 'Minimalist monogram emblem',
      category: 'Business Prompts',
      recommendedModel: 'Midjourney v6',
      tags: ['Branding', 'Logo'],
      previewImage: '/assets/media/blog-poster-design.png',
      status: 'Published',
    },
  ];
  const sampleBlogs = [
    {
      id: 'b1',
      title: 'How to Create Viral WhatsApp Status with AI',
      slug: 'how-to-create-viral-whatsapp-status-with-ai',
      excerpt: 'Step-by-step workflow for 9:16 status designs',
      content: '<h2>WhatsApp Status Guide</h2><p>Use Ideogram 2.0.</p>',
      category: 'Tutorial',
      tags: ['WhatsApp Status', 'Tutorial'],
      featuredImage: '/assets/media/blog-whatsapp-status.png',
      readingTimeMinutes: 2,
      status: 'Published',
    },
    {
      id: 'b2',
      title: 'AI Poster Design for Small Business Owners',
      slug: 'ai-poster-design-for-small-business-owners',
      excerpt: 'High-converting posters for local businesses',
      content: '<h2>Business Marketing</h2><p>Design posters fast.</p>',
      category: 'Business',
      tags: ['Business', 'Poster Design'],
      featuredImage: '/assets/media/blog-poster-design.png',
      readingTimeMinutes: 3,
      status: 'Published',
    },
  ];

  // Search by title keyword
  const results = searchContentByKeyword('whatsapp', samplePrompts, sampleBlogs);
  assert.equal(results.prompts.length, 1);
  assert.equal(results.blogs.length, 1);
  assert.equal(results.totalMatches, 2);
  assert.equal(results.prompts[0].slug, 'viral-whatsapp-status');
  assert.equal(results.blogs[0].slug, 'how-to-create-viral-whatsapp-status-with-ai');

  // Search by category keyword ("Business") matches both "Business Prompts" prompt and "Business" blog
  const byCategoryKeyword = searchContentByKeyword('Business', samplePrompts, sampleBlogs);
  assert.equal(byCategoryKeyword.prompts.length, 1);
  assert.equal(byCategoryKeyword.prompts[0].slug, 'luxury-minimalist-brand');
  assert.equal(byCategoryKeyword.blogs.length, 1);
  assert.equal(byCategoryKeyword.blogs[0].slug, 'ai-poster-design-for-small-business-owners');

  // Filter by category pill ("Tutorial") with empty query
  const byCategoryFilter = searchContentByKeyword('', samplePrompts, sampleBlogs, 6, 'Tutorial');
  assert.equal(byCategoryFilter.blogs.length, 1);
  assert.equal(byCategoryFilter.blogs[0].category, 'Tutorial');
  assert.equal(matchesBlogCategory(sampleBlogs[0], 'Tutorial'), true);
});

test('slugify and isValidSlug handle titles and special characters cleanly', () => {
  assert.equal(slugify('Top 10 Free AI Image Generators in 2026!'), 'top-10-free-ai-image-generators-in-2026');
  assert.equal(slugify("Keerthi's Prompt Guide & Tips"), 'keerthis-prompt-guide-tips');
  assert.equal(isValidSlug('top-10-free-ai-image-generators-in-2026'), true);
  assert.equal(isValidSlug('Invalid Slug!'), false);
});

test('calculateReadingMetrics computes accurate word count and reading time', () => {
  const html = '<h2>Introduction</h2><p>This is a simple test paragraph with ten words total.</p>';
  const metrics = calculateReadingMetrics(html);
  assert.equal(metrics.wordCount, 11);
  assert.equal(metrics.readingTimeMinutes, 1);
});

test('extractTableOfContents parses H1-H3 headings and assigns unique ids', () => {
  const html = '<h2>Getting Started</h2><p>Text</p><h3>Prompt Structure</h3><h2>Getting Started</h2>';
  const toc = extractTableOfContents(html);
  assert.equal(toc.length, 3);
  assert.equal(toc[0].id, 'getting-started');
  assert.equal(toc[1].id, 'prompt-structure');
  assert.equal(toc[1].level, 3);
  assert.equal(toc[2].id, 'getting-started-3');
});

test('sanitizeRichHtml removes script tags, event handlers, and javascript: URIs', () => {
  const dirty = '<p onclick="evil()">Hello</p><script>alert(1)</script><a href="javascript:alert(2)">Click</a>';
  const clean = sanitizeRichHtml(dirty);
  assert.equal(clean.includes('<script>'), false);
  assert.equal(clean.includes('onclick='), false);
  assert.equal(clean.includes('javascript:'), false);
  assert.equal(clean.includes('<p>Hello</p>'), true);
});

test('isValidSafeExternalUrl accepts http/https and relative paths and rejects unsafe schemes', () => {
  assert.equal(isValidSafeExternalUrl('https://instagram.com/keerthi_dot_exe'), true);
  assert.equal(isValidSafeExternalUrl('/assets/media/keerthi-hero.png'), true);
  assert.equal(isValidSafeExternalUrl('javascript:alert(1)'), false);
  assert.equal(isValidSafeExternalUrl('data:text/html,<script>alert(1)</script>'), false);
});

test('validatePasswordStrength enforces complexity rules', () => {
  assert.equal(validatePasswordStrength('short1A').valid, false);
  assert.equal(validatePasswordStrength('alllowercase123').valid, false);
  assert.equal(validatePasswordStrength('StrongPass2026').valid, true);
});

test('deduplicateInstagramMedia performs incremental sync without duplicates', () => {
  const existing = [
    { externalMediaId: 'ig_101', timestamp: '2026-10-10T10:00:00Z', caption: 'Old caption' },
    { externalMediaId: 'ig_102', timestamp: '2026-10-12T10:00:00Z', caption: 'Post 2' },
  ];
  const incoming = [
    { externalMediaId: 'ig_102', timestamp: '2026-10-12T10:00:00Z', caption: 'Post 2 updated' },
    { externalMediaId: 'ig_103', timestamp: '2026-10-15T10:00:00Z', caption: 'New Reel' },
  ];
  const res = deduplicateInstagramMedia(existing, incoming);
  assert.equal(res.merged.length, 3);
  assert.equal(res.addedCount, 1);
  assert.equal(res.updatedCount, 1);
  assert.equal(res.merged[0].externalMediaId, 'ig_103');
  assert.equal(res.merged.find((m) => m.externalMediaId === 'ig_102')?.caption, 'Post 2 updated');
});
