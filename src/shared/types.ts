export type UserRole = 'Admin' | 'User';
export type AccountStatus = 'Active' | 'Disabled' | 'Suspended';

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  avatarUrl?: string;
  bio?: string;
  emailVerified: boolean;
  notificationPreferences: {
    featuredBlogs: boolean;
    newPrompts: boolean;
    communityAnnouncements: boolean;
  };
  savedPromptIds?: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PublicationStatus = 'Draft' | 'Published' | 'Scheduled' | 'Archived';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  imageAlt: string;
  content: string; // Rich HTML / Structured blocks
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatarUrl: string;
    role: string;
  };
  seoTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  ogImage?: string;
  featured: boolean;
  status: PublicationStatus;
  publishAt: string;
  publishedAt?: string;
  wordCount: number;
  readingTimeMinutes: number;
  relatedPromptSlugs: string[];
  relatedBlogSlugs: string[];
  views: number;
  createdAt: string;
  updatedAt: string;
}

export const PRIMARY_PROMPT_FILTERS = [
  'All',
  'Business',
  'Art',
  'Coding',
  'Marketing',
] as const;

export const PROMPT_CATEGORIES = [
  'Business',
  'Art',
  'Coding',
  'Marketing',
  'WhatsApp Status',
  'Personal Profile Pictures',
  'Aesthetic Portraits',
  'Image Generation',
  'Video Generation',
  'Business Prompts',
  'Product Advertisements',
  'Food and Restaurant Marketing',
  'Festival Creatives',
  'Social Media',
  'Logo and Branding',
  'AI Tools and Tutorials',
  'Other',
] as const;

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export interface PromptItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  promptText: string;
  category: PromptCategory;
  tags: string[];
  language: string;
  previewImage: string;
  previewVideo?: string;
  recommendedModel: string;
  externalToolUrl?: string;
  usageInstructions: string;
  authorName: string;
  featured: boolean;
  status: 'Draft' | 'Published';
  copiesCount: number;
  likesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  type: 'blog' | 'prompt' | 'both';
  description: string;
  count: number;
}

export interface TagItem {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export type EnquiryStatus = 'New' | 'In Progress' | 'Replied' | 'Closed' | 'Archived';

export interface EnquiryStatusHistory {
  status: EnquiryStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
}

export interface EnquiryItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  serviceCategory: string;
  message: string;
  consentAccepted: boolean;
  status: EnquiryStatus;
  internalNotes: string[];
  replyHistory: {
    subject: string;
    message: string;
    repliedBy: string;
    repliedAt: string;
  }[];
  statusHistory: EnquiryStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'NEW_USER'
  | 'NEW_ENQUIRY'
  | 'NEW_COMMENT'
  | 'BLOG_PUBLISHED'
  | 'BLOG_PUBLISH_FAILURE'
  | 'SCHEDULED_PUBLISH_FAILURE'
  | 'INSTAGRAM_SYNC_ERROR'
  | 'SECURITY_EVENT'
  | 'FEATURED_BLOG'
  | 'NEW_PROMPT'
  | 'COMMUNITY_ANNOUNCEMENT';

export type CommentTargetType = 'blog' | 'prompt';

export interface CommentItem {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  targetSlug: string;
  parentId?: string | null;
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatarUrl?: string;
  content: string;
  rating?: number;
  likesUserIds: string[];
  likesCount: number;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  recipientRole: 'Admin' | 'User' | 'All';
  recipientUserId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: string;
}

export interface InstagramMediaItem {
  id: string;
  externalMediaId: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
  mediaUrl: string;
  thumbnailUrl: string;
  caption: string;
  permalink: string;
  timestamp: string;
  featured: boolean;
  visible: boolean;
  source: 'official_api' | 'approved_embed';
}

export interface InstagramIntegrationState {
  connected: boolean;
  mode: 'official_api' | 'fallback_embed';
  username: string;
  accountId?: string;
  accountType?: string;
  followersCount: string;
  lastSyncedAt?: string;
  lastSyncError?: string | null;
  mediaCount: number;
  hasNextPage: boolean;
  publicDisplayEnabled: boolean;
  oauthConfigured: boolean;
}

export interface WhatsAppGroupConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  membersLabel: string;
  ctaLabel: string;
  inviteUrl: string;
}

export interface ServiceItemConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  accentColor: 'purple' | 'blue' | 'orange' | 'cyan' | 'emerald' | 'pink';
  deliverables: string[];
}

export interface FeaturedCreationItem {
  id: string;
  title: string;
  category: string;
  mediaType: 'Image' | 'Video' | 'Template';
  previewUrl: string;
  toolUsed: string;
  promptSlug?: string;
  order: number;
}

export interface WebsiteSettings {
  siteName: string;
  tagline: string;
  shortDescription: string;
  logoUrl: string;
  faviconUrl: string;
  creatorName: string;
  creatorRole: string;
  creatorProfileImage: string;
  creatorAboutImage: string;
  creatorQuote: string;
  aboutHeading: string;
  aboutDescription: string;
  aboutHighlights: {
    title: string;
    subtitle: string;
    icon: string;
  }[];
  instagramUsername: string;
  instagramProfileUrl: string;
  youtubeUrl: string;
  xUrl: string;
  whatsappChannelUrl: string;
  contactEmail: string;
  contactLocation: string;
  stats: {
    instagramFollowers: string;
    promptLibraryCount: string;
    whatsappGroupsCount: string;
    contentFrequency: string;
  };
  whatsappGroups: WhatsAppGroupConfig[];
  services: ServiceItemConfig[];
  featuredCreations: FeaturedCreationItem[];
  seoDefaults: {
    defaultTitle: string;
    defaultDescription: string;
    ogImage: string;
  };
  emailConfigured: boolean;
  instagramConfigured: boolean;
  storageProvider: 'local' | 's3' | 'cloudinary';
  updatedAt: string;
}

export interface MediaAssetItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  altText: string;
  uploadedBy: string;
  storageProvider: 'local' | 's3' | 'cloudinary';
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: 'User' | 'BlogPost' | 'Prompt' | 'Enquiry' | 'Settings' | 'Instagram' | 'Auth' | 'Media' | 'Comment';
  targetId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AuthorSpotlightData {
  name: string;
  role: string;
  avatarUrl: string;
  bio: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  whatsappUrl?: string;
  totalPublishedPrompts: number;
  totalPublishedBlogs: number;
  otherPrompts: PromptItem[];
  otherBlogs: BlogPost[];
}

