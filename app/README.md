# ChatGPT Multi-AI Platform

A ChatGPT-like enterprise application that integrates with multiple AI models (OpenRouter, Gemini AI, Claude, etc.) with secure SSO authentication and persistent storage.

## Features

- **Multi-AI Support**: Chat with various AI models including OpenRouter, Google Gemini, and Anthropic Claude
- **SSO Authentication**: Secure login with Google and GitHub OAuth
- **API Key Management**: Users can configure their own API keys for different providers (encrypted storage)
- **Conversation Memory**: Short-term memory for chat sessions
- **Profile Memories**: Permanent memories stored per user
- **Project Organization**: Group conversations into projects
- **Secure Storage**: API keys encrypted with AES-256-CBC
- **Responsive UI**: Modern, clean interface inspired by Google AI Studio and ChatGPT

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js v5 with Google & GitHub OAuth
- **Database**: MySQL 8.0 with Prisma ORM
- **Deployment**: Docker with docker-compose
- **Security**: AES-256-CBC encryption for API keys

---

## Quick Start

### Option 1: Interactive Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/koushikch7/chatGPT.git
cd chatGPT/app

# Run interactive setup wizard
chmod +x setup.sh
./setup.sh

# Start with Docker MySQL
docker compose --profile mysql up -d

# Or start with external MySQL
docker compose --profile external up -d
```

### Option 2: Docker MySQL (Local Development)

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your OAuth credentials
# (See SSO_SETUP.md for OAuth setup instructions)

# Start with Docker MySQL container
docker compose --profile mysql up -d
```

### Option 3: External MySQL (Production)

```bash
# Copy environment template
cp .env.local.example .env.local

# Update DATABASE_URL to point to your MySQL server:
# DATABASE_URL=mysql://user:password@your-mysql-host:3306/chatgpt

# Start app only (no MySQL container)
docker compose --profile external up -d
```

---

## Configuration

### Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```bash
# Database (choose one)
DATABASE_URL=mysql://chatgpt:chatgptpassword@mysql:3306/chatgpt  # Docker MySQL
DATABASE_URL=mysql://user:password@your-host:3306/chatgpt       # External MySQL

# NextAuth (required)
AUTH_SECRET=your-secret-here  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=https://your-domain.com

# OAuth Providers (at least one required)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### OAuth Setup

See [SSO_SETUP.md](SSO_SETUP.md) for detailed OAuth configuration instructions.

### Nginx Reverse Proxy

See [nginx.conf.example](nginx.conf.example) for production nginx configuration with SSL.

---

## Docker Commands

```bash
# Start with Docker MySQL
docker compose --profile mysql up -d

# Start with external MySQL
docker compose --profile external up -d

# View logs
docker compose logs -f

# Stop all containers
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v

# Rebuild after code changes
docker compose build --no-cache
docker compose --profile mysql up -d
```

---

## Development

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations in production
npx prisma migrate deploy

# View database in Prisma Studio
npx prisma studio
```

---

## Supported AI Models

- **OpenRouter**: GPT-4, GPT-3.5, Claude, Llama, Mixtral, and more
- **Google Gemini**: Gemini Pro, Gemini Pro Vision
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Nginx/SSL     │────▶│   Next.js App   │
│   (Port 443)    │     │   (Port 3000)   │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐           ┌───────▼───────┐
              │  NextAuth │           │  Prisma ORM   │
              │  (OAuth)  │           │  (Database)   │
              └───────────┘           └───────┬───────┘
                                              │
                                      ┌───────▼───────┐
                                      │    MySQL      │
                                      │  (Docker or   │
                                      │   External)   │
                                      └───────────────┘
```

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT

## License

MIT License
