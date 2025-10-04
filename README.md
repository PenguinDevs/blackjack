# Blackjack

A Next.js Blackjack game.

Built as part of a submission for the Monash Association of Coding take home task.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Anime.js
- **Backend**: Supabase (PostgreSQL, Auth)
- **Testing**: Vitest, Playwright
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, Prettier, Husky

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase (locally hosted or https://supabase.com)

### Local Development Setup

1. **Clone and install**

   ```bash
   git clone https://github.com/PenguinDevs/blackjack.git
   cd blackjack
   npm install
   ```

2. **Set up Supabase**

   ```bash
   # Start local Supabase (requires Docker)
   npx supabase start

   # Or create a project at https://supabase.com
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Run database migrations**

   ```bash
   npx supabase db reset  # Local development
   # OR
   npx supabase db push   # Remote project
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Authentication Setup

### Supabase OAuth Configuration

Configure OAuth providers in your Supabase dashboard:

**Google OAuth:**

1. [Google Cloud Console](https://console.cloud.google.com) → Create OAuth credentials
2. Redirect URI: `https://[project].supabase.co/auth/v1/callback`

**Discord OAuth:**

1. [Discord Developer Portal](https://discord.com/developers) → Create application
2. Redirect URI: `https://[project].supabase.co/auth/v1/callback`

**GitHub OAuth:**

1. GitHub Settings → Developer settings → OAuth Apps
2. Redirect URI: `https://[project].supabase.co/auth/v1/callback`

## Testing

```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests with Playwright
npm run test:coverage # Coverage report
npm run lint          # Code quality checks
npm run type-check    # TypeScript validation
```

## Deployment

### Vercel Deployment

```bash
npm install -g vercel
vercel login
vercel
```

**Required Environment Variables:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### GitHub Actions

Comprehensive CI/CD pipeline includes:

- Code quality checks (ESLint, Prettier, TypeScript)
- Automated testing (Unit, Integration, E2E)
- Performance monitoring (Lighthouse CI)
- Automatic deployments (Preview, Staging, Production)
- Database migrations and type generation

## Contributing

**Commit Types:** `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

---
