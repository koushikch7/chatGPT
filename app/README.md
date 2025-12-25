# Multi-AI Chat

A ChatGPT-like application that integrates with multiple AI models (OpenRouter, Gemini AI, etc.) hosted on Cloudflare Pages.

## Features

- **Multi-AI Support**: Chat with various AI models including OpenRouter, Google Gemini, and Anthropic Claude.
- **User Authentication**: Secure login system (demo version uses local state).
- **API Key Management**: Users can configure their own API keys for different providers.
- **Conversation Memory**: Short-term memory for chat sessions.
- **Secure Storage**: API keys are stored securely per user (in production, use Cloudflare D1 or similar).
- **Responsive UI**: Modern, clean interface inspired by Google AI Studio and OpenAI ChatGPT.

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Deployment**: Cloudflare Pages (static export)
- **Backend**: Cloudflare Functions/Workers (planned for API calls)
- **Database**: Cloudflare D1 (planned for user data and keys)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Dev Container (VS Code)

This workspace runs in a dev container on Ubuntu 24.04.3. If using VS Code:

- Open the repository in VS Code
- Reopen in container when prompted
- Use the integrated terminal to run `npm run dev`

## Build & Export

Create a static export suitable for Cloudflare Pages:

```bash
npm run build
```

Output is generated in `out/`. You can preview locally:

```bash
npm run start
```

## Deployment to Cloudflare Pages

1. Build the project:
   ```bash
   npm run build
   ```
2. The `out/` directory contains the static files.
3. Deploy to Cloudflare Pages:
   - In Cloudflare dashboard, create a Pages project
   - Set build command to `npm run build`
   - Set build output directory to `out`
   - Optionally configure environment variables in Pages settings

## Backend Implementation

For production, implement the following:

- **Authentication**: Use Clerk, Auth0, or Cloudflare Zero Trust.
- **API Key Storage**: Use Cloudflare D1 database to store encrypted API keys per user.
- **AI API Calls**: Use Cloudflare Functions to proxy requests to AI providers, ensuring keys are not exposed to the client.
- **Conversation Memory**: Store chat history in D1 or KV.

## Supported AI Models

- OpenRouter (GPT-3.5, GPT-4, etc.)
- Google Gemini Pro
- Anthropic Claude 3 Haiku

## Environment Variables

Create a `.env.local` file with:

```
# For production auth (e.g., Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
