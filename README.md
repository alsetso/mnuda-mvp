This is a [Next.js](https://nextjs.org) project with [Supabase](https://supabase.com) backend integration for local development with Docker.

## Local Development Setup

### Prerequisites
- Docker installed and running
- Node.js 18+ installed

### Environment Setup

1. **Copy environment file:**
   ```bash
   cp env.example .env.local
   ```

2. **Start local Supabase:**
   ```bash
   npm run supabase:start
   ```

3. **Apply database migrations:**
   ```bash
   npm run supabase:reset
   ```

4. **Generate TypeScript types:**
   ```bash
   npm run types:generate
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## Development Workflow

### Daily Development
1. `npm run supabase:start` - Start local Supabase Docker container
2. Make schema changes in `supabase/migrations/*.sql` files
3. `npm run supabase:reset` - Apply changes to local database
4. `npm run types:generate` - Update TypeScript types
5. `npm run dev` - Test in Next.js app

### Database Management
- **Local Supabase Studio:** http://127.0.0.1:54323
- **API URL:** http://127.0.0.1:54321
- **Database URL:** postgresql://postgres:postgres@127.0.0.1:54322/postgres

### Available Scripts
- `npm run supabase:start` - Start local Supabase
- `npm run supabase:stop` - Stop local Supabase
- `npm run supabase:reset` - Reset database with migrations
- `npm run supabase:push` - Push migrations to production
- `npm run types:generate` - Generate TypeScript types from local DB

### RLS Debugging
- Make RLS policy changes in SQL files
- Run `npm run supabase:reset` to apply changes
- Test immediately in your app - no production risk
- Fast iteration cycle for debugging auth and permissions

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
