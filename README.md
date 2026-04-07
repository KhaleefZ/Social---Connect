# SocialConnect

SocialConnect is a Next.js technical assessment project for a social feed experience with JWT auth, profiles, posts, likes, comments, follow graph, personalized feed, and Supabase-backed storage.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Postgres and Storage
- Custom JWT authentication

## Setup

1. Copy `.env.example` to `.env.local` and fill in the required values.
2. Install dependencies with `npm install`.
3. Apply the SQL schema in `supabase/migrations/0001_initial.sql` to your Supabase Postgres database.
4. Create a storage bucket matching `SUPABASE_STORAGE_BUCKET` and allow uploads.
5. Run the app with `npm run dev`.

## Environment Variables

Required values:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `SUPABASE_STORAGE_BUCKET`

Note: If your database password contains special characters such as `@`, URL-encode it in `DATABASE_URL`.

## Implemented API Endpoints

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

Users and profiles:

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

Feed and uploads:

- `GET /api/feed`
- `POST /api/uploads/avatar`
- `POST /api/uploads/post-image`

## UI Screens

- `/login`
- `/register`
- `/feed`
- `/me`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`