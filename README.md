# Keerthi_dot_exe — Full-Stack AI Creator Community Platform

Production-ready full-stack web application for **Keerthi_dot_exe** (41K+ Instagram AI Creative Community), featuring a minimalist white glassmorphism public website, 13-category AI Prompt Library, rich-text Blog CMS with scheduled publishing, RBAC authentication, Enquiry management with CSV export, real-time notifications, and official Meta Instagram Graph API integration.

---

## 1. Local Setup & Running the Project

```bash
# 1. Install dependencies
npm install

# 2. Copy environment configuration
cp .env.example .env

# 3. (Optional) Seed or update the initial Admin account from environment variables
INITIAL_ADMIN_EMAIL="admin@keerthidotexe.com" \
INITIAL_ADMIN_PASSWORD="StrongAdminPassword2026!" \
INITIAL_ADMIN_NAME="Keerthi Admin" \
npm run seed:admin

# 4. Start full-stack server (Express API + Socket.IO + Vite React Frontend on port 3000)
npm run dev
```

### Running Automated Tests & Typecheck

```bash
# Run unit tests (Node native test runner)
npm test

# Run TypeScript compiler verification
npm run lint

# Build production bundle
npm run build
```

---

## 2. Database Architecture (MongoDB + Persistent Document Store)

- **Mongoose Schemas**: Defined in `server/models/schemas.ts` for all 12 domain collections (`User`, `BlogPost`, `Prompt`, `Category`, `Tag`, `Enquiry`, `Notification`, `WebsiteSettings`, `InstagramAccount`, `InstagramMedia`, `MediaAsset`, `AuditLog`).
- **Dual-Mode Persistence (`server/db/store.ts`)**:
  - When `MONGODB_URI` points to a running MongoDB instance (local `mongod` or MongoDB Atlas), the server connects via Mongoose.
  - When running in a container or preview environment without an external `mongod` daemon, the server automatically persists all collections to `.aistudio/mongodb-data.json` so all CRUD operations, enquiries, users, blogs, and prompts persist across server restarts out-of-the-box.

---

## 3. Official Meta Instagram Platform API Setup Guide

1. Go to [developers.facebook.com](https://developers.facebook.com/) and create a **Business / Creator** Meta App.
2. Add the **Instagram API with Instagram Login** product.
3. Configure the OAuth Redirect URI:
   ```
   http://localhost:3000/api/instagram/oauth/callback
   ```
4. Request permissions: `instagram_business_basic`.
5. Set the following in `.env`:
   ```env
   INSTAGRAM_APP_ID="your_meta_instagram_app_id"
   INSTAGRAM_APP_SECRET="your_meta_instagram_app_secret"
   INSTAGRAM_REDIRECT_URI="http://localhost:3000/api/instagram/oauth/callback"
   ```
6. Open `/admin?tab=instagram` and click **Connect Official OAuth** or **Sync Now**. Access tokens are encrypted server-side using AES-256-GCM (`TOKEN_ENCRYPTION_KEY`) and never exposed to the browser. When external Meta credentials are not configured yet, the platform operates cleanly in **Approved Embed Fallback Mode**.

---

## 4. SMTP & Media Storage Configuration

- **SMTP Email**: Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in `.env` to dispatch live emails on enquiry replies and password resets.
- **Media Storage**: Set `STORAGE_PROVIDER="local"` (default), `"cloudinary"`, or `"s3"` in `.env`. Uploads validate MIME types (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`) and enforce a 5MB size limit.

---

## 5. REST API Reference

- `GET /api/health` — Server & database health status
- `GET /sitemap.xml` & `GET /robots.txt` — Dynamic SEO sitemap & crawler rules
- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/profile`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` — Time-limited single-use password reset flow
- `GET /api/public/home` — Homepage settings, counts, featured prompts, latest blogs, Instagram feed
- `GET /api/public/blogs`, `GET /api/public/blogs/:slug` — Public blog listing & article reader
- `GET /api/public/prompts`, `GET /api/public/prompts/:slug`, `POST /api/public/prompts/:id/copy` — AI Prompt Library
- `POST /api/public/enquiries` — Validated rate-limited contact enquiry submission
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/mark-all-read`
- `GET /api/admin/summary`, `/api/admin/users`, `/api/admin/blogs`, `/api/admin/prompts`, `/api/admin/taxonomy`, `/api/admin/enquiries`, `/api/admin/enquiries/export/csv`, `/api/admin/instagram`, `/api/admin/media`, `/api/admin/settings`, `/api/admin/audit-logs` (Protected by `requireAdmin` RBAC middleware)
