# SSO Configuration Guide for Google and GitHub

## Google OAuth Setup

1. **Go to Google Cloud Console**: Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)

2. **Create or Select Project**:
   - Click on the project dropdown at the top
   - Select an existing project or create a new one

3. **Enable Google Identity API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Identity" or "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "ChatGPT App" (or your app name)

5. **Configure Authorized Redirect URIs**:
   - Add: `http://localhost:3000/api/auth/callback/google` (for development)
   - Add: `https://yourdomain.com/api/auth/callback/google` (for production)

6. **Get Credentials**:
   - Copy the "Client ID" and "Client Secret"

## GitHub OAuth Setup

1. **Go to GitHub Settings**: Visit [https://github.com/settings/developers](https://github.com/settings/developers)

2. **Create New OAuth App**:
   - Click "OAuth Apps" > "New OAuth App"

3. **Fill Application Details**:
   - Application name: "ChatGPT App"
   - Homepage URL: `http://localhost:3000` (or your production URL)
   - Application description: "Multi-AI Chat Application"
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

4. **Register Application**:
   - Click "Register application"

5. **Get Credentials**:
   - Copy the "Client ID" and "Client Secret"

## Environment Variables

Create a `.env.local` file in your `app/` directory with:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**Note**: Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`

## Next Steps

Once you've set up the OAuth apps and added the environment variables, the authentication will be integrated into the app. Users can sign in with Google or GitHub, and their profiles will be stored locally.