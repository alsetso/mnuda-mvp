# MNUDA - Minnesota Realtors Platform

A modern, production-ready platform for Minnesota Realtors to drop pins and manage leads or listings on an interactive map.

## 🚀 Features

- **Interactive Map**: Powered by Mapbox GL JS for smooth, responsive mapping
- **Pin Management**: Drop, edit, and manage location pins
- **User Authentication**: Secure authentication with Supabase
- **Real-time Updates**: Live data synchronization
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **Production Ready**: Optimized for performance and security

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Maps**: Mapbox GL JS
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account
- Mapbox account

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/alsetso/mnuda-mvp.git
   cd mnuda-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the migrations in the `supabase/migrations/` directory
   - Enable Row Level Security (RLS) policies

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── login/             # Authentication pages
│   └── signup/
├── components/            # React components
│   ├── AppLayout.tsx      # Main app layout
│   ├── ErrorBoundary.tsx  # Error handling
│   ├── MapBox.tsx         # Map component
│   ├── PinDialog.tsx      # Pin management
│   └── ...
├── lib/                   # Utility libraries
│   ├── env.ts            # Environment validation
│   ├── supabase.ts       # Supabase client
│   ├── locationService.ts # Location utilities
│   └── pinService.ts     # Pin management
└── types/                 # TypeScript type definitions
    └── pin.ts
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run analyze` - Analyze bundle size
- `npm run preview` - Preview production build
- `npm run clean` - Clean build artifacts

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` | Mapbox access token | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | No |
| `NEXT_PUBLIC_APP_NAME` | Application name | No |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Application description | No |

### Supabase Setup

1. Create a new Supabase project
2. Run the provided migrations
3. Set up Row Level Security policies
4. Configure authentication providers

## 🎨 Styling

The project uses Tailwind CSS with custom MNUDA brand colors:

- **Primary Blue**: `#014463` (mnuda-dark-blue)
- **Accent Blue**: `#1dd1f5` (mnuda-light-blue)

## 🔒 Security

- Environment variable validation
- Error boundaries for graceful error handling
- Security headers configured
- Type-safe API calls
- Row Level Security (RLS) enabled

## 📊 Performance

- Next.js 14 optimizations
- Image optimization
- Bundle analysis tools
- TypeScript strict mode
- Production-ready configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@mnuda.com or create an issue in the repository.

## 🔗 Links

- [Live Demo](https://mnuda.com)
- [Documentation](https://docs.mnuda.com)
- [API Reference](https://api.mnuda.com/docs)