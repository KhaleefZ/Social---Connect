# SocialConnect

SocialConnect is a Next.js technical assessment project for a social media experience with JWT authentication, profiles, posts, comments, likes, follow graph, personalized feed, direct messages, and Supabase-backed media uploads.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase Postgres + Supabase Storage
- JWT-based auth (`jose`) and password hashing (`bcryptjs`)
- Zod validation

## Features Implemented

- Authentication: register, login (email or username), logout, token revocation
- Profile system: view own/public profile, edit own profile, upload avatar
- Posts: create, list, view single post, update own post, delete own post (soft delete)
- Interactions: like/unlike, add/list/delete own comments
- Personalized feed: chronological feed from self + followed users
- Follow graph: follow/unfollow, followers, following
- Messaging: conversation list and direct messages with connected users
- Uploads: avatar upload and post media upload to Supabase Storage

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Fill all required values in `.env.local`.

4. Apply SQL migrations in this order using Supabase SQL editor:
	- `supabase/migrations/0001_initial.sql`
	- `supabase/migrations/0002_fix_missing_media_columns.sql`
	- `supabase/migrations/0003_messages.sql`
	- `supabase/migrations/0004_seed_sample_data.sql` (optional demo data)

5. Ensure storage bucket exists and matches `SUPABASE_STORAGE_BUCKET`.

6. Run development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Environment Variables

Required:

- `NEXT_PUBLIC_APP_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `SUPABASE_STORAGE_BUCKET`

Optional (email flow):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Optional (not required by runtime logic in this project):

- `DATABASE_URL`

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint source
- `npm run typecheck` - TypeScript check

## App Routes

- `/` - landing/auth page (login + register tabs)
- `/feed` - personalized feed + create post
- `/me` - own profile and profile editor
- `/search` - user discovery and follow actions
- `/messages` - direct messages
- `/posts/:postId` - post details
- `/users/:userId` - public profile

## API Endpoints

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

Users and social graph:

- `GET /api/users`
- `GET /api/users/:userId`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/users/:userId/follow`
- `DELETE /api/users/:userId/follow`
- `GET /api/users/:userId/followers`
- `GET /api/users/:userId/following`

Posts and interactions:

- `GET /api/posts`
- `POST /api/posts`
- `GET /api/posts/:postId`
- `PATCH /api/posts/:postId`
- `DELETE /api/posts/:postId`
- `POST /api/posts/:postId/like`
- `DELETE /api/posts/:postId/like`
- `GET /api/posts/:postId/comments`
- `POST /api/posts/:postId/comments`
- `DELETE /api/posts/:postId/comments/:commentId`

Feed, uploads, messaging, and utility:

- `GET /api/feed`
- `POST /api/uploads/avatar`
- `POST /api/uploads/post-image`
- `POST /api/uploads/post-media`
- `GET /api/messages/contacts`
- `GET /api/messages/with/:userId`
- `POST /api/messages/with/:userId`
- `GET /api/notifications`
- `GET /api/health`

## Deployment (Vercel)

1. Import repository into Vercel.
2. Add environment variables from this README.
3. Deploy.
4. Set `NEXT_PUBLIC_APP_URL` to deployed URL and redeploy.
5. Verify Supabase storage bucket and DB migrations are applied.

## Reviewer Quick Check

Run the following in a clean environment:

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

Expected result: all commands pass and app builds successfully.