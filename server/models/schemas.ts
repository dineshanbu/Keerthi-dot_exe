import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['Admin', 'User'], default: 'User', index: true },
    status: { type: String, enum: ['Active', 'Disabled', 'Suspended'], default: 'Active', index: true },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    emailVerified: { type: Boolean, default: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
    notificationPreferences: {
      featuredBlogs: { type: Boolean, default: true },
      newPrompts: { type: Boolean, default: true },
      communityAnnouncements: { type: Boolean, default: true },
    },
    savedPromptIds: [{ type: String, index: true }],
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

const BlogPostSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: 'text' },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    previousSlugs: [{ type: String, index: true }],
    excerpt: { type: String, required: true },
    featuredImage: { type: String, required: true },
    imageAlt: { type: String, default: '' },
    content: { type: String, required: true },
    category: { type: String, required: true, index: true },
    tags: [{ type: String, index: true }],
    author: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      avatarUrl: { type: String, default: '/assets/media/keerthi-avatar.png' },
      role: { type: String, default: 'AI Creator & Founder' },
    },
    seoTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    featured: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Scheduled', 'Archived'],
      default: 'Draft',
      index: true,
    },
    publishAt: { type: Date, index: true },
    publishedAt: { type: Date },
    wordCount: { type: Number, default: 0 },
    readingTimeMinutes: { type: Number, default: 1 },
    relatedPromptSlugs: [{ type: String }],
    relatedBlogSlugs: [{ type: String }],
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const PromptSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, index: 'text' },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    shortDescription: { type: String, required: true },
    promptText: { type: String, required: true },
    category: { type: String, required: true, index: true },
    tags: [{ type: String, index: true }],
    language: { type: String, default: 'English', index: true },
    previewImage: { type: String, required: true },
    previewVideo: { type: String, default: '' },
    recommendedModel: { type: String, required: true },
    externalToolUrl: { type: String, default: '' },
    usageInstructions: { type: String, default: '' },
    authorName: { type: String, default: 'Keerthi_dot_exe' },
    featured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['Draft', 'Published'], default: 'Published', index: true },
    copiesCount: { type: Number, default: 0 },
    likesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: { type: String, enum: ['blog', 'prompt', 'both'], default: 'both' },
    description: { type: String, default: '' },
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const TagSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const EnquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: '' },
    subject: { type: String, required: true, trim: true, index: true },
    serviceCategory: { type: String, required: true, index: true },
    message: { type: String, required: true },
    consentAccepted: { type: Boolean, required: true },
    status: {
      type: String,
      enum: ['New', 'In Progress', 'Replied', 'Closed', 'Archived'],
      default: 'New',
      index: true,
    },
    internalNotes: [{ type: String }],
    replyHistory: [
      {
        subject: { type: String },
        message: { type: String },
        repliedBy: { type: String },
        repliedAt: { type: Date, default: Date.now },
      },
    ],
    statusHistory: [
      {
        status: { type: String },
        changedBy: { type: String },
        changedAt: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const NotificationSchema = new Schema(
  {
    recipientRole: { type: String, enum: ['Admin', 'User', 'All'], default: 'Admin', index: true },
    recipientUserId: { type: String, index: true },
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '/admin' },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

const WebsiteSettingsSchema = new Schema(
  {
    siteName: { type: String, default: 'Keerthi_dot_exe' },
    tagline: { type: String, default: 'AI Creative Community' },
    shortDescription: { type: String },
    logoUrl: { type: String },
    faviconUrl: { type: String },
    creatorName: { type: String, default: 'Keerthi' },
    creatorRole: { type: String, default: 'AI Creator & Visual Storyteller' },
    creatorProfileImage: { type: String },
    creatorAboutImage: { type: String },
    creatorQuote: { type: String },
    aboutHeading: { type: String },
    aboutDescription: { type: String },
    aboutHighlights: [{ title: String, subtitle: String, icon: String }],
    instagramUsername: { type: String, default: 'keerthi_dot_exe' },
    instagramProfileUrl: { type: String, default: 'https://instagram.com/keerthi_dot_exe' },
    youtubeUrl: { type: String },
    xUrl: { type: String },
    whatsappChannelUrl: { type: String },
    contactEmail: { type: String },
    contactLocation: { type: String },
    stats: {
      instagramFollowers: String,
      promptLibraryCount: String,
      whatsappGroupsCount: String,
      contentFrequency: String,
    },
    whatsappGroups: [
      {
        id: String,
        name: String,
        description: String,
        icon: String,
        membersLabel: String,
        ctaLabel: String,
        inviteUrl: String,
      },
    ],
    services: [
      {
        id: String,
        title: String,
        description: String,
        icon: String,
        accentColor: String,
        deliverables: [String],
      },
    ],
    featuredCreations: [
      {
        id: String,
        title: String,
        category: String,
        mediaType: String,
        previewUrl: String,
        toolUsed: String,
        promptSlug: String,
        order: Number,
      },
    ],
    seoDefaults: {
      defaultTitle: String,
      defaultDescription: String,
      ogImage: String,
    },
  },
  { timestamps: true }
);

const InstagramAccountSchema = new Schema(
  {
    username: { type: String, required: true },
    accountId: { type: String, required: true, unique: true },
    accountType: { type: String, default: 'MEDIA_CREATOR' },
    encryptedAccessToken: { type: String, required: true, select: false },
    tokenExpiresAt: { type: Date },
    connected: { type: Boolean, default: true },
    publicDisplayEnabled: { type: Boolean, default: true },
    lastSyncedAt: { type: Date },
    lastSyncError: { type: String, default: null },
  },
  { timestamps: true }
);

const InstagramMediaSchema = new Schema(
  {
    externalMediaId: { type: String, required: true, unique: true, index: true },
    mediaType: { type: String, enum: ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REELS'], default: 'IMAGE' },
    mediaUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    caption: { type: String, default: '' },
    permalink: { type: String, required: true },
    timestamp: { type: Date, required: true, index: true },
    featured: { type: Boolean, default: false, index: true },
    visible: { type: Boolean, default: true, index: true },
    source: { type: String, enum: ['official_api', 'approved_embed'], default: 'approved_embed' },
  },
  { timestamps: true }
);

const MediaAssetSchema = new Schema(
  {
    filename: { type: String, required: true, unique: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    url: { type: String, required: true },
    altText: { type: String, default: '' },
    uploadedBy: { type: String, required: true },
    storageProvider: { type: String, enum: ['local', 's3', 'cloudinary'], default: 'local' },
  },
  { timestamps: true }
);

const AuditLogSchema = new Schema(
  {
    actorId: { type: String, required: true, index: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, required: true, index: true },
    targetId: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const Models = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  BlogPost: mongoose.models.BlogPost || mongoose.model('BlogPost', BlogPostSchema),
  Prompt: mongoose.models.Prompt || mongoose.model('Prompt', PromptSchema),
  Category: mongoose.models.Category || mongoose.model('Category', CategorySchema),
  Tag: mongoose.models.Tag || mongoose.model('Tag', TagSchema),
  Enquiry: mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema),
  Notification: mongoose.models.Notification || mongoose.model('Notification', NotificationSchema),
  WebsiteSettings: mongoose.models.WebsiteSettings || mongoose.model('WebsiteSettings', WebsiteSettingsSchema),
  InstagramAccount: mongoose.models.InstagramAccount || mongoose.model('InstagramAccount', InstagramAccountSchema),
  InstagramMedia: mongoose.models.InstagramMedia || mongoose.model('InstagramMedia', InstagramMediaSchema),
  MediaAsset: mongoose.models.MediaAsset || mongoose.model('MediaAsset', MediaAssetSchema),
  AuditLog: mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema),
};
