# Pocket - PII Manager

A secure, offline personal information manager with AES-256 encryption. Keep your sensitive data safe on your device without relying on cloud storage.

## Features

- 🔒 **End-to-End Encryption**: AES-GCM-256 encryption for all private data
- 📱 **Progressive Web App**: Install on your phone or desktop
- 🔐 **PIN Protection**: Secure access with PIN and lockout policy
- 💾 **Local Storage**: All data stays on your device using IndexedDB
- 📂 **Multiple Categories**: Cards, Net Banking, Accounts, and Notes
- 🔍 **Smart Search**: Fuzzy search across all your data
- 📤 **Export/Import**: Encrypted backups for data portability
- 🌐 **Fully Offline**: Works completely without internet

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## Security Features

- **PBKDF2 Key Derivation**: 300,000 iterations with SHA-256
- **AES-GCM-256**: Authenticated encryption for all private data
- **Lockout Policy**: Exponential backoff after failed PIN attempts
- **Auto-Lock**: Automatic locking after inactivity
- **Clipboard Security**: Auto-clear clipboard after 2 minutes
- **Web Crypto API**: Uses browser's native cryptography

## Technology Stack

- **React 18**: Modern UI library
- **TypeScript**: Type-safe code
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Beautiful icons
- **Fuse.js**: Fuzzy search
- **IndexedDB**: Browser storage
- **Web Crypto API**: Encryption

## Data Privacy

- ✅ All data stored locally in your browser
- ✅ No external API calls
- ✅ No analytics or tracking
- ✅ No cloud storage
- ✅ No account required
- ✅ Open source and transparent

## Deployment

### Hosting on GitHub Pages

This application can be securely hosted on GitHub Pages. Follow these steps:

#### 1. Create a GitHub Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Pocket PII Manager"

# Create a new repository on GitHub (replace YOUR_USERNAME with your GitHub username)
# Then add it as remote
git remote add origin https://github.com/YOUR_USERNAME/Pocket.git

# Push to GitHub
git push -u origin main
```

#### 2. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. The deployment will start automatically on every push to `main`

#### 3. Access Your Application

Your app will be available at: `https://YOUR_USERNAME.github.io/Pocket/`

**Note**: If you want to use a custom domain or different repository name, update the `base` path in `vite.config.ts`:

```typescript
base: mode === 'production' ? '/YOUR_REPO_NAME/' : '/',
```

### Security Considerations

✅ **HTTPS Only**: GitHub Pages uses HTTPS by default, ensuring secure data transmission  
✅ **No Server-Side Code**: Static hosting means no server vulnerabilities  
✅ **Client-Side Encryption**: All encryption happens in your browser  
✅ **No Backend**: No database or API to compromise  
✅ **Local Storage**: Data never leaves your device  
✅ **Open Source**: Code is auditable by anyone

### Alternative Hosting Options

You can also host this on:

- **Netlify**: Drag and drop the `dist` folder
- **Vercel**: Connect your GitHub repository
- **Cloudflare Pages**: Connect your GitHub repository
- **Self-hosted**: Copy the `dist` folder to any web server

For all hosting options, ensure:
- HTTPS is enabled
- No server-side processing is added
- No analytics or tracking scripts are injected

## License

MIT License - Feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
