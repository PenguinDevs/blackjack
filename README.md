# 🃏 Blackjack Game

A modern, multiplayer Blackjack game built with Next.js, Supabase, and TypeScript. Play against other players or challenge AI bots in real-time!

## ✨ Features

- 🔐 **Secure Authentication** - Email/password and OAuth (Google, Discord, GitHub)
- 👥 **Multiplayer Games** - Play against other players in real-time
- 🤖 **AI Opponents** - Challenge intelligent bots with different difficulty levels
- 📊 **Progress Tracking** - Monitor wins, losses, and improve your strategy
- 🎮 **Responsive Design** - Play on desktop, tablet, or mobile
- ⚡ **Real-time Updates** - Live game state synchronization
- 🔄 **Automatic Backups** - Database migrations and rollbacks

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel
- **Testing**: Vitest, Playwright, Testing Library
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, Prettier, Husky

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

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

Visit [http://localhost:3000](http://localhost:3000) to see the app!

## 🔐 Authentication Setup

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

## 🧪 Testing

```bash
npm test              # Unit tests
npm run test:e2e      # E2E tests with Playwright
npm run test:coverage # Coverage report
npm run lint          # Code quality checks
npm run type-check    # TypeScript validation
```

## 📦 Deployment

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

## 🎮 How to Play

**Objective:** Get as close to 21 as possible without going over!

**Card Values:**
- Number cards: Face value
- Face cards (J, Q, K): 10 points
- Aces: 1 or 11 points

**Game Flow:**
1. Receive 2 initial cards
2. Choose to Hit (take card) or Stand (keep hand)
3. Dealer plays after all players
4. Closest to 21 without busting wins!

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Follow [Conventional Commits](https://conventionalcommits.org)
4. Submit Pull Request

**Commit Types:** `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

---

Built with ❤️ using [Next.js](https://nextjs.org), [Supabase](https://supabase.com), and [Vercel](https://vercel.com)
